const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    recipientName: {
      type: String,
      default: 'All Team Members'
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    isBroadcast: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['general', 'urgent', 'issue_report'],
      default: 'general'
    }
  },
  {
    timestamps: true
  }
);

const MongooseChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
module.exports = getModel('ChatMessage', MongooseChatMessage);
