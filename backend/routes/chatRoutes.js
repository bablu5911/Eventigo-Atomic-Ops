const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const catchAsync = require('../middlewares/catchAsync');

// Chat is accessible by internal team roles: staff, organizer, admin, superadmin
router.use(auth, authorize('organizer', 'staff', 'admin', 'superadmin'));

router.get('/messages', catchAsync(chatController.getMessages));
router.post('/messages', catchAsync(chatController.sendMessage));

module.exports = router;
