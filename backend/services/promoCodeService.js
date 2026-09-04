const PromoCode = require('../models/PromoCode');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

class PromoCodeService {
  async createPromoCode(organizerId, userRole, data) {
    const { 
      eventId, 
      code, 
      discountType, 
      value, 
      usageLimit, 
      scope = 'all', 
      perUserLimit = 1,
      isNewUserOnly = false,
      validFrom = null,
      validUntil = null,
      isActive = true
    } = data;
    const uppercaseCode = code.toUpperCase().trim();

    let targetEvent = null;
    const isEventScope = scope === 'event' || (Boolean(eventId) && scope !== 'all');

    if (isEventScope) {
      if (!eventId) {
        throw new ApiError(400, 'Please select or search an event for an event-specific coupon');
      }

      const isHex = String(eventId).match(/^[0-9a-fA-F]{24}$/);
      targetEvent = await Event.findOne({
        $or: [
          ...(isHex ? [{ _id: eventId }] : []),
          { eventId: String(eventId).toUpperCase() }
        ]
      });

      if (!targetEvent) {
        throw new ApiError(404, `Target event '${eventId}' not found. Enter a valid Event ID or select an event.`);
      }

      if (userRole !== 'admin' && String(targetEvent.organizer) !== String(organizerId)) {
        throw new ApiError(403, 'Not authorized to add promo code for this event');
      }
    } else {
      if (userRole !== 'admin') {
        throw new ApiError(403, 'Only administrators can create platform-wide global coupons');
      }
    }

    // Check if code already exists for this scope/event
    const query = {
      code: uppercaseCode,
      ...(targetEvent ? { event: targetEvent._id } : { scope: 'all' })
    };
    const existing = await PromoCode.findOne(query);
    if (existing) {
      throw new ApiError(
        400,
        `Promo code '${uppercaseCode}' already exists for ${targetEvent ? `"${targetEvent.title}"` : 'all events'}`
      );
    }

    const promoCode = await PromoCode.create({
      event: targetEvent ? targetEvent._id : null,
      scope: targetEvent ? 'event' : 'all',
      code: uppercaseCode,
      discountType,
      value: Number(value),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      isNewUserOnly: Boolean(isNewUserOnly),
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: isActive !== false,
      createdBy: organizerId || null,
      createdByRole: userRole || 'admin',
      usedCount: 0,
      usedByUsers: []
    });

    return promoCode;
  }

  async validatePromoCode(eventId, code, userId = null) {
    if (!code) {
      throw new ApiError(400, 'Promo code is required');
    }
    const uppercaseCode = code.toUpperCase().trim();

    const promos = await PromoCode.find({ code: uppercaseCode });
    if (!promos || promos.length === 0) {
      throw new ApiError(404, `Invalid promo code '${uppercaseCode}'`);
    }

    let applicablePromo = null;
    let resolvedEvent = null;

    if (eventId) {
      const isHex = String(eventId).match(/^[0-9a-fA-F]{24}$/);
      resolvedEvent = await Event.findOne({
        $or: [
          ...(isHex ? [{ _id: String(eventId) }] : []),
          { eventId: String(eventId).toUpperCase() },
          { slug: String(eventId) }
        ]
      });
    }

    if (resolvedEvent) {
      applicablePromo = promos.find((p) => p.event && String(p.event) === String(resolvedEvent._id));
    }
    if (!applicablePromo) {
      applicablePromo = promos.find((p) => p.scope === 'all' || !p.event);
    }

    if (!applicablePromo) {
      const specificEventId = promos[0].event;
      const otherEvt = specificEventId ? await Event.findById(specificEventId) : null;
      throw new ApiError(
        400,
        otherEvt
          ? `Coupon '${uppercaseCode}' is only valid for "${otherEvt.title}", not this event.`
          : `Promo code '${uppercaseCode}' is not applicable to this event.`
      );
    }

    if (applicablePromo.isActive === false) {
      throw new ApiError(400, `Coupon '${uppercaseCode}' is currently paused or inactive.`);
    }

    const now = new Date();
    if (applicablePromo.validFrom && now < new Date(applicablePromo.validFrom)) {
      throw new ApiError(
        400,
        `Coupon '${uppercaseCode}' is not active yet (Starts on: ${new Date(applicablePromo.validFrom).toLocaleString()}).`
      );
    }

    if (applicablePromo.validUntil && now > new Date(applicablePromo.validUntil)) {
      throw new ApiError(
        400,
        `Coupon '${uppercaseCode}' has expired (Expired on: ${new Date(applicablePromo.validUntil).toLocaleString()}).`
      );
    }

    if (applicablePromo.isNewUserOnly) {
      if (!userId) {
        throw new ApiError(401, 'Please log in to apply this First-Time / New User exclusive coupon.');
      }
      const priorConfirmedBookings = await Booking.countDocuments({
        user: userId,
        status: { $ne: 'cancelled' }
      });
      if (priorConfirmedBookings > 0) {
        throw new ApiError(
          400,
          `Coupon '${uppercaseCode}' is exclusively reserved for first-time / new users.`
        );
      }
    }

    if (applicablePromo.usageLimit !== null && applicablePromo.usedCount >= applicablePromo.usageLimit) {
      throw new ApiError(400, `Promo code '${uppercaseCode}' usage limit has been reached.`);
    }

    if (applicablePromo.assignedUser && userId && String(applicablePromo.assignedUser) !== String(userId)) {
      throw new ApiError(
        403,
        `Coupon '${uppercaseCode}' is a personal Early Exit Crowd Reward assigned to another account.`
      );
    }

    if (userId) {
      const allowedPerUser = applicablePromo.perUserLimit || 1;

      const bookingUses = await Booking.countDocuments({
        user: userId,
        promoCode: uppercaseCode,
        status: { $ne: 'cancelled' }
      });

      const recordedUses = (applicablePromo.usedByUsers || []).filter(
        (u) => String(u.user || u) === String(userId)
      ).length;

      const totalUserUses = Math.max(bookingUses, recordedUses);

      if (totalUserUses >= allowedPerUser) {
        throw new ApiError(
          400,
          `You have already used coupon '${uppercaseCode}'. It is limited to ${allowedPerUser} use per user.`
        );
      }
    }

    return applicablePromo;
  }

