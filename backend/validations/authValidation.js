const Joi = require('joi');

const registerSchema = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().min(2).max(100),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('attendee', 'organizer', 'admin').default('attendee')
  })
};

const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required()
  })
};

const updateProfileSchema = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email().lowercase().trim()
  })
};

const updatePasswordSchema = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  })
};

const forgotPasswordSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email()
  })
};

const resetPasswordSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    resetToken: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  })
};

const googleAuthSchema = {
  body: Joi.object().keys({
    idToken: Joi.string().required(),
    credential: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    name: Joi.string().allow('', null),
    avatar: Joi.string().allow('', null)
  }).unknown(true)
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema
};
