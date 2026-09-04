const TicketType = require('../models/TicketType');
const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');

class TicketTypeService {
  async getTicketTypesByEvent(eventId) {
    return await TicketType.find({ event: eventId });
  }

  async createTicketType(organizerId, userRole, data) {
    const { eventId, name, price, totalQuantity, maxPerUser, saleStartDate, saleEndDate, description } = data;

    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    if (userRole !== 'admin' && event.organizer.toString() !== organizerId.toString()) {
      throw new ApiError(403, 'Not authorized to add ticket types to this event');
    }

    const ticketType = await TicketType.create({
      event: eventId,
      name,
      price,
      totalQuantity,
      maxPerUser: maxPerUser || 5,
      saleStartDate,
      saleEndDate,
      description: description || ''
    });

    return ticketType;
  }

  async updateTicketType(ticketTypeId, organizerId, userRole, data) {
    const ticketType = await TicketType.findById(ticketTypeId).populate('event');
    if (!ticketType) {
      throw new ApiError(404, 'Ticket type not found');
    }

    if (userRole !== 'admin' && ticketType.event.organizer.toString() !== organizerId.toString()) {
      throw new ApiError(403, 'Not authorized to update ticket type for this event');
    }

    const updated = await TicketType.findByIdAndUpdate(ticketTypeId, data, {
      new: true,
      runValidators: true
    });

    return updated;
  }

  async deleteTicketType(ticketTypeId, organizerId, userRole) {
    const ticketType = await TicketType.findById(ticketTypeId).populate('event');
    if (!ticketType) {
      throw new ApiError(404, 'Ticket type not found');
    }

    if (userRole !== 'admin' && ticketType.event.organizer.toString() !== organizerId.toString()) {
      throw new ApiError(403, 'Not authorized to delete ticket type for this event');
    }

    await TicketType.findByIdAndDelete(ticketTypeId);
    return { message: 'Ticket type deleted successfully' };
  }
}

module.exports = new TicketTypeService();
