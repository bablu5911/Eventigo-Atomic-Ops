const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const getModel = require('./modelProxy');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function () {
        return (this.provider || this.authProvider || 'local') === 'local';
      },
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['attendee', 'organizer', 'staff', 'admin', 'superadmin'],
      default: 'attendee'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'on_hold'],
      default: 'active'
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local'
    },
    providerId: {
      type: String,
      default: null
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local'
    },
    avatar: {
      type: String,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    twoFactorCode: {
      type: String,
      select: false
    },
    twoFactorExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);
module.exports = getModel('User', MongooseUser);
