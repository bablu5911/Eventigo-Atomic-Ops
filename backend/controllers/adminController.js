const User = require('../models/User');
const Event = require('../models/Event');
const StaffAssignment = require('../models/StaffAssignment');
const ApiError = require('../utils/ApiError');

const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    success: true,
    users
  });
};

const getStaffMembers = async (req, res) => {
  const staff = await User.find({ role: 'staff' }).select('-password');
  res.status(200).json({
    success: true,
    staff
  });
};

const getOrganizers = async (req, res) => {
  const organizers = await User.find({ role: 'organizer' }).select('-password');
  res.status(200).json({
    success: true,
    organizers
  });
};

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const validRole = ['attendee', 'organizer', 'staff', 'admin', 'superadmin'].includes(role) ? role : 'attendee';

  const user = await User.create({
    name,
    email,
    password,
    role: validRole,
    status: 'active'
  });

  res.status(201).json({
    success: true,
    message: `New account created for ${name} (${validRole})`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'on_hold'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: `Account status updated to '${status}'`,
    user
  });
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['attendee', 'organizer', 'staff', 'admin', 'superadmin'].includes(role)) {
    throw new ApiError(400, 'Invalid role value');
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: `User role updated to '${role}'`,
    user
  });
};

// Staff Work Assignments
const getStaffAssignments = async (req, res) => {
  const assignments = await StaffAssignment.find()
    .populate('staff', 'name email')
    .populate('event', 'title eventId venue')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    assignments
  });
};

const createStaffAssignment = async (req, res) => {
  const { staffId, eventId, duty, gate, shiftStart, shiftEnd } = req.body;

  if (!staffId || !eventId) {
    throw new ApiError(400, 'Staff member and Event are required');
  }

  const staffUser = await User.findById(staffId);
  if (!staffUser || staffUser.role !== 'staff') {
    throw new ApiError(400, 'Selected user is not a registered staff member');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Target event not found');
  }

  const assignment = await StaffAssignment.create({
    staff: staffId,
    event: eventId,
    duty: duty || 'Gate Check-in & QR Verification',
    gate: gate || 'Main Entry Gate',
    shiftStart: shiftStart ? new Date(shiftStart) : new Date(),
    shiftEnd: shiftEnd ? new Date(shiftEnd) : new Date(Date.now() + 8 * 3600000),
    status: 'assigned',
    assignedBy: req.user.id
  });

  const populated = await StaffAssignment.findById(assignment._id)
    .populate('staff', 'name email')
    .populate('event', 'title eventId venue')
    .populate('assignedBy', 'name email');

  res.status(201).json({
    success: true,
    message: `Staff member ${staffUser.name} successfully assigned to ${event.title}`,
    assignment: populated
  });
};

const deleteStaffAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await StaffAssignment.findByIdAndDelete(id);
  if (!assignment) {
    throw new ApiError(404, 'Staff assignment record not found');
  }

  res.status(200).json({
    success: true,
    message: 'Staff assignment successfully removed'
  });
};

// Assign Organizer to Event
const assignOrganizerToEvent = async (req, res) => {
  const { eventId } = req.params;
  const { organizerId } = req.body;

  if (!organizerId) {
    throw new ApiError(400, 'Organizer ID is required');
  }

  const organizer = await User.findById(organizerId);
  if (!organizer) {
    throw new ApiError(404, 'Organizer user not found');
  }

  // If user is not yet an organizer, upgrade them
  if (organizer.role !== 'organizer' && organizer.role !== 'admin' && organizer.role !== 'superadmin') {
    await User.findByIdAndUpdate(organizerId, { role: 'organizer' });
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { organizer: organizerId },
    { new: true }
  ).populate('organizer', 'name email');

  if (!updatedEvent) {
    throw new ApiError(404, 'Event not found');
  }

  res.status(200).json({
    success: true,
    message: `Event '${updatedEvent.title}' assigned to organizer ${organizer.name}`,
    event: updatedEvent
  });
};

module.exports = {
  getAllUsers,
  getStaffMembers,
  getOrganizers,
  createUser,
  updateUserStatus,
  updateUserRole,
  getStaffAssignments,
  createStaffAssignment,
  deleteStaffAssignment,
  assignOrganizerToEvent
};
