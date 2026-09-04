const Joi = require('joi');

const createPromoCodeSchema = {
  body: Joi.object().keys({
    scope: Joi.string().valid('all', 'event').default('all'),
    eventId: Joi.string().allow('', null).optional(),
    code: Joi.string().required().trim().uppercase().min(3).max(20),
    discountType: Joi.string().valid('flat', 'percentage').required(),
    value: Joi.number().min(0).required(),
    usageLimit: Joi.number().integer().min(1).allow(null),
    perUserLimit: Joi.number().integer().min(1).default(1),
    isNewUserOnly: Joi.boolean().default(false),
    validFrom: Joi.date().iso().allow(null, '').optional(),
    validUntil: Joi.date().iso().allow(null, '').optional(),
    isActive: Joi.boolean().default(true)
  })
};

const validatePromoCodeSchema = {
  body: Joi.object().keys({
    eventId: Joi.string().allow('', null).optional(),
    code: Joi.string().required().trim().uppercase()
  })
};

module.exports = {
  createPromoCodeSchema,
  validatePromoCodeSchema
};
