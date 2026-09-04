const Joi = require('joi');

const createReviewSchema = {
  body: Joi.object().keys({
    bookingId: Joi.string().required().hex().length(24),
    eventId: Joi.string().required().hex().length(24),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().required().trim().min(3).max(1000)
  })
};

module.exports = {
  createReviewSchema
};
