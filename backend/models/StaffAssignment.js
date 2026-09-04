const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const staffAssignmentSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    duty: {
      type: String,
      required: true,
      trim: true,
      default: 'Gate Check-in & Security'
    },
    gate: {
      type: String,
      default: 'Main Entry Gate',
      trim: true
    },
    shiftStart: {
      type: Date
    },
    shiftEnd: {
      type: Date
    },
    status: {
      type: String,
      enum: ['assigned', 'active', 'completed'],
      default: 'assigned'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const MongooseStaffAssignment = mongoose.model('StaffAssignment', staffAssignmentSchema);
module.exports = getModel('StaffAssignment', MongooseStaffAssignment);
