const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const ticketTypeSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Ticket type name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    maxPerUser: {
      type: Number,
      default: 5,
      min: 1
    },
    saleStartDate: {
      type: Date,
      required: true
    },
    saleEndDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const MongooseTicketType = mongoose.model('TicketType', ticketTypeSchema);
module.exports = getModel('TicketType', MongooseTicketType);
