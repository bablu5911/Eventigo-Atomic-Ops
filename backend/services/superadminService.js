const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const StaffAssignment = require('../models/StaffAssignment');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

// In-Memory Persistent State for Super Admin Controls
const venueSettingsState = {
  venueCommissionRate: 20, // 20% Venue Owner Facility Commission
  emergencyGateLockdown: false,
  lockdownReason: '',
  lockdownActivatedAt: null,
  maintenanceMode: false,
  payoutLedger: [
    {
      batchId: 'SETTLE-2026-INIT-B01',
      grossAmount: 18500.0,
      venueCutAmount: 3700.0,
      organizerPayoutPool: 14800.0,
      settledAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      status: 'settled',
      notes: 'Monthly initial facility settlement - Silicon Valley Center & Neon Arena'
    }
  ],
  auditLogs: [
    {
      id: 'LOG-001',
      action: 'SYSTEM_INITIALIZE',
      actor: 'Super Admin',
      timestamp: new Date().toISOString(),
      details: 'Venue Owner executive suite initialized'
    }
  ]
};

class SuperAdminService {
  // 1. Emergency Lockdown Controls
  isEmergencyGateLockdownActive() {
    return venueSettingsState.emergencyGateLockdown;
  }

  getLockdownDetails() {
    return {
      active: venueSettingsState.emergencyGateLockdown,
      reason: venueSettingsState.lockdownReason,
      activatedAt: venueSettingsState.lockdownActivatedAt
    };
  }

  toggleEmergencyGateLockdown(enabled, reason = 'Super Admin Security Order', actor = 'Super Admin') {
    venueSettingsState.emergencyGateLockdown = Boolean(enabled);
    venueSettingsState.lockdownReason = enabled ? reason : '';
    venueSettingsState.lockdownActivatedAt = enabled ? new Date().toISOString() : null;

    this.logAction(
      enabled ? 'VENUE_GATE_LOCKDOWN_ENABLED' : 'VENUE_GATE_LOCKDOWN_DISABLED',
      actor,
      enabled ? `Emergency Gate Lockdown activated: ${reason}` : 'Gate Lockdown lifted, normal entry resumed'
    );

    return this.getLockdownDetails();
  }

  // 2. Venue Facility & Commission Settings
  getVenueSettings() {
    return {
      venueCommissionRate: venueSettingsState.venueCommissionRate,
      emergencyGateLockdown: venueSettingsState.emergencyGateLockdown,
      lockdownReason: venueSettingsState.lockdownReason,
      lockdownActivatedAt: venueSettingsState.lockdownActivatedAt,
      maintenanceMode: venueSettingsState.maintenanceMode,
      payoutLedger: venueSettingsState.payoutLedger,
      auditLogs: venueSettingsState.auditLogs.slice(0, 20)
    };
  }

  updateVenueSettings(settings, actor = 'Super Admin') {
    if (typeof settings.venueCommissionRate === 'number') {
      const rate = Math.max(1, Math.min(50, settings.venueCommissionRate));
      venueSettingsState.venueCommissionRate = rate;
      this.logAction('COMMISSION_RATE_UPDATED', actor, `Venue facility take adjusted to ${rate}%`);
    }

    if (typeof settings.emergencyGateLockdown === 'boolean') {
      this.toggleEmergencyGateLockdown(settings.emergencyGateLockdown, settings.reason || 'Manual Super Admin toggle', actor);
    }

    return this.getVenueSettings();
  }

  // 3. Admin Management Suite
  async getAllAdmins() {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    const events = await Event.find().select('title eventId');
    const staffAssignments = await StaffAssignment.find();

    return admins.map((adm) => {
      const aId = adm._id.toString();
      const assignedStaffCount = staffAssignments.filter((sa) => {
        const byId = sa.assignedBy?._id ? sa.assignedBy._id.toString() : sa.assignedBy?.toString();
        return byId === aId;
      }).length;

      return {
        _id: adm._id,
        name: adm.name,
        email: adm.email,
        role: adm.role,
        status: adm.status || 'active',
        createdAt: adm.createdAt,
        assignedStaffCount,
        managedEventsCount: events.length
      };
    });
  }

