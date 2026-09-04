const Booking = require('../models/Booking');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const PromoCode = require('../models/PromoCode');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { generateQRCode } = require('../utils/qrcode');
const passRegistryService = require('./passRegistryService');
const superadminService = require('./superadminService');

class BookingService {
  async createBooking(userId, bookingData) {
    const { eventId, tickets, promoCode, paymentMethod, transactionId } = bookingData;

    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    if (event.status !== 'published') {
      throw new ApiError(400, 'Cannot book tickets for an unpublished or completed event');
    }

    let session = null;
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.client?.topology?.description?.type !== 'Single') {
        session = await mongoose.startSession();
        session.startTransaction();
      }
    } catch (e) {
      session = null;
    }

    try {
      let totalAmount = 0;
      const ticketItems = [];

      for (const item of tickets) {
        let query = TicketType.findOne({ _id: item.ticketTypeId, event: eventId });
        if (session) query = query.session(session);

        const ticketType = await query;
        if (!ticketType) {
          throw new ApiError(404, `Ticket type ID ${item.ticketTypeId} not found for this event`);
        }

        const remaining = ticketType.totalQuantity - ticketType.soldQuantity;
        if (remaining < item.quantity) {
          throw new ApiError(
            400,
            `Not enough tickets available for '${ticketType.name}'. Available: ${remaining}, Requested: ${item.quantity}`
          );
        }

        ticketType.soldQuantity += item.quantity;
        if (session) {
          await ticketType.save({ session });
        } else {
          await ticketType.save();
        }

        const subtotal = ticketType.price * item.quantity;
        totalAmount += subtotal;

        ticketItems.push({
          ticketType: ticketType._id,
          nameSnapshot: ticketType.name,
          priceSnapshot: ticketType.price,
          quantity: item.quantity
        });
      }

      // Calculate total ticket admissions count
      const totalTicketsCount = ticketItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

      // Handle promo code discount
      let discountAmount = 0;
      let matchedPromo = null;
      if (promoCode) {
        const promoCodeService = require('./promoCodeService');
        matchedPromo = await promoCodeService.validatePromoCode(eventId, promoCode, userId);

        let discountableBase = totalAmount;

        // If coupon has a maximum ticket limit (e.g. from Early Exit crowd management)
        if (matchedPromo.maxTicketsApplicable && matchedPromo.maxTicketsApplicable > 0) {
          const applicableTickets = Math.min(totalTicketsCount, matchedPromo.maxTicketsApplicable);
          let counted = 0;
          discountableBase = 0;
          for (const item of ticketItems) {
            const takeQty = Math.min(item.quantity, applicableTickets - counted);
            if (takeQty > 0) {
              discountableBase += item.priceSnapshot * takeQty;
              counted += takeQty;
            }
            if (counted >= applicableTickets) break;
          }
        }

        if (matchedPromo.discountType === 'flat') {
          discountAmount = Math.min(discountableBase, matchedPromo.value);
        } else if (matchedPromo.discountType === 'percentage') {
          discountAmount = (discountableBase * matchedPromo.value) / 100;
        }

        totalAmount = Math.max(0, totalAmount - discountAmount);
      }

      // Generate Guaranteed Unique Pass ID & Security Hash via PassRegistryService
      const bookingCode = await passRegistryService.generateUniquePassCode(event);
      const securityHash = passRegistryService.generateSecurityHash(bookingCode, eventId, userId);
      const gateEntry = passRegistryService.determineGateAllocation(ticketItems, event.isOnline);
      const resolvedTxnId = transactionId || `TXN-ATOM-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate individual sub-tickets for group sharing
      const individualTickets = [];
      let subIdx = 1;
      for (const item of ticketItems) {
        for (let q = 0; q < item.quantity; q++) {
          individualTickets.push({
            ticketCode: `${bookingCode}-${subIdx}`,
            ticketIndex: subIdx,
            ticketTypeName: item.nameSnapshot,
            status: 'valid',
            admittedAt: null
          });
          subIdx++;
        }
      }

      if (matchedPromo) {
        matchedPromo.usedCount = (matchedPromo.usedCount || 0) + 1;
        if (!matchedPromo.usedByUsers) matchedPromo.usedByUsers = [];
        matchedPromo.usedByUsers.push({
          user: userId,
          bookingCode,
          usedAt: new Date()
        });
        if (session) {
          await matchedPromo.save({ session });
        } else {
          await matchedPromo.save();
        }
      }

      // Pre-generate QR code data URL
      const qrCodeUrl = await generateQRCode({
        passCode: bookingCode,
        securityDigest: securityHash,
        eventId: String(eventId),
        gate: gateEntry,
        timestamp: Date.now()
      });

      const bookingPayload = {
        bookingCode,
        user: userId,
        event: eventId,
        tickets: ticketItems,
        totalAmount,
        totalTicketsCount,
        checkedInCount: 0,
        individualTickets,
        checkInLogs: [],
        promoCode: matchedPromo ? matchedPromo.code : '',
        discountAmount,
        status: 'confirmed',
        attendedAt: null,
        qrCodeUrl,
        securityHash,
        gateEntry,
        paymentMethod: paymentMethod || 'card',
        paymentStatus: 'paid',
        transactionId: resolvedTxnId,
        paidAt: new Date()
      };

      let booking;
      if (session) {
        const bookingArray = await Booking.create([bookingPayload], { session });
        await session.commitTransaction();
        session.endSession();
        booking = bookingArray[0];
      } else {
        booking = await Booking.create(bookingPayload);
      }

      const populatedBooking = await Booking.findById(booking._id)
        .populate('event', 'title banner startDateTime venue isOnline')
        .populate('user', 'name email');

      // Guarantee qrCodeUrl is attached to populatedBooking
      if (populatedBooking) {
        populatedBooking.qrCodeUrl = qrCodeUrl;
      }

      return {
        booking: populatedBooking || booking,
        qrCodeUrl
      };
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  async getUserBookings(userId) {
    const bookings = await Booking.find({ user: userId })
      .populate('event', 'title banner startDateTime venue isOnline status')
      .sort({ createdAt: -1 });

    // Ensure all bookings have valid qrCodeUrl and security metadata
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const doc = b.toObject ? b.toObject() : { ...b };
        if (!doc.qrCodeUrl) {
          try {
            doc.qrCodeUrl = await generateQRCode({
              passCode: doc.bookingCode,
              securityDigest: doc.securityHash || 'ATOM-SECURITY-HASH-PASS',
              eventId: String(doc.event?._id || doc.event),
              gate: doc.gateEntry || 'Gate A • Express Check-In',
              timestamp: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now()
            });
          } catch (e) {
            doc.qrCodeUrl = '';
          }
        }
        return doc;
      })
    );

    return enriched;
  }

  async getBookingById(bookingId, userId, userRole) {
    const booking = await Booking.findById(bookingId)
      .populate('event')
      .populate('user', 'name email');

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const organizerId = booking.event?.organizer?._id || booking.event?.organizer;
    if (
      userRole !== 'admin' &&
      booking.user?._id?.toString() !== userId.toString() &&
      String(organizerId) !== userId.toString()
    ) {
      throw new ApiError(403, 'Not authorized to view this booking');
    }

    let qrCodeUrl = booking.qrCodeUrl;
    if (!qrCodeUrl) {
      qrCodeUrl = await generateQRCode({
        passCode: booking.bookingCode,
        securityDigest: booking.securityHash || 'ATOM-SECURITY-HASH-PASS',
        eventId: String(booking.event?._id || booking.event),
        gate: booking.gateEntry || 'Gate A • Express Check-In',
        timestamp: Date.now()
      });
      booking.qrCodeUrl = qrCodeUrl;
    }

    return { booking, qrCodeUrl };
  }

  async cancelBooking(bookingId, userId, userRole) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (userRole !== 'admin' && booking.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(400, 'Booking is already cancelled');
    }

    for (const item of booking.tickets) {
      await TicketType.findByIdAndUpdate(item.ticketType, {
        $inc: { soldQuantity: -item.quantity }
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    return booking;
  }

  async verifyCheckIn(code, organizerId, userRole, expectedEventId = null, admitCount = null) {
    if (!code) {
      throw new ApiError(400, 'Ticket pass code is required');
    }
    const cleanCode = String(code).trim().toUpperCase();

    // Emergency Gate Lockdown Check
    if (superadminService.isEmergencyGateLockdownActive()) {
      const details = superadminService.getLockdownDetails();
      return {
        valid: false,
        alreadyAttended: false,
        bookingCode: cleanCode,
        error: `⚠️ VENUE EMERGENCY LOCKDOWN: All gate check-in systems are temporarily frozen by Super Admin order.${details.reason ? ' Reason: ' + details.reason : ''}`
      };
    }

    // 1. First search for Master Booking Code
    let booking = await Booking.findOne({ bookingCode: cleanCode })
      .populate('event')
      .populate('user', 'name email');

    let matchedSubTicket = null;

    // 2. If not found, check if it matches an individual guest sub-ticket
    if (!booking) {
      booking = await Booking.findOne({ 'individualTickets.ticketCode': cleanCode })
        .populate('event')
        .populate('user', 'name email');

      if (booking && booking.individualTickets) {
        matchedSubTicket = booking.individualTickets.find((t) => t.ticketCode === cleanCode);
      }
    }

    if (!booking) {
      throw new ApiError(404, `Invalid pass code '${cleanCode}'. No ticket reservation found.`);
    }

    // 3. Strict Venue Gate Check: If expectedEventId is provided, enforce event match!
    if (expectedEventId && expectedEventId !== 'all') {
      const isMatch =
        (booking.event?._id && String(booking.event._id) === String(expectedEventId)) ||
        (booking.event?.eventId && String(booking.event.eventId).toUpperCase() === String(expectedEventId).toUpperCase()) ||
        (booking.event?.slug && String(booking.event.slug) === String(expectedEventId));

      if (!isMatch) {
        return {
          valid: false,
          alreadyAttended: false,
          bookingCode: cleanCode,
          eventTitle: booking.event?.title,
          error: `VENUE MISMATCH: Pass ${cleanCode} is issued for "${booking.event?.title || 'Another Event'}", NOT for this event gate.`
        };
      }
    }

    if (userRole !== 'admin' && userRole !== 'staff' && String(booking.event?.organizer) !== String(organizerId)) {
      throw new ApiError(403, 'Not authorized to check in attendees for this event');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(400, `Cannot check in. Booking pass has been cancelled.`);
    }

    const totalCount = booking.totalTicketsCount || booking.tickets?.reduce((acc, t) => acc + t.quantity, 0) || 1;
    const currentCheckedIn = booking.checkedInCount || (booking.attendedAt ? totalCount : 0);
    const availableToAdmit = Math.max(0, totalCount - currentCheckedIn);

    // CASE A: Attendee presented an Individual Sub-Ticket (e.g. ATOM-2026-NEON-X8K9-2)
    if (matchedSubTicket) {
      if (matchedSubTicket.status === 'used' || matchedSubTicket.admittedAt) {
        return {
          valid: true,
          alreadyAttended: true,
          bookingCode: cleanCode,
          masterCode: booking.bookingCode,
          isIndividualTicket: true,
          ticketIndex: matchedSubTicket.ticketIndex,
          ticketTypeName: matchedSubTicket.ticketTypeName,
          totalTickets: totalCount,
          checkedInCount: currentCheckedIn,
          remainingTickets: availableToAdmit,
          eventTitle: booking.event?.title,
          userName: booking.user?.name,
          attendedAt: matchedSubTicket.admittedAt,
          ticketBreakdown: booking.tickets,
          gateEntry: booking.gateEntry,
          securityHash: booking.securityHash,
          error: `ENTRY DENIED: Individual Pass #${matchedSubTicket.ticketIndex} (${cleanCode}) was ALREADY admitted at ${
            matchedSubTicket.admittedAt ? new Date(matchedSubTicket.admittedAt).toLocaleTimeString() : 'gate entry'
          }.`
        };
      }

      // Admitting this individual guest
      matchedSubTicket.status = 'used';
      matchedSubTicket.admittedAt = new Date();
      booking.checkedInCount = currentCheckedIn + 1;
      if (!booking.checkInLogs) booking.checkInLogs = [];
      booking.checkInLogs.push({
        admittedCount: 1,
        admittedAt: new Date(),
        gate: booking.gateEntry || 'Gate A • Main Entrance',
        note: `Admitted via individual guest pass #${matchedSubTicket.ticketIndex} (${cleanCode})`
      });

      const isFullyAdmitted = booking.checkedInCount >= totalCount;
      booking.status = isFullyAdmitted ? 'scanned_invalid' : 'partially_checked_in';
      booking.attendedAt = booking.attendedAt || new Date();
      await booking.save();

      return {
        valid: true,
        alreadyAttended: false,
        bookingCode: cleanCode,
        masterCode: booking.bookingCode,
        isIndividualTicket: true,
        ticketIndex: matchedSubTicket.ticketIndex,
        ticketTypeName: matchedSubTicket.ticketTypeName,
        admittedNow: 1,
        totalTickets: totalCount,
        checkedInCount: booking.checkedInCount,
        remainingTickets: totalCount - booking.checkedInCount,
        isFullyAdmitted,
        eventTitle: booking.event?.title,
        userName: booking.user?.name,
        userEmail: booking.user?.email,
        attendedAt: matchedSubTicket.admittedAt,
        ticketBreakdown: booking.tickets,
        gateEntry: booking.gateEntry || 'Gate A • Express Check-In',
        securityHash: booking.securityHash || 'ATOM-VERIFIED-SIGNATURE'
      };
    }

    // CASE B: Attendee presented the Master Booking Pass (e.g. ATOM-2026-NEON-X8K9)
    if (availableToAdmit <= 0 || booking.status === 'scanned_invalid') {
      return {
        valid: true,
        alreadyAttended: true,
        bookingCode: booking.bookingCode,
        totalTickets: totalCount,
        checkedInCount: totalCount,
        remainingTickets: 0,
        eventTitle: booking.event?.title,
        userName: booking.user?.name,
        attendedAt: booking.attendedAt,
        ticketBreakdown: booking.tickets,
        gateEntry: booking.gateEntry || 'Gate A • Express Check-In',
        securityHash: booking.securityHash || 'ATOM-SECURITY-HASH',
        error: `ENTRY DENIED: All ${totalCount} guest admission(s) on Pass ${booking.bookingCode} have ALREADY been fully checked in.`
      };
    }

    // Determine how many guests to admit right now
    const countToAdmit = admitCount ? Math.min(Number(admitCount), availableToAdmit) : availableToAdmit;

    // Mark corresponding individual sub-tickets as used
    if (booking.individualTickets && booking.individualTickets.length > 0) {
      let marked = 0;
      for (const st of booking.individualTickets) {
        if (st.status === 'valid' && marked < countToAdmit) {
          st.status = 'used';
          st.admittedAt = new Date();
          marked++;
        }
      }
    }

    booking.checkedInCount = currentCheckedIn + countToAdmit;
    if (!booking.checkInLogs) booking.checkInLogs = [];
    booking.checkInLogs.push({
      admittedCount: countToAdmit,
      admittedAt: new Date(),
      gate: booking.gateEntry || 'Gate A • Express Check-In',
      note: `Admitted ${countToAdmit} guest(s) via master pass`
    });

    const isFullyAdmitted = booking.checkedInCount >= totalCount;
    booking.status = isFullyAdmitted ? 'scanned_invalid' : 'partially_checked_in';
    booking.attendedAt = booking.attendedAt || new Date();
    await booking.save();

    return {
      valid: true,
      alreadyAttended: false,
      bookingCode: booking.bookingCode,
      eventTitle: booking.event?.title,
      userName: booking.user?.name,
      userEmail: booking.user?.email,
      attendedAt: new Date(),
      admittedNow: countToAdmit,
      totalTickets: totalCount,
      checkedInCount: booking.checkedInCount,
      remainingTickets: totalCount - booking.checkedInCount,
      isFullyAdmitted,
      ticketBreakdown: booking.tickets,
      individualTickets: booking.individualTickets || [],
      gateEntry: booking.gateEntry || 'Gate A • Express Check-In',
      securityHash: booking.securityHash || 'ATOM-VERIFIED-SIGNATURE'
    };
  }

  async processEarlyExit(code, organizerId, userRole, expectedEventId = null, exitCount = 1, simulatedMinutesEarly = null) {
    if (!code) {
      throw new ApiError(400, 'Ticket pass code is required');
    }
    const cleanCode = String(code).trim().toUpperCase();

    // Emergency Gate Lockdown Check
    if (superadminService.isEmergencyGateLockdownActive()) {
      const details = superadminService.getLockdownDetails();
      return {
        valid: false,
        bookingCode: cleanCode,
        error: `⚠️ VENUE EMERGENCY LOCKDOWN: All gate operations are temporarily frozen by Super Admin order.${details.reason ? ' Reason: ' + details.reason : ''}`
      };
    }

    // 1. First search for Master Booking Code
    let booking = await Booking.findOne({ bookingCode: cleanCode })
      .populate('event')
      .populate('user', 'name email');

    let matchedSubTicket = null;

    // 2. If not found, check if it matches an individual guest sub-ticket
    if (!booking) {
      booking = await Booking.findOne({ 'individualTickets.ticketCode': cleanCode })
        .populate('event')
        .populate('user', 'name email');

      if (booking && booking.individualTickets) {
        matchedSubTicket = booking.individualTickets.find((t) => t.ticketCode === cleanCode);
      }
    }

    if (!booking) {
      throw new ApiError(404, `Invalid pass code '${cleanCode}'. No ticket reservation found.`);
    }

    // 3. Strict Venue Gate Check
    if (expectedEventId && expectedEventId !== 'all') {
      const isMatch =
        (booking.event?._id && String(booking.event._id) === String(expectedEventId)) ||
        (booking.event?.eventId && String(booking.event.eventId).toUpperCase() === String(expectedEventId).toUpperCase()) ||
        (booking.event?.slug && String(booking.event.slug) === String(expectedEventId));

      if (!isMatch) {
        return {
          valid: false,
          bookingCode: cleanCode,
          eventTitle: booking.event?.title,
          error: `VENUE MISMATCH: Pass ${cleanCode} is issued for "${booking.event?.title || 'Another Event'}", NOT for this event gate.`
        };
      }
    }

    if (userRole !== 'admin' && userRole !== 'staff' && String(booking.event?.organizer) !== String(organizerId)) {
      throw new ApiError(403, 'Not authorized to process early exits for this event');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(400, `Cannot process exit. Booking pass has been cancelled.`);
    }

    // 4. Verification that attendee actually checked in
    const totalCheckedIn = booking.checkedInCount || 0;
    const currentEarlyExited = booking.earlyExitCount || 0;
    const remainingInside = Math.max(0, totalCheckedIn - currentEarlyExited);

    if (matchedSubTicket) {
      if (matchedSubTicket.status === 'exited_early') {
        return {
          valid: false,
          bookingCode: cleanCode,
          error: `EARLY EXIT ALREADY RECORDED: Individual Pass #${matchedSubTicket.ticketIndex} (${cleanCode}) was already scanned for early exit.`
        };
      }
      if (matchedSubTicket.status !== 'used') {
        return {
          valid: false,
          bookingCode: cleanCode,
          error: `ENTRY REQUIRED: Individual Pass #${matchedSubTicket.ticketIndex} (${cleanCode}) has NOT checked into the venue yet.`
        };
      }
    } else {
      if (totalCheckedIn <= 0) {
        return {
          valid: false,
          bookingCode: cleanCode,
          error: `ENTRY REQUIRED: No attendees on Pass ${cleanCode} have checked into the venue yet.`
        };
      }
      if (remainingInside <= 0) {
        return {
          valid: false,
          bookingCode: cleanCode,
          error: `ALL EXITED: All ${totalCheckedIn} checked-in guest(s) on Pass ${cleanCode} have already exited the venue.`
        };
      }
    }

    // Determine how many guests are exiting now
    const guestsExitingNow = matchedSubTicket ? 1 : Math.min(Number(exitCount) || 1, remainingInside);

    // 5. Early exit timing window calculation (last 30 minutes before event close)
    let minutesEarly = 25; // default simulation value
    if (simulatedMinutesEarly !== null && simulatedMinutesEarly !== undefined) {
      minutesEarly = Number(simulatedMinutesEarly);
    } else if (booking.event?.endDateTime) {
      const diffMs = new Date(booking.event.endDateTime).getTime() - Date.now();
      const calcMins = Math.round(diffMs / 60000);
      if (calcMins > 0) {
        minutesEarly = calcMins;
      }
    }

    // Enforce 1 to 30 mins window for early exit reward
    minutesEarly = Math.min(30, Math.max(1, minutesEarly));

    // Discount calculation: proportional to minutes early (1% per minute early, min 10%, max 30%)
    const discountPercent = Math.min(30, Math.max(10, minutesEarly));

    // 6. Generate Unique Single-Use Reward Coupon
    const promoCodeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedCouponCode = `EXIT-${discountPercent}M-${booking.bookingCode.slice(-4)}-${promoCodeSuffix}`;

    const PromoCode = require('../models/PromoCode');
    await PromoCode.create({
      event: null,
      scope: 'all',
      code: generatedCouponCode,
      discountType: 'percentage',
      value: discountPercent,
      usageLimit: 1,
      usedCount: 0,
      perUserLimit: 1,
      assignedUser: booking.user?._id,
      maxTicketsApplicable: guestsExitingNow,
      isEarlyExitReward: true,
      earlyExitMetadata: {
        sourceBooking: booking._id,
        sourceEvent: booking.event?._id,
        exitCount: guestsExitingNow,
        minutesEarly,
        exitedAt: new Date()
      },
      usedByUsers: []
    });

    // 7. Update booking records
    booking.earlyExitCount = currentEarlyExited + guestsExitingNow;
    if (matchedSubTicket) {
      matchedSubTicket.status = 'exited_early';
      matchedSubTicket.exitedAt = new Date();
    } else if (booking.individualTickets && booking.individualTickets.length > 0) {
      let marked = 0;
      for (const st of booking.individualTickets) {
        if (st.status === 'used' && marked < guestsExitingNow) {
          st.status = 'exited_early';
          st.exitedAt = new Date();
          marked++;
        }
      }
    }

    if (!booking.earlyExitLogs) booking.earlyExitLogs = [];
    booking.earlyExitLogs.push({
      exitCount: guestsExitingNow,
      minutesEarly,
      discountGiven: discountPercent,
      couponCode: generatedCouponCode,
      exitedAt: new Date(),
      gate: 'Exit Gate B • Crowd Dispersal Turnstile'
    });

    await booking.save();

    return {
      valid: true,
      success: true,
      bookingCode: booking.bookingCode,
      scannedCode: cleanCode,
      isIndividualTicket: Boolean(matchedSubTicket),
      ticketIndex: matchedSubTicket?.ticketIndex,
      eventTitle: booking.event?.title,
      userName: booking.user?.name,
      userEmail: booking.user?.email,
      userId: booking.user?._id,
      exitCount: guestsExitingNow,
      remainingInside: remainingInside - guestsExitingNow,
      totalCheckedIn: totalCheckedIn,
      minutesEarly,
      discountPercent,
      maxTicketsApplicable: guestsExitingNow,
      couponCode: generatedCouponCode,
      message: `Early exit verified! ${guestsExitingNow} guest(s) exited ${minutesEarly} mins early. Credited ${discountPercent}% discount coupon [${generatedCouponCode}] for up to ${guestsExitingNow} ticket(s) to attendee account!`
    };
  }

  async verifyAndCheckInTicket({ code, eventId, guardId }) {
    // 1. Check Super Admin Emergency Gate Lockdown
    if (superadminService && superadminService.isEmergencyGateLockdownActive()) {
      throw new ApiError(423, 'EMERGENCY_GATE_LOCKDOWN: Venue turnstiles locked by Super Admin.');
    }

    if (!code || !eventId) {
      throw new ApiError(400, 'Ticket code and event ID are required.');
    }

    const cleanCode = code.trim();
    const cleanEventId = eventId.trim();

    // 2. Query booking by bookingCode, _id, or individualTickets.ticketCode
    const queryConditions = [
      { bookingCode: cleanCode },
      { 'individualTickets.ticketCode': cleanCode }
    ];

    if (mongoose.Types.ObjectId.isValid(cleanCode)) {
      queryConditions.push({ _id: cleanCode });
    }

    const booking = await Booking.findOne({ $or: queryConditions })
      .populate('user', 'name email role')
      .populate('event', 'title startDateTime eventId');

    if (!booking) {
      throw new ApiError(404, 'INVALID_TICKET: No confirmed booking found.');
    }

    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      throw new ApiError(400, `INVALID_TICKET: Booking is ${booking.status}.`);
    }

    // 3. Verify Event Match
    const bookingEventId = booking.event?._id?.toString() || booking.event?.toString();
    const bookingCustomEventId = booking.event?.eventId;

    const isMatch = bookingEventId === cleanEventId || (bookingCustomEventId && bookingCustomEventId === cleanEventId);
    if (!isMatch) {
      throw new ApiError(400, 'WRONG_EVENT: Ticket is for a different event.');
    }

    // 4. Check if already attended
    if (booking.attendedAt) {
      return {
        status: 'ALREADY_USED',
        message: 'Access Denied: Ticket was already scanned.',
        scannedAt: booking.attendedAt,
        attendee: {
          name: booking.user?.name || 'Attendee',
          email: booking.user?.email || ''
        },
        bookingCode: booking.bookingCode,
        event: {
          title: booking.event?.title || '',
          id: booking.event?._id
        }
      };
    }

    // 5. Atomic check-in
    const totalCount = booking.totalTicketsCount || (booking.tickets ? booking.tickets.reduce((acc, t) => acc + (t.quantity || 1), 0) : 1);
    const now = new Date();

    const verifiedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: { $in: ['confirmed', 'partially_checked_in'] }
      },
      {
        $set: {
          attendedAt: now,
          checkedInCount: totalCount
        },
        $push: {
          checkInLogs: {
            admittedCount: totalCount,
            admittedAt: now,
            gate: 'Main Gate Live Scanner',
            note: `Verified by guard ${guardId || 'staff'}`
          }
        }
      },
      { new: true }
    )
      .populate('user', 'name email role')
      .populate('event', 'title startDateTime eventId');

    // If concurrency race occurred and another process scanned it first
    if (!verifiedBooking) {
      const refreshedBooking = await Booking.findById(booking._id).populate('user', 'name email');
      return {
        status: 'ALREADY_USED',
        message: 'Access Denied: Ticket was already scanned.',
        scannedAt: refreshedBooking.attendedAt || now,
        attendee: {
          name: refreshedBooking.user?.name || 'Attendee',
          email: refreshedBooking.user?.email || ''
        },
        bookingCode: refreshedBooking.bookingCode,
        event: {
          title: booking.event?.title || '',
          id: booking.event?._id
        }
      };
    }

    return {
      status: 'VALID',
      message: 'Access Granted: Welcome!',
      scannedAt: verifiedBooking.attendedAt,
      attendee: {
        name: verifiedBooking.user?.name || 'Attendee',
        email: verifiedBooking.user?.email || ''
      },
      tickets: verifiedBooking.tickets || [],
      totalTickets: totalCount,
      bookingCode: verifiedBooking.bookingCode,
      event: {
        title: verifiedBooking.event?.title || '',
        id: verifiedBooking.event?._id
      }
    };
  }
}

module.exports = new BookingService();
