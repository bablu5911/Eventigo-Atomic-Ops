const authService = require('../services/authService');

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const register = async (req, res) => {
  const result = await authService.register(req.body);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
};

const login = async (req, res) => {
  const { email, username, identifier, id, password } = req.body;
  const loginIdentifier = email || username || identifier || id;
  const result = await authService.login(loginIdentifier, password);

  if (result.requires2FA) {
    return res.status(200).json({
      success: true,
      requires2FA: true,
      tempToken: result.tempToken,
      email: result.email,
      role: result.role,
      message: result.message
    });
  }

  setRefreshTokenCookie(res, result.refreshToken);
  return res.status(200).json({
    success: true,
    requires2FA: false,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    },
    message: 'Login successful'
  });
};

const googleLogin = async (req, res) => {
  const { idToken, credential, accessToken, email, name, avatar } = req.body;
  const tokenToVerify = idToken || credential;

  if (tokenToVerify) {
    const userDoc = await authService.verifyAndLoginGoogle(tokenToVerify);
    const newAccessToken = authService.generateAccessToken(userDoc._id);
    const newRefreshToken = authService.generateRefreshToken(userDoc._id);
    setRefreshTokenCookie(res, newRefreshToken);

    const userPayload = {
      id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      status: userDoc.status,
      provider: userDoc.provider || 'google',
      providerId: userDoc.providerId,
      avatar: userDoc.avatar || ''
    };

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: userPayload,
      data: {
        user: userPayload,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  }

  const result = await authService.googleLogin({ email, name, credential, idToken, accessToken, avatar });
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({
    success: true,
    message: 'Google authentication successful',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
};

const appleLogin = async (req, res) => {
  const { email, name, identityToken, authorizationCode, user } = req.body;
  const result = await authService.appleLogin({ email, name, identityToken, authorizationCode, user });
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({
    success: true,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
};

const getOAuthConfig = async (req, res) => {
  const config = authService.getOAuthConfig();
  res.status(200).json({
    success: true,
    config
  });
};

const verify2FA = async (req, res) => {
  const { tempToken, otp } = req.body;
  const result = await authService.verify2FA(tempToken, otp);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({
    success: true,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
};

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshToken(token);
  res.status(200).json({
    success: true,
    token: result.accessToken
  });
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    success: true,
    user
  });
};

const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    user
  });
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.updatePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token: result.accessToken
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.status(200).json({
    success: true,
    message: 'Reset token sent to email',
    resetToken: result.resetToken
  });
};

const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  const result = await authService.resetPassword(email, resetToken, newPassword);
  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token: result.accessToken
  });
};

const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  appleLogin,
  getOAuthConfig,
  verify2FA,
  refreshToken,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout
};
