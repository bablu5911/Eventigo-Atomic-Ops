const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const eventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    banner: {
      type: String,
      default: ''
    },
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: 'Online' }
    },
    startDateTime: {
      type: Date,
      required: true
    },
    endDateTime: {
      type: Date,
      required: true
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    meetingLink: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft'
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1
    },
    eventId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

eventSchema.index({ title: 'text', description: 'text', 'venue.city': 'text' });

const MongooseEvent = mongoose.model('Event', eventSchema);
module.exports = getModel('Event', MongooseEvent);