  async getAllPromoCodes(organizerId, userRole) {
    let query = {};
    if (userRole !== 'admin') {
      const userEvents = await Event.find({ organizer: organizerId }).select('_id');
      const eventIds = userEvents.map((e) => e._id);
      query = {
        $or: [
          { createdBy: organizerId },
          { event: { $in: eventIds } }
        ]
      };
    }
    return await PromoCode.find(query)
      .populate('event', 'title eventId slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async togglePromoCodeStatus(promoId, organizerId, userRole) {
    const promo = await PromoCode.findById(promoId).populate('event');
    if (!promo) {
      throw new ApiError(404, 'Promo code not found');
    }

    if (
      userRole !== 'admin' &&
      String(promo.createdBy) !== String(organizerId) &&
      promo.event &&
      String(promo.event?.organizer) !== String(organizerId)
    ) {
      throw new ApiError(403, 'Not authorized to modify this promo code');
    }

    promo.isActive = !promo.isActive;
    await promo.save();
    return {
      success: true,
      isActive: promo.isActive,
      message: `Promo code '${promo.code}' is now ${promo.isActive ? 'Active' : 'Paused'}`
    };
  }

  async getUserActiveRewards(userId) {
    if (!userId) return [];
    return await PromoCode.find({
      assignedUser: userId,
      usedCount: 0,
      isEarlyExitReward: true
    }).sort({ createdAt: -1 });
  }

  async getPromoCodesByEvent(eventId, organizerId, userRole) {
    const isHex = String(eventId).match(/^[0-9a-fA-F]{24}$/);
    const event = await Event.findOne({
      $or: [
        ...(isHex ? [{ _id: eventId }] : []),
        { eventId: String(eventId).toUpperCase() }
      ]
    });
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    if (userRole !== 'admin' && String(event.organizer) !== String(organizerId)) {
      throw new ApiError(403, 'Not authorized to view promo codes for this event');
    }

    return await PromoCode.find({ event: event._id });
  }

  async deletePromoCode(promoId, organizerId, userRole) {
    const promo = await PromoCode.findById(promoId).populate('event');
    if (!promo) {
      throw new ApiError(404, 'Promo code not found');
    }

    if (
      userRole !== 'admin' &&
      String(promo.createdBy) !== String(organizerId) &&
      promo.event &&
      String(promo.event?.organizer) !== String(organizerId)
    ) {
      throw new ApiError(403, 'Not authorized to delete this promo code');
    }

    await PromoCode.findByIdAndDelete(promoId);
    return { success: true, message: `Promo code '${promo.code}' deleted successfully` };
  }
}

module.exports = new PromoCodeService();
