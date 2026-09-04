const superadminService = require('../services/superadminService');

// 1. Admin Management
const getAllAdmins = async (req, res) => {
  const admins = await superadminService.getAllAdmins();
  res.status(200).json({
    success: true,
    admins
  });
};

const createOrPromoteAdmin = async (req, res) => {
  const { userId, name, email, password } = req.body;
  const admin = await superadminService.createOrPromoteAdmin({
    userId,
    name,
    email,
    password,
    actor: req.user?.name || 'Super Admin'
  });
  res.status(201).json({
    success: true,
    message: `Admin privileges granted to ${admin.name}`,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status
    }
  });
};

const updateAdminStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const admin = await superadminService.updateAdminStatus(id, status, req.user?.name);
  res.status(200).json({
    success: true,
    message: `Admin ${admin.name} status updated to '${status}'`,
    admin
  });
};

const demoteAdmin = async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;
  const user = await superadminService.demoteAdmin(id, newRole, req.user?.name);
  res.status(200).json({
    success: true,
    message: `Admin ${user.name} demoted to '${user.role}'`,
    user
  });
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const result = await superadminService.deleteAdmin(id, req.user?.name);
  res.status(200).json(result);
};

// 2. Venue & Gate Lockdown Controls
const getVenueSettings = async (req, res) => {
  const settings = superadminService.getVenueSettings();
  res.status(200).json({
    success: true,
    settings
  });
};

const updateVenueSettings = async (req, res) => {
  const settings = superadminService.updateVenueSettings(req.body, req.user?.name);
  res.status(200).json({
    success: true,
    message: 'Venue settings updated successfully',
    settings
  });
};

const toggleEmergencyGateLockdown = async (req, res) => {
  const { enabled, reason } = req.body;
  const status = superadminService.toggleEmergencyGateLockdown(enabled, reason, req.user?.name);
  res.status(200).json({
    success: true,
    message: enabled
      ? '⚠️ EMERGENCY VENUE LOCKDOWN ACTIVATED: All entry gates frozen'
      : '✅ EMERGENCY VENUE LOCKDOWN LIFTED: All gates operational',
    status
  });
};

// 3. Financial Settlements & Diagnostics
const getSettlementSummary = async (req, res) => {
  const summary = await superadminService.getSettlementSummary();
  res.status(200).json({
    success: true,
    summary
  });
};

const executeSettlement = async (req, res) => {
  const { notes } = req.body;
  const result = await superadminService.executeSettlementBatch({
    notes,
    actor: req.user?.name || 'Super Admin'
  });
  res.status(200).json(result);
};

const getSystemDiagnostics = async (req, res) => {
  const diagnostics = superadminService.getSystemDiagnostics();
  res.status(200).json({
    success: true,
    diagnostics
  });
};

module.exports = {
  getAllAdmins,
  createOrPromoteAdmin,
  updateAdminStatus,
  demoteAdmin,
  deleteAdmin,
  getVenueSettings,
  updateVenueSettings,
  toggleEmergencyGateLockdown,
  getSettlementSummary,
  executeSettlement,
  getSystemDiagnostics
};
