const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validations/authValidation');

router.post('/register', authLimiter, validate(registerSchema), catchAsync(authController.register));
router.post('/login', authLimiter, validate(loginSchema), catchAsync(authController.login));
router.post('/google', authLimiter, catchAsync(authController.googleLogin));
router.post('/apple', authLimiter, catchAsync(authController.appleLogin));
router.get('/oauth-config', catchAsync(authController.getOAuthConfig));
router.post('/verify-2fa', authLimiter, catchAsync(authController.verify2FA));
router.post('/refresh', catchAsync(authController.refreshToken));
router.get('/me', auth, catchAsync(authController.getMe));
router.put('/update-profile', auth, validate(updateProfileSchema), catchAsync(authController.updateProfile));
router.put('/update-password', auth, validate(updatePasswordSchema), catchAsync(authController.updatePassword));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), catchAsync(authController.forgotPassword));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), catchAsync(authController.resetPassword));
router.post('/logout', auth, catchAsync(authController.logout));

module.exports = router;
