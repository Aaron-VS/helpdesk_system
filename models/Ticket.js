const mongoose = require('mongoose');
const {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
} = require('../config/constants');

// Embedded sub-document: a status change log entry.
// Embedded (not a separate collection) because it is small, always read
// together with the parent ticket, and never queried independently.
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(TICKET_STATUS), required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    // Reference, not embed: the customer document is large, shared across
    // many tickets, and updated independently of any single ticket.
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
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
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
    },
    slaDueAt: {
      type: Date,
      required: true,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Speeds up "my tickets" queries for customers and agents.
ticketSchema.index({ customerId: 1 });
ticketSchema.index({ assignedAgentId: 1 });
// Speeds up SLA breach sweep jobs / dashboards filtering by status.
ticketSchema.index({ status: 1, slaDueAt: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
