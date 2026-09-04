const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const broadcastSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Notification title/directive is required'],
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: [true, 'Notification message text is required'],
      trim: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['info', 'gate_directive', 'urgent'],
      default: 'gate_directive'
    },
    targetGate: {
      type: String,
      default: 'All Gates',
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const MongooseBroadcast = mongoose.model('BroadcastNotification', broadcastSchema);
module.exports = getModel('BroadcastNotification', MongooseBroadcast);
