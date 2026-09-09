const mongoose = require('mongoose');
const { ROLES } = require('../config/constants.js');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    // Only meaningful for agents - used by the assignment engine & workload dashboard.
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Reference, not embed: users are looked up independently (login, admin listing)
// and referenced by many tickets/comments/ratings - embedding would duplicate data.
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
