const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    // Reference, not embed: a ticket can accumulate many comments over time
    // (unbounded array growth inside the ticket doc would risk hitting the
    // 16MB document limit on long-running tickets, and comments are also
    // paginated independently in the UI).
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message cannot be empty'],
      trim: true,
    },
    // true  -> internal note, visible only to agents/managers (Module 8)
    // false -> customer-visible reply thread (Module 7)
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Speeds up "fetch all comments for a ticket" - the most common query here.
commentSchema.index({ ticketId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
