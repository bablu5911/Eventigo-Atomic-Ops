const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  if (!schema) return next();

  const objectToValidate = {};
  if (schema.body) objectToValidate.body = req.body;
  if (schema.query) objectToValidate.query = req.query;
  if (schema.params) objectToValidate.params = req.params;

  // If schema is a direct Joi schema object without body/query keys
  if (typeof schema.validate === 'function') {
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    req.body = value;
    return next();
  }

  const Joi = require('joi');
  const compiledSchema = Joi.object(schema);
  const { error, value } = compiledSchema.validate(objectToValidate, { abortEarly: false, allowUnknown: true });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }

  if (value.body) req.body = value.body;
  if (value.query) req.query = value.query;
  if (value.params) req.params = value.params;

  return next();
};

module.exports = validate;
