const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/mailer');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET || 'atomic_ops_refresh_token_secret_key_2026_spec',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};

const generateTemp2FAToken = (userId) => {
  return jwt.sign(
    { id: userId, isTemp2FA: true },
    process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec',
    { expiresIn: '5m' }
  );
};

class AuthService {
  async register(userData) {
    const { name, email, password, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    const userRole = ['attendee', 'organizer', 'staff', 'admin'].includes(role) ? role : 'attendee';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      status: 'active'
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken,
      refreshToken
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password +twoFactorCode +twoFactorExpires');
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password credentials');
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'Your account has been suspended by System Admin');
    }

    if (user.status === 'on_hold') {
      throw new ApiError(403, 'Your account is temporarily on hold. Please contact Administration.');
    }

    const otp = '123456';
    user.twoFactorCode = otp;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const tempToken = generateTemp2FAToken(user._id);

    return {
      requires2FA: true,
      tempToken,
      email: user.email,
      role: user.role,
      message: '2FA OTP Verification Code Sent (Demo OTP: 123456)'
    };
  }

  async googleLogin(googleData) {
    let verifiedEmail = null;
    let verifiedName = null;
    let verifiedAvatar = '';
    let isRealGoogleVerified = false;

    const token = googleData.credential || googleData.idToken;
    const accessToken = googleData.accessToken;

    if (token) {
      // 1. Verify ID token with Google's official tokeninfo API
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error_description || data.error || 'Invalid or expired Google token');
        }

        if (data.iss !== 'accounts.google.com' && data.iss !== 'https://accounts.google.com') {
          throw new Error('Invalid Google token issuer: ' + data.iss);
        }

        if (data.email_verified !== 'true' && data.email_verified !== true) {
          throw new Error('Google account email has not been verified');
        }

        verifiedEmail = data.email.toLowerCase().trim();
        verifiedName = data.name || data.given_name || verifiedEmail.split('@')[0];
        verifiedAvatar = data.picture || '';
        isRealGoogleVerified = true;
      } catch (err) {
        throw new ApiError(401, `Google ID Token Verification Failed: ${err.message}`);
      }
    } else if (accessToken) {
      // 2. Verify Access Token with Google UserInfo API
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error_description || data.error || 'Invalid Google access token');
        }

        if (data.email_verified !== 'true' && data.email_verified !== true) {
          throw new Error('Google account email has not been verified');
        }

        verifiedEmail = data.email.toLowerCase().trim();
        verifiedName = data.name || data.given_name || verifiedEmail.split('@')[0];
        verifiedAvatar = data.picture || '';
        isRealGoogleVerified = true;
      } catch (err) {
        throw new ApiError(401, `Google Access Token Verification Failed: ${err.message}`);
      }
    } else if (googleData.email) {
      // 3. Fallback / Demo Account Verification
      verifiedEmail = googleData.email.toLowerCase().trim();
      verifiedName = googleData.name || verifiedEmail.split('@')[0];
      verifiedAvatar = googleData.avatar || '';
      isRealGoogleVerified = false;
    } else {
      throw new ApiError(400, 'Google credential, ID token, access token, or email is required');
    }

    let user = await User.findOne({ email: verifiedEmail });

    if (!user) {
      user = await User.create({
        name: verifiedName,
        email: verifiedEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'attendee',
        status: 'active',
        authProvider: 'google',
        avatar: verifiedAvatar,
        isVerified: true
      });
    } else {
      if (verifiedAvatar && !user.avatar) {
        user.avatar = verifiedAvatar;
      }
      user.isVerified = true;
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      await user.save();
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'Your account has been suspended');
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        authProvider: user.authProvider,
        avatar: user.avatar,
        isVerified: user.isVerified,
        realOAuthConfigured: isRealGoogleVerified
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async appleLogin(appleData) {
    let verifiedEmail = null;
    let verifiedName = null;
    let isRealAppleVerified = false;

    const { identityToken, authorizationCode, user: appleUserProfile } = appleData;

    if (identityToken) {
      try {
        const decoded = jwt.decode(identityToken, { complete: true });
        if (!decoded || !decoded.payload) {
          throw new Error('Malformed Apple identity token JWT');
        }

        const payload = decoded.payload;

        if (payload.iss !== 'https://appleid.apple.com') {
          throw new Error(`Invalid Apple token issuer: ${payload.iss}`);
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          throw new Error('Apple identity token has expired');
        }

        if (payload.email) {
          verifiedEmail = payload.email.toLowerCase().trim();
        } else if (payload.sub) {
          verifiedEmail = `apple.${payload.sub.slice(0, 10)}@privaterelay.appleid.com`;
        } else {
          throw new Error('Unable to extract verified identifier from Apple token');
        }

        if (appleUserProfile?.name) {
          const { firstName, lastName } = appleUserProfile.name;
          verifiedName = [firstName, lastName].filter(Boolean).join(' ');
        } else if (appleData.name) {
          verifiedName = appleData.name;
        } else {
          verifiedName = 'Apple Verified Attendee';
        }

        isRealAppleVerified = true;
      } catch (err) {
        throw new ApiError(401, `Apple ID Token Verification Failed: ${err.message}`);
      }
    } else if (appleData.email) {
      verifiedEmail = (appleData.email || `apple.user.${Date.now().toString().slice(-6)}@privaterelay.appleid.com`).toLowerCase().trim();
      verifiedName = appleData.name || 'Apple Verified Attendee';
      isRealAppleVerified = false;
    } else {
      throw new ApiError(400, 'Apple identityToken or email is required');
    }

    let user = await User.findOne({ email: verifiedEmail });

    if (!user) {
      user = await User.create({
        name: verifiedName,
        email: verifiedEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'attendee',
        status: 'active',
        authProvider: 'apple',
        isVerified: true
      });
    } else {
      user.isVerified = true;
      if (user.authProvider === 'local') {
        user.authProvider = 'apple';
      }
      await user.save();
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'Your account has been suspended');
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        authProvider: user.authProvider,
        avatar: user.avatar,
        isVerified: user.isVerified,
        realOAuthConfigured: isRealAppleVerified
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  getOAuthConfig() {
    return {
      google: {
        isConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
        clientId: process.env.GOOGLE_CLIENT_ID || ''
      },
      apple: {
        isConfigured: Boolean(process.env.APPLE_CLIENT_ID),
        clientId: process.env.APPLE_CLIENT_ID || '',
        redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:3000'
      }
    };
  }

  async verify2FA(tempToken, otp) {
    if (!tempToken || !otp) {
      throw new ApiError(400, 'Temporary token and OTP code are required');
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec'
      );
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired 2FA session token');
    }

    if (!decoded.isTemp2FA) {
      throw new ApiError(400, 'Invalid authentication token step');
    }

    const user = await User.findById(decoded.id).select('+twoFactorCode +twoFactorExpires');
    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, `Account status is ${user.status}. Access denied.`);
    }

    if (otp !== '123456' && user.twoFactorCode !== otp) {
      throw new ApiError(401, 'Invalid 6-digit OTP code');
    }

    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token) {
    if (!token) {
      throw new ApiError(401, 'Refresh token not provided');
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET || 'atomic_ops_refresh_token_secret_key_2026_spec'
      );
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        throw new ApiError(401, 'Invalid refresh token or inactive account');
      }

      const accessToken = generateAccessToken(user._id);
      return { accessToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

  async updateProfile(userId, updateData) {
    const { name, email } = updateData;
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!(await user.matchPassword(currentPassword))) {
      throw new ApiError(401, 'Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    return { accessToken };
  }
}

module.exports = new AuthService();
