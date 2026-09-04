const Joi = require('joi');

const createTicketTypeSchema = {
  body: Joi.object().keys({
    eventId: Joi.string().required().hex().length(24),
    name: Joi.string().required().trim().min(2).max(100),
    price: Joi.number().min(0).required(),
    totalQuantity: Joi.number().integer().min(1).required(),
    maxPerUser: Joi.number().integer().min(1).default(5),
    saleStartDate: Joi.date().iso().required(),
    saleEndDate: Joi.date().iso().greater(Joi.ref('saleStartDate')).required(),
    description: Joi.string().allow('', null)
  })
};

const updateTicketTypeSchema = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100),
    price: Joi.number().min(0),
    totalQuantity: Joi.number().integer().min(1),
    maxPerUser: Joi.number().integer().min(1),
    saleStartDate: Joi.date().iso(),
    saleEndDate: Joi.date().iso(),
    description: Joi.string().allow('', null)
  })
};

module.exports = {
  createTicketTypeSchema,
  updateTicketTypeSchema
};
