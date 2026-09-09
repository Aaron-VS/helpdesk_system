const mongoose = require('mongoose');
const { TICKET_PRIORITY, TICKET_CATEGORY } = require('../config/constants');

const slaRuleSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORY),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      required: true,
    },
    resolutionHours: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

// A given category+priority combination should map to exactly one rule.
slaRuleSchema.index({ category: 1, priority: 1 }, { unique: true });

module.exports = mongoose.model('SlaRule', slaRuleSchema);
