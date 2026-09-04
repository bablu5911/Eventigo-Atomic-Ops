const reviewService = require('../services/reviewService');

const createReview = async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json({
    success: true,
    review
  });
};

const getReviewsByEvent = async (req, res) => {
  const result = await reviewService.getReviewsByEvent(req.params.eventId);
  res.status(200).json({
    success: true,
    reviews: result.reviews,
    avgRating: result.avgRating,
    totalReviews: result.totalReviews
  });
};

const deleteReview = async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    message: result.message
  });
};

module.exports = {
  createReview,
  getReviewsByEvent,
  deleteReview
};
