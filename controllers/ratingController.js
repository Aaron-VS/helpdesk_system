const Rating = require('../models/Rating');
const Ticket = require('../models/Ticket');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { ROLES, TICKET_STATUS } = require('../config/constants');

// @route  POST /api/tickets/:id/rating
// @access Customer (owner only, ticket must be Closed)
const addRating = asyncHandler(async (req, res) => {
  const { score, comment } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  if (!ticket.customerId.equals(req.user._id)) {
    throw new AppError('Only the ticket owner can rate this ticket', 403, 'FORBIDDEN');
  }

  if (ticket.status !== TICKET_STATUS.CLOSED) {
    throw new AppError('Ticket must be Closed before it can be rated', 409, 'BUSINESS_RULE_CONFLICT');
  }

  const existing = await Rating.findOne({ ticketId: ticket._id });
  if (existing) {
    throw new AppError('This ticket has already been rated', 409, 'DUPLICATE_KEY');
  }

  const rating = await Rating.create({
    ticketId: ticket._id,
    customerId: req.user._id,
    score,
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: { _id: rating._id },
  });
});

// @route  GET /api/tickets/:id/rating
// @access Owner, Agent (assigned), Manager
const getRating = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  const isOwner = ticket.customerId.equals(req.user._id);
  const isAssignedAgent =
    ticket.assignedAgentId && ticket.assignedAgentId.equals(req.user._id);
  const isManager = req.user.role === ROLES.MANAGER;

  if (!isOwner && !isAssignedAgent && !isManager) {
    throw new AppError('You do not have access to this ticket', 403, 'FORBIDDEN');
  }

  const rating = await Rating.findOne({ ticketId: ticket._id });
  res.status(200).json({ success: true, message: 'Rating fetched', data: rating });
});

module.exports = { addRating, getRating };
