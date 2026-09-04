const Joi = require('joi');

const categorySchema = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().min(2).max(50),
    description: Joi.string().allow('', null)
  })
};

module.exports = {
  categorySchema
};
