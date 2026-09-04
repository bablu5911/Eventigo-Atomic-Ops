const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const catchAsync = require('../middlewares/catchAsync');

// Hard protection: only superadmin can access these routes
router.use(auth, authorize('superadmin'));

// Admin Management
router.get('/admins', catchAsync(superadminController.getAllAdmins));
router.post('/admins', catchAsync(superadminController.createOrPromoteAdmin));
router.patch('/admins/:id/status', catchAsync(superadminController.updateAdminStatus));
router.patch('/admins/:id/demote', catchAsync(superadminController.demoteAdmin));
router.delete('/admins/:id', catchAsync(superadminController.deleteAdmin));

// Venue & Gate Lockdown Controls
router.get('/venue-settings', catchAsync(superadminController.getVenueSettings));
router.put('/venue-settings', catchAsync(superadminController.updateVenueSettings));
router.post('/lockdown', catchAsync(superadminController.toggleEmergencyGateLockdown));

// Financial Settlements & Telemetry
router.get('/settlements', catchAsync(superadminController.getSettlementSummary));
router.post('/settlements', catchAsync(superadminController.executeSettlement));
router.get('/diagnostics', catchAsync(superadminController.getSystemDiagnostics));

module.exports = router;