  async createOrPromoteAdmin({ userId, name, email, password, actor = 'Super Admin' }) {
    if (userId) {
      const existingUser = await User.findById(userId);
      if (!existingUser) throw new ApiError(404, 'User to promote not found');
      existingUser.role = 'admin';
      existingUser.status = 'active';
      await existingUser.save();
      this.logAction('USER_PROMOTED_TO_ADMIN', actor, `Promoted ${existingUser.name} (${existingUser.email}) to Admin`);
      return existingUser;
    }

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required to create a new Admin');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(400, 'A user with this email already exists');
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'active'
    });

    this.logAction('ADMIN_ACCOUNT_CREATED', actor, `Created new Admin account for ${name} (${email})`);
    return newAdmin;
  }

  async updateAdminStatus(adminId, status, actor = 'Super Admin') {
    if (!['active', 'suspended', 'on_hold'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const admin = await User.findById(adminId);
    if (!admin) throw new ApiError(404, 'Admin not found');
    if (admin.role !== 'admin') throw new ApiError(400, 'Target user is not an Admin');

    admin.status = status;
    await admin.save();

    this.logAction('ADMIN_STATUS_CHANGED', actor, `Updated status for ${admin.name} to ${status}`);
    return admin;
  }

  async demoteAdmin(adminId, newRole = 'attendee', actor = 'Super Admin') {
    if (!['attendee', 'organizer', 'staff'].includes(newRole)) {
      throw new ApiError(400, 'Invalid demotion target role');
    }

    const admin = await User.findById(adminId);
    if (!admin) throw new ApiError(404, 'Admin not found');
    if (admin.role !== 'admin') throw new ApiError(400, 'User is not an Admin');

    admin.role = newRole;
    await admin.save();

    this.logAction('ADMIN_DEMOTED', actor, `Demoted ${admin.name} from Admin to ${newRole}`);
    return admin;
  }

  async deleteAdmin(adminId, actor = 'Super Admin') {
    const admin = await User.findById(adminId);
    if (!admin) throw new ApiError(404, 'Admin not found');
    if (admin.role !== 'admin') throw new ApiError(400, 'User is not an Admin');

    await User.findByIdAndDelete(adminId);
    this.logAction('ADMIN_DELETED', actor, `Deleted Admin ${admin.name} (${admin.email})`);
    return { success: true, message: `Admin ${admin.name} deleted successfully` };
  }

  // 4. Financial Settlement & Payout Engine
  async getSettlementSummary() {
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const grossRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const stripeEstimatedFees = grossRevenue * 0.029 + confirmedBookings.length * 0.3;
    const venueRate = venueSettingsState.venueCommissionRate / 100;
    const venueNetTake = grossRevenue * venueRate;
    const organizerEscrow = Math.max(0, grossRevenue - venueNetTake - stripeEstimatedFees);

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      venueCommissionRate: venueSettingsState.venueCommissionRate,
      venueNetTake: Number(venueNetTake.toFixed(2)),
      stripeEstimatedFees: Number(stripeEstimatedFees.toFixed(2)),
      organizerEscrow: Number(organizerEscrow.toFixed(2)),
      totalTransactions: confirmedBookings.length,
      ledgerHistory: venueSettingsState.payoutLedger
    };
  }

  async executeSettlementBatch({ notes = 'Automated settlement batch', actor = 'Super Admin' }) {
    const summary = await this.getSettlementSummary();
    const batchId = `SETTLE-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const newRecord = {
      batchId,
      grossAmount: summary.grossRevenue,
      venueCutAmount: summary.venueNetTake,
      organizerPayoutPool: summary.organizerEscrow,
      settledAt: new Date().toISOString(),
      status: 'settled',
      notes
    };

    venueSettingsState.payoutLedger.unshift(newRecord);
    this.logAction('SETTLEMENT_EXECUTED', actor, `Settlement batch ${batchId} executed. Venue net: $${summary.venueNetTake}`);

    return {
      success: true,
      message: `Settlement batch ${batchId} successfully executed`,
      batch: newRecord
    };
  }

  // 5. Live System Reliability & Telemetry
  getSystemDiagnostics() {
    const memory = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2)
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      database: {
        mode: 'Resilient Dual Engine (In-Memory NeDB + MongoDB Atlas)',
        status: 'ONLINE',
        autoSeeded: true
      },
      gateLockdownStatus: venueSettingsState.emergencyGateLockdown ? 'LOCKED_FREEZE' : 'ACTIVE_OPERATIONAL'
    };
  }

  logAction(action, actor, details) {
    venueSettingsState.auditLogs.unshift({
      id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details
    });
    if (venueSettingsState.auditLogs.length > 50) {
      venueSettingsState.auditLogs.pop();
    }
  }
}

module.exports = new SuperAdminService();
