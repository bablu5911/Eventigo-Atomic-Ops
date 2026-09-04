const dashboardService = require('../services/dashboardService');

const getOrganizerDashboard = async (req, res) => {
  const data = await dashboardService.getOrganizerDashboard(req.user.id);
  res.status(200).json({
    success: true,
    data
  });
};

const getAdminDashboard = async (req, res) => {
  const data = await dashboardService.getAdminDashboard();
  res.status(200).json({
    success: true,
    data
  });
};

const getSuperAdminDashboard = async (req, res) => {
  const data = await dashboardService.getSuperAdminDashboard();
  res.status(200).json({
    success: true,
    data
  });
};

module.exports = {
  getOrganizerDashboard,
  getAdminDashboard,
  getSuperAdminDashboard
};
