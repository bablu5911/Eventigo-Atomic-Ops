const ticketTypeService = require('../services/ticketTypeService');

const getTicketTypesByEvent = async (req, res) => {
  const ticketTypes = await ticketTypeService.getTicketTypesByEvent(req.params.eventId);
  res.status(200).json({
    success: true,
    ticketTypes
  });
};

const createTicketType = async (req, res) => {
  const ticketType = await ticketTypeService.createTicketType(req.user.id, req.user.role, req.body);
  res.status(201).json({
    success: true,
    ticketType
  });
};

const updateTicketType = async (req, res) => {
  const ticketType = await ticketTypeService.updateTicketType(req.params.id, req.user.id, req.user.role, req.body);
  res.status(200).json({
    success: true,
    ticketType
  });
};

const deleteTicketType = async (req, res) => {
  const result = await ticketTypeService.deleteTicketType(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    message: result.message
  });
};

const getAllTicketTypes = async (req, res) => {
  const TicketType = require('../models/TicketType');
  const ticketTypes = await TicketType.find().populate('event', 'title eventId venue');
  res.status(200).json({
    success: true,
    ticketTypes
  });
};

module.exports = {
  getTicketTypesByEvent,
  getAllTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
};
