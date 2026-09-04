const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const promoCodeSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      required: false
    },
    scope: {
      type: String,
      enum: ['all', 'event'],
      default: 'all'
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['flat', 'percentage'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'organizer', 'system', 'staff'],
      default: 'admin'
    },
    isNewUserOnly: {
      type: Boolean,
      default: false
    },
    validFrom: {
      type: Date,
      default: null
    },
    validUntil: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    maxTicketsApplicable: {
      type: Number,
      default: null
    },
    isEarlyExitReward: {
      type: Boolean,
      default: false
    },
    earlyExitMetadata: {
      sourceBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
      },
      sourceEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
      },
      exitCount: {
        type: Number,
        default: 1
      },
      minutesEarly: {
        type: Number,
        default: 0
      },
      exitedAt: {
        type: Date,
        default: Date.now
      }
    },
    usedByUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        bookingCode: {
          type: String,
          default: ''
        },
        usedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

promoCodeSchema.index({ code: 1, event: 1 });
promoCodeSchema.index({ code: 1 });

const MongoosePromoCode = mongoose.model('PromoCode', promoCodeSchema);
module.exports = getModel('PromoCode', MongoosePromoCode);
