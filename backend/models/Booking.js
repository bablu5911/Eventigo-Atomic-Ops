const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const ticketItemSchema = new mongoose.Schema(
  {
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketType',
      required: true
    },
    nameSnapshot: {
      type: String,
      required: true
    },
    priceSnapshot: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    tickets: [ticketItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    promoCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    totalTicketsCount: {
      type: Number,
      default: 1,
      min: 1
    },
    checkedInCount: {
      type: Number,
      default: 0,
      min: 0
    },
    individualTickets: [
      {
        ticketCode: { type: String, required: true },
        ticketIndex: { type: Number, required: true },
        ticketTypeName: { type: String, default: 'Standard Pass' },
        status: { type: String, enum: ['valid', 'used', 'cancelled', 'exited_early'], default: 'valid' },
        admittedAt: { type: Date, default: null },
        exitedAt: { type: Date, default: null }
      }
    ],
    checkInLogs: [
      {
        admittedCount: { type: Number, required: true },
        admittedAt: { type: Date, default: Date.now },
        gate: { type: String, default: '' },
        note: { type: String, default: '' }
      }
    ],
    earlyExitCount: {
      type: Number,
      default: 0,
      min: 0
    },
    earlyExitLogs: [
      {
        exitCount: { type: Number, required: true },
        minutesEarly: { type: Number, default: 0 },
        discountGiven: { type: Number, default: 0 },
        couponCode: { type: String, default: '' },
        exitedAt: { type: Date, default: Date.now },
        gate: { type: String, default: 'Exit Gate B' }
      }
    ],
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'refunded', 'partially_checked_in', 'scanned_invalid', 'archived'],
      default: 'confirmed'
    },
    attendedAt: {
      type: Date,
      default: null
    },
    qrCodeUrl: {
      type: String,
      default: ''
    },
    securityHash: {
      type: String,
      default: ''
    },
    gateEntry: {
      type: String,
      default: 'Gate A • Express Check-In'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'apple_pay', 'google_pay', 'netbanking', 'demo_instant', 'free'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'refunded', 'failed'],
      default: 'paid'
    },
    transactionId: {
      type: String,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

const MongooseBooking = mongoose.model('Booking', bookingSchema);
module.exports = getModel('Booking', MongooseBooking);
