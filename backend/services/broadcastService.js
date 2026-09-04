const BroadcastNotification = require('../models/BroadcastNotification');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');

/**
 * Send an event-bound broadcast directive
 */
const createBroadcast = async ({ eventId, organizerId, userRole, title, message, priority, targetGate }) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Target event not found');
  }

  // Authorize: Only event organizer or admin/superadmin can broadcast
  const orgId = (event.organizer?._id || event.organizer || '').toString();
  if (userRole !== 'admin' && userRole !== 'superadmin' && orgId !== organizerId.toString()) {
    throw new ApiError(403, 'Unauthorized: You can only broadcast alerts to events you organize');
  }

  // Count confirmed ticket holders for this event
  const eligibleBookings = await Booking.find({
    event: eventId,
    status: { $in: ['confirmed', 'partially_checked_in'] }
  });

  const uniqueAttendeeIds = new Set(
    eligibleBookings.map((b) => (b.user?._id || b.user || '').toString()).filter(Boolean)
  );
  const recipientCount = uniqueAttendeeIds.size;

  const broadcast = await BroadcastNotification.create({
    event: eventId,
    organizer: organizerId,
    title: title.trim(),
    message: message.trim(),
    priority: priority || 'gate_directive',
    targetGate: targetGate || 'All Gates',
    active: true,
    sentAt: new Date()
  });

  return {
    broadcast,
    recipientCount,
    eventTitle: event.title
  };
};

/**
 * Get all broadcasts for a specific event (organizer/staff view)
 */
const getEventBroadcasts = async (eventId) => {
  const broadcasts = await BroadcastNotification.find({
    event: eventId,
    active: true
  })
    .populate('organizer', 'name email')
    .sort({ sentAt: -1, createdAt: -1 });

  return broadcasts;
};

/**
 * Get active broadcasts strictly for events the current user holds confirmed tickets for
 */
const getAttendeeBroadcasts = async (userId) => {
  if (!userId) return [];

  // 1. Fetch user's active bookings
  const userBookings = await Booking.find({
    user: userId,
    status: { $in: ['confirmed', 'partially_checked_in'] }
  }).select('event');

  if (!userBookings || userBookings.length === 0) {
    return [];
  }

  // 2. Extract distinct event IDs
  const eventIds = [
    ...new Set(
      userBookings
        .map((b) => (b.event?._id || b.event || '').toString())
        .filter((id) => id.length > 0)
    )
  ];

  if (eventIds.length === 0) {
    return [];
  }

  // 3. Find active broadcasts matching only these events
  const broadcasts = await BroadcastNotification.find({
    event: { $in: eventIds },
    active: true
  })
    .populate('event', 'title bannerImage venue date status')
    .populate('organizer', 'name')
    .sort({ sentAt: -1, createdAt: -1 });

  return broadcasts;
};

/**
 * Deactivate / delete a broadcast
 */
const deleteBroadcast = async (broadcastId, userId, userRole) => {
  const broadcast = await BroadcastNotification.findById(broadcastId);
  if (!broadcast) {
    throw new ApiError(404, 'Broadcast notification not found');
  }

  const orgId = (broadcast.organizer?._id || broadcast.organizer || '').toString();
  if (userRole !== 'admin' && userRole !== 'superadmin' && orgId !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to dismiss or delete this broadcast');
  }

  broadcast.active = false;
  await broadcast.save();

  return { message: 'Broadcast deactivated successfully' };
};

module.exports = {
  createBroadcast,
  getEventBroadcasts,
  getAttendeeBroadcasts,
  deleteBroadcast
};
