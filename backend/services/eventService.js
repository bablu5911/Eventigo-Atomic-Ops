const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

class EventService {
  async createEvent(organizerId, eventData) {
    const User = require('../models/User');
    const user = await User.findById(organizerId);
    if (user && user.role === 'attendee') {
      user.role = 'organizer';
      await user.save();
    }

    const {
      title,
      categoryId,
      description,
      banner,
      venue,
      startDateTime,
      endDateTime,
      isOnline,
      meetingLink,
      totalCapacity,
      status,
      tierName,
      tierPrice,
      tierQuantity
    } = eventData;

    let targetCategoryId = categoryId;
    let category = null;
    if (categoryId) {
      category = await Category.findById(categoryId);
    }
    if (!category) {
      category = await Category.findOne({});
      if (!category) {
        category = await Category.create({ name: 'General Events', slug: 'general-events' });
      }
      targetCategoryId = category._id;
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const crypto = require('crypto');
    const assignedEventId = eventData.eventId
      ? eventData.eventId.toUpperCase().trim()
      : `EVT-2026-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const event = await Event.create({
      organizer: organizerId,
      title,
      slug,
      eventId: assignedEventId,
      category: targetCategoryId,
      description,
      banner: banner || '',
      venue: venue || {},
      startDateTime,
      endDateTime,
      isOnline: Boolean(isOnline),
      meetingLink: meetingLink || '',
      totalCapacity: Number(totalCapacity) || 100,
      status: status || 'published',
      isApproved: true
    });

    // Create initial ticket tier so tickets are immediately bookable
    const price = tierPrice !== undefined && tierPrice !== null ? Number(tierPrice) : 49.99;
    const qty = tierQuantity ? Number(tierQuantity) : Number(totalCapacity) || 100;
    const name = tierName || 'General Admission Pass';

    await TicketType.create({
      event: event._id,
      name,
      price,
      totalQuantity: qty,
      soldQuantity: 0,
      maxPerUser: 5,
      saleStartDate: new Date(Date.now() - 3600000),
      saleEndDate: new Date(endDateTime),
      description: 'Standard event entry pass with full access.'
    });

    return event;
  }

  async getAllEvents(queryParams) {
    const { search, category, isOnline, city, page = 1, limit = 10, status = 'published' } = queryParams;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (isOnline !== undefined) {
      query.isOnline = isOnline === 'true';
    }

    if (city) {
      query['venue.city'] = new RegExp(city, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .populate('category', 'name slug')
      .populate('organizer', 'name email')
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    return {
      events,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  async getEventBySlugOrId(identifier) {
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const isEventId = typeof identifier === 'string' && identifier.toUpperCase().startsWith('EVT-');
    let query;
    if (isObjectId) {
      query = { _id: identifier };
    } else if (isEventId) {
      query = { eventId: identifier.toUpperCase() };
    } else {
      query = { slug: identifier };
    }

    const event = await Event.findOne(query)
      .populate('category', 'name slug')
      .populate('organizer', 'name email');

    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    const ticketTypes = await TicketType.find({ event: event._id });

    return { event, ticketTypes };
  }

  async updateEvent(eventId, userId, userRole, updateData) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    if (userRole !== 'admin' && userRole !== 'superadmin' && event.organizer.toString() !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to update this event');
    }

    if (updateData.title && updateData.title !== event.title) {
      updateData.slug = `${updateData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true
    })
      .populate('category', 'name slug')
      .populate('organizer', 'name email');

    return updatedEvent;
  }

  async deleteEvent(eventId, userId, userRole) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    if (userRole !== 'admin' && userRole !== 'superadmin' && event.organizer.toString() !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to delete this event');
    }

    await TicketType.deleteMany({ event: eventId });
    await Event.findByIdAndDelete(eventId);

    return { message: 'Event and associated ticket types deleted successfully' };
  }

  async getOrganizerEvents(organizerId) {
    const events = await Event.find({ organizer: organizerId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return events;
  }

  async toggleApproval(eventId, isApproved) {
    const event = await Event.findByIdAndUpdate(
      eventId,
      { isApproved },
      { new: true }
    );
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }
    return event;
  }
}

module.exports = new EventService();
