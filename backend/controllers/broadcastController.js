const broadcastService = require('../services/broadcastService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Send broadcast notification for an event
 * @route   POST /api/broadcasts/events/:eventId
 * @access  Private (Organizer, Admin, Superadmin)
 */
const createBroadcast = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { title, message, priority, targetGate } = req.body;

    if (!title || !message) {
      throw new ApiError(400, 'Title and message are required for broadcasting directives');
    }

    const result = await broadcastService.createBroadcast({
      eventId,
      organizerId: req.user._id,
      userRole: req.user.role,
      title,
      message,
      priority,
      targetGate
    });

    res.status(201).json({
      success: true,
      data: result.broadcast,
      recipientCount: result.recipientCount,
      message: `Directive broadcasted successfully to ${result.recipientCount} ticket holders.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active broadcasts for an event
 * @route   GET /api/broadcasts/events/:eventId
 * @access  Private (Staff, Organizer, Admin, Superadmin)
 */
const getEventBroadcasts = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const broadcasts = await broadcastService.getEventBroadcasts(eventId);

    res.json({
      success: true,
      count: broadcasts.length,
      data: broadcasts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active broadcasts for events the logged-in attendee holds tickets for
 * @route   GET /api/broadcasts/my-alerts
 * @access  Private (All authenticated users)
 */
const getMyAlerts = async (req, res, next) => {
  try {
    const broadcasts = await broadcastService.getAttendeeBroadcasts(req.user._id);

    res.json({
      success: true,
      count: broadcasts.length,
      data: broadcasts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate a broadcast directive
 * @route   DELETE /api/broadcasts/:id
 * @access  Private (Organizer, Admin, Superadmin)
 */
const deleteBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await broadcastService.deleteBroadcast(id, req.user._id, req.user.role);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBroadcast,
  getEventBroadcasts,
  getMyAlerts,
  deleteBroadcast
};
