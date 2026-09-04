const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { createReviewSchema } = require('../validations/reviewValidation');

router.post('/reviews', auth, validate(createReviewSchema), catchAsync(reviewController.createReview));
router.get('/events/:eventId/reviews', catchAsync(reviewController.getReviewsByEvent));
router.delete('/reviews/:id', auth, catchAsync(reviewController.deleteReview));

module.exports = router;
