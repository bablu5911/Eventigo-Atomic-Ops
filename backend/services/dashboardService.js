const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Category = require('../models/Category');
const TicketType = require('../models/TicketType');
const StaffAssignment = require('../models/StaffAssignment');

class DashboardService {
  /**
   * Super Admin (Venue Owner & Financial Executive) Analytics Dashboard
   * Focuses purely on financial earnings, sales velocity, seat reservations / occupancy,
   * venue asset utilization, and supervisory audit information of Admins.
   */
  async getSuperAdminDashboard() {
    const events = await Event.find().populate('organizer', 'name email');
    const bookings = await Booking.find({ status: 'confirmed' });
    const allTicketTypes = await TicketType.find();
    const admins = await User.find({ role: 'admin' }).select('-password');
    const staffAssignments = await StaffAssignment.find();

    // 1. Executive Financial Analytics
    const grossRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const venueCommissionRate = 20; // 20% venue license / facility fee
    const venueNetEarnings = Math.round(grossRevenue * 0.20 * 100) / 100;
    const organizerPayouts = Math.round(grossRevenue * 0.80 * 100) / 100;

    // 2. Sales & Volume
    const totalTicketsSold = bookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
    const totalBookings = bookings.length;
    const averageTicketYield = totalTicketsSold > 0 ? Number((grossRevenue / totalTicketsSold).toFixed(2)) : 0;

    // 3. Seats Reserved & Venue Occupancy Analytics
    const totalPlatformCapacity = events.reduce((sum, e) => sum + (e.totalCapacity || 100), 0);
    const totalSeatsReserved = totalTicketsSold;
    const seatsAvailable = Math.max(0, totalPlatformCapacity - totalSeatsReserved);
    const occupancyRate = totalPlatformCapacity > 0
      ? Math.min(100, Math.round((totalSeatsReserved / totalPlatformCapacity) * 100))
      : 0;

    // 4. Venue Asset Performance Breakdown
    const venueMap = {};
    for (const evt of events) {
      const vName = (evt.venue && evt.venue.name) ? evt.venue.name : 'Silicon Valley Convention Center';
      const city = (evt.venue && evt.venue.city) ? evt.venue.city : 'San Francisco';
      if (!venueMap[vName]) {
        venueMap[vName] = {
          venueName: vName,
          city,
          eventsCount: 0,
          totalCapacity: 0,
          seatsReserved: 0,
          grossRevenue: 0
        };
      }
      venueMap[vName].eventsCount += 1;
      venueMap[vName].totalCapacity += (evt.totalCapacity || 100);

      // find bookings for this event
      const evtBookings = bookings.filter(b => {
        const bEventId = b.event?._id ? b.event._id.toString() : b.event?.toString();
        return bEventId === evt._id.toString();
      });
      const evtReserved = evtBookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
      const evtRev = evtBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      venueMap[vName].seatsReserved += evtReserved;
      venueMap[vName].grossRevenue += evtRev;
    }

    const venueBreakdown = Object.values(venueMap).map(v => ({
      ...v,
      venueNetCut: Math.round(v.grossRevenue * 0.20 * 100) / 100,
      occupancyPercent: v.totalCapacity > 0 ? Math.min(100, Math.round((v.seatsReserved / v.totalCapacity) * 100)) : 0
    }));

    // 5. Ticket Tier Sales Breakdown
    const tierSalesMap = {};
    for (const tt of allTicketTypes) {
      const tierName = tt.name || 'General Admission';
      if (!tierSalesMap[tierName]) {
        tierSalesMap[tierName] = {
          name: tierName,
          price: tt.price || 0,
          sold: 0,
          revenue: 0
        };
      }
      tierSalesMap[tierName].sold += (tt.soldQuantity || 0);
      tierSalesMap[tierName].revenue += (tt.soldQuantity || 0) * (tt.price || 0);
    }
    const tierBreakdown = Object.values(tierSalesMap);

    // 6. Admin Supervisory Oversight Information
    const adminOversight = admins.map(adm => {
      const managedEventsCount = events.length; // Admins supervise platform events
      const adminAssignedStaff = staffAssignments.filter(sa => {
        const aId = sa.assignedBy?._id ? sa.assignedBy._id.toString() : sa.assignedBy?.toString();
        return aId === adm._id.toString();
      }).length;

      return {
        _id: adm._id,
        name: adm.name,
        email: adm.email,
        status: adm.status || 'active',
        role: adm.role,
        managedEventsCount,
        assignedStaffCount: adminAssignedStaff,
        createdAt: adm.createdAt
      };
    });

    return {
      financials: {
        grossRevenue,
        venueCommissionRate,
        venueNetEarnings,
        organizerPayouts,
        totalBookings,
        totalTicketsSold,
        averageTicketYield
      },
      capacityAnalytics: {
        totalPlatformCapacity,
        totalSeatsReserved,
        seatsAvailable,
        occupancyRate
      },
      venueBreakdown,
      tierBreakdown,
      admins: adminOversight,
      totalAdmins: admins.length,
      totalEvents: events.length
    };
  }

  /**
   * Admin Operations Dashboard (Events, Ticket & Staff Manager)
   */
  async getAdminDashboard() {
    const totalUsers = await User.countDocuments();
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalAttendees = await User.countDocuments({ role: 'attendee' });
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments({ status: 'confirmed' });

    const revenueResult = await Booking.find({ status: 'confirmed' });
    const totalRevenue = revenueResult.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const events = await Event.find().populate('organizer', 'name email').sort({ createdAt: -1 });
    const staffMembers = await User.find({ role: 'staff' }).select('-password');
    const organizers = await User.find({ role: 'organizer' }).select('-password');
    const ticketTypes = await TicketType.find().populate('event', 'title eventId');

    const staffAssignments = await StaffAssignment.find()
      .populate('staff', 'name email')
      .populate('event', 'title eventId venue')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return {
      totalUsers,
      totalOrganizers,
      totalStaff,
      totalAttendees,
      totalEvents,
      totalBookings,
      totalRevenue,
      events,
      staffMembers,
      organizers,
      staffAssignments,
      ticketTypes
    };
  }

  /**
   * Organizer Dashboard (Strictly for Assigned Events)
   */
  async getOrganizerDashboard(organizerId) {
    const events = await Event.find({ organizer: organizerId });
    const eventIds = events.map((e) => e._id.toString());

    const allBookings = await Booking.find({ status: 'confirmed' });
    const bookings = allBookings.filter(b => {
      const bEvtId = b.event?._id ? b.event._id.toString() : b.event?.toString();
      return eventIds.includes(bEvtId);
    });

    const totalEvents = events.length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalCheckedIn = bookings.filter((b) => b.attendedAt).length;

    const recentBookings = bookings.slice(-5).reverse();

    return {
      totalEvents,
      totalBookings,
      totalRevenue,
      totalCheckedIn,
      recentBookings,
      events
    };
  }
}

module.exports = new DashboardService();
