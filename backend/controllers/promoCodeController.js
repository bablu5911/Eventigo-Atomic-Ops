const promoCodeService = require('../services/promoCodeService');

const createPromoCode = async (req, res) => {
  const promoCode = await promoCodeService.createPromoCode(req.user.id, req.user.role, req.body);
  res.status(201).json({
    success: true,
    promoCode
  });
};

const validatePromoCode = async (req, res) => {
  const { eventId, code } = req.body;
  const promoCode = await promoCodeService.validatePromoCode(eventId, code, req.user?.id);
  res.status(200).json({
    success: true,
    promoCode
  });
};

const getPromoCodesByEvent = async (req, res) => {
  const promoCodes = await promoCodeService.getPromoCodesByEvent(req.params.eventId, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    promoCodes
  });
};

const getAllPromoCodes = async (req, res) => {
  const promoCodes = await promoCodeService.getAllPromoCodes(req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    promoCodes
  });
};

const togglePromoCodeStatus = async (req, res) => {
  const result = await promoCodeService.togglePromoCodeStatus(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    isActive: result.isActive,
    message: result.message
  });
};

const deletePromoCode = async (req, res) => {
  const result = await promoCodeService.deletePromoCode(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    message: result.message
  });
};

const getMyRewards = async (req, res) => {
  const rewards = await promoCodeService.getUserActiveRewards(req.user.id);
  res.status(200).json({
    success: true,
    rewards
  });
};

module.exports = {
  createPromoCode,
  validatePromoCode,
  getAllPromoCodes,
  getPromoCodesByEvent,
  togglePromoCodeStatus,
  deletePromoCode,
  getMyRewards
};
