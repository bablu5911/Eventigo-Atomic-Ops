const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const { auth, optionalAuth } = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { createPromoCodeSchema, validatePromoCodeSchema } = require('../validations/promoCodeValidation');

// Create Promo Code (supports /promo-codes and /promocodes)
router.post('/promo-codes', auth, authorize('organizer', 'admin', 'superadmin'), validate(createPromoCodeSchema), catchAsync(promoCodeController.createPromoCode));
router.post('/promocodes', auth, authorize('organizer', 'admin', 'superadmin'), validate(createPromoCodeSchema), catchAsync(promoCodeController.createPromoCode));

// Validate Promo Code (supports optional auth for per-user limit check)
router.post('/promo-codes/validate', optionalAuth, validate(validatePromoCodeSchema), catchAsync(promoCodeController.validatePromoCode));
router.post('/promocodes/validate', optionalAuth, validate(validatePromoCodeSchema), catchAsync(promoCodeController.validatePromoCode));

// User Active Rewards (Early Exit Crowd Management coupons)
router.get('/promo-codes/my-rewards', auth, catchAsync(promoCodeController.getMyRewards));
router.get('/promocodes/my-rewards', auth, catchAsync(promoCodeController.getMyRewards));

// List All Promo Codes (Admin sees all, Organizer sees own)
router.get('/promo-codes', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.getAllPromoCodes));
router.get('/promocodes', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.getAllPromoCodes));

// Toggle Promo Code Active Status
router.patch('/promo-codes/:id/toggle', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.togglePromoCodeStatus));
router.patch('/promocodes/:id/toggle', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.togglePromoCodeStatus));

// Get & Delete
router.get('/events/:eventId/promo-codes', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.getPromoCodesByEvent));
router.get('/events/:eventId/promocodes', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.getPromoCodesByEvent));
router.delete('/promo-codes/:id', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.deletePromoCode));
router.delete('/promocodes/:id', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(promoCodeController.deletePromoCode));

module.exports = router;
