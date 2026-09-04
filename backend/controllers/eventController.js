const eventService = require('../services/eventService');

const createEvent = async (req, res) => {
  const event = await eventService.createEvent(req.user.id, req.body);
  res.status(201).json({
    success: true,
    event
  });
};

const getAllEvents = async (req, res) => {
  const result = await eventService.getAllEvents(req.query);
  res.status(200).json({
    success: true,
    events: result.events,
    pagination: result.pagination
  });
};

const getEventBySlugOrId = async (req, res) => {
  const result = await eventService.getEventBySlugOrId(req.params.slugOrId);
  res.status(200).json({
    success: true,
    event: result.event,
    ticketTypes: result.ticketTypes
  });
};

const updateEvent = async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.user.id, req.user.role, req.body);
  res.status(200).json({
    success: true,
    event
  });
};

const deleteEvent = async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    success: true,
    message: result.message
  });
};

const getOrganizerEvents = async (req, res) => {
  const events = await eventService.getOrganizerEvents(req.user.id);
  res.status(200).json({
    success: true,
    events
  });
};

const toggleApproval = async (req, res) => {
  const { isApproved } = req.body;
  const event = await eventService.toggleApproval(req.params.id, isApproved);
  res.status(200).json({
    success: true,
    event
  });
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventBySlugOrId,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  toggleApproval
};
