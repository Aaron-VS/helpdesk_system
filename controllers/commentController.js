const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { ROLES } = require('../config/constants');

// @route  POST /api/tickets/:id/comments
// @access Customer (owner, isInternal forced false), Agent/Manager (either)
const addComment = asyncHandler(async (req, res) => {
  const { message, isInternal } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  const isOwner = ticket.customerId.equals(req.user._id);
  const isAssignedAgent =
    ticket.assignedAgentId && ticket.assignedAgentId.equals(req.user._id);
  const isManager = req.user.role === ROLES.MANAGER;

  if (!isOwner && !isAssignedAgent && !isManager) {
    throw new AppError('You do not have access to this ticket', 403, 'FORBIDDEN');
  }

  // Customers can never post internal notes, regardless of what they send.
  const forcedInternal = req.user.role === ROLES.CUSTOMER ? false : !!isInternal;

  const comment = await Comment.create({
    ticketId: ticket._id,
    authorId: req.user._id,
    message,
    isInternal: forcedInternal,
  });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: { _id: comment._id },
  });
});

// @route  GET /api/tickets/:id/comments
// @access Customer (owner, sees non-internal only), Agent/Manager (see all)
const getComments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  const isOwner = ticket.customerId.equals(req.user._id);
  const isAssignedAgent =
    ticket.assignedAgentId && ticket.assignedAgentId.equals(req.user._id);
  const isManager = req.user.role === ROLES.MANAGER;

  if (!isOwner && !isAssignedAgent && !isManager) {
    throw new AppError('You do not have access to this ticket', 403, 'FORBIDDEN');
  }

  const filter = { ticketId: ticket._id };
  // Customers never see internal notes (Module 8 boundary).
  if (req.user.role === ROLES.CUSTOMER) {
    filter.isInternal = false;
  }

  const comments = await Comment.find(filter)
    .populate('authorId', 'name role')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, message: 'Comments fetched', data: comments });
});

module.exports = { addComment, getComments };
