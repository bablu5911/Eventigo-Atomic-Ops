const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const auth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'Not authorized, no token provided'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'User not found or token invalid'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized, token failed verification'));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec'
      );
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore error for optional authentication
  }
  next();
};

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;

