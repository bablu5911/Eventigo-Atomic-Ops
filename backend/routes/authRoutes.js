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
  resetPasswordSchema,
  googleAuthSchema
} = require('../validations/authValidation');

router.post('/register', authLimiter, validate(registerSchema), catchAsync(authController.register));
router.post('/login', authLimiter, validate(loginSchema), catchAsync(authController.login));

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate user using Google OAuth ID token
 *     description: Verifies Google ID token against Google OAuth2 service, provisions user if new, and issues JWT access and refresh tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Cryptographic Google ID token from GIS or @react-oauth/google
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Missing or invalid ID token
 *       401:
 *         description: Google token verification failed
 */
router.post('/google', authLimiter, validate(googleAuthSchema), catchAsync(authController.googleLogin));
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
