const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

class ReviewService {
  async createReview(userId, data) {
    const { bookingId, eventId, rating, comment } = data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to review this booking');
    }

    if (booking.event.toString() !== eventId.toString()) {
      throw new ApiError(400, 'Booking does not match event ID');
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      throw new ApiError(400, 'Review already submitted for this booking');
    }

    const review = await Review.create({
      booking: bookingId,
      event: eventId,
      user: userId,
      rating,
      comment
    });

    return await review.populate('user', 'name');
  }

  async getReviewsByEvent(eventId) {
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : 0;

    return {
      reviews,
      avgRating: Number(avgRating),
      totalReviews
    };
  }

  async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (userRole !== 'admin' && review.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);
    return { message: 'Review deleted successfully' };
  }
}

module.exports = new ReviewService();
