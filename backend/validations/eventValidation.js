const Joi = require('joi');

const createEventSchema = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().min(3).max(200),
    categoryId: Joi.string().allow('', null),
    description: Joi.string().required().trim(),
    banner: Joi.string().allow('', null),
    venue: Joi.object().keys({
      name: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      city: Joi.string().allow('', null)
    }),
    startDateTime: Joi.date().iso().required(),
    endDateTime: Joi.date().iso().required(),
    isOnline: Joi.boolean().default(false),
    meetingLink: Joi.string().allow('', null),
    totalCapacity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').default('published'),
    tierName: Joi.string().allow('', null),
    tierPrice: Joi.number().min(0).allow(null),
    tierQuantity: Joi.number().min(1).allow(null)
  })
};

const updateEventSchema = {
  body: Joi.object().keys({
    title: Joi.string().trim().min(3).max(200),
    categoryId: Joi.string(),
    description: Joi.string().trim(),
    banner: Joi.string().allow('', null),
    venue: Joi.object().keys({
      name: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      city: Joi.string().allow('', null)
    }),
    startDateTime: Joi.date().iso(),
    endDateTime: Joi.date().iso(),
    isOnline: Joi.boolean(),
    meetingLink: Joi.string().allow('', null),
    totalCapacity: Joi.number().integer().min(1),
    status: Joi.string().valid('draft', 'published', 'cancelled', 'completed'),
    isApproved: Joi.boolean()
  })
};

module.exports = {
  createEventSchema,
  updateEventSchema
};
