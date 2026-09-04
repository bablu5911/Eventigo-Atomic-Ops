const mongoose = require('mongoose');
const getModel = require('./modelProxy');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
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

const MongooseCategory = mongoose.model('Category', categorySchema);
module.exports = getModel('Category', MongooseCategory);
