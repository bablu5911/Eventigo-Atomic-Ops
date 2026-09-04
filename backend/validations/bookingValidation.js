const Joi = require('joi');

const createBookingSchema = {
  body: Joi.object().keys({
    eventId: Joi.string().required().hex().length(24),
    tickets: Joi.array()
      .items(
        Joi.object().keys({
          ticketTypeId: Joi.string().required().hex().length(24),
          quantity: Joi.number().integer().min(1).required()
        })
      )
      .min(1)
      .required(),
    promoCode: Joi.string().allow('', null).trim().uppercase(),
    paymentMethod: Joi.string().allow('', null),
    paymentDetails: Joi.object().allow(null),
    transactionId: Joi.string().allow('', null)
  })
};

const checkInSchema = {
  body: Joi.object().keys({
    bookingCode: Joi.string().required().trim(),
    eventId: Joi.string().allow('', null).optional(),
    admitCount: Joi.number().integer().min(1).optional()
  })
};

const earlyExitSchema = {
  body: Joi.object().keys({
    bookingCode: Joi.string().required().trim(),
    eventId: Joi.string().allow('', null).optional(),
    exitCount: Joi.number().integer().min(1).optional(),
    minutesEarly: Joi.number().integer().min(1).max(120).optional()
  })
};

module.exports = {
  createBookingSchema,
  checkInSchema,
  earlyExitSchema
};
