const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { calculateSlaDueDate } = require('../utils/slaCalculator');
const {
  ROLES,
  TICKET_STATUS,
  VALID_STATUS_TRANSITIONS,
} = require('../config/constants');

// Checks a ticket for SLA breach and flags it if past due and not resolved/closed.
// Called opportunistically whenever a ticket is read, instead of relying only
// on a background cron job - keeps the demo self-contained.
const checkAndFlagBreach = async (ticket) => {
  const isOpenState =
    ticket.status !== TICKET_STATUS.RESOLVED && ticket.status !== TICKET_STATUS.CLOSED;

  if (isOpenState && !ticket.slaBreached && new Date() > ticket.slaDueAt) {
    ticket.slaBreached = true;
    await ticket.save();
  }
  return ticket;
};

// @route  POST /api/tickets
// @access Customer
const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, category, priority } = req.body;

  const slaDueAt = await calculateSlaDueDate(category, priority);

  const ticket = await Ticket.create({
    subject,
    description,
    category,
    priority,
    customerId: req.user._id,
    slaDueAt,
    statusHistory: [
      { status: TICKET_STATUS.OPEN, changedBy: req.user._id },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: { _id: ticket._id, slaDueAt: ticket.slaDueAt },
  });
});

// @route  GET /api/tickets
// @access Customer (own tickets), Agent (assigned tickets), Manager (all tickets)
const getTickets = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customerId = req.user._id;
  } else if (req.user.role === ROLES.AGENT) {
    filter.assignedAgentId = req.user._id;
  }
  // Manager gets no filter -> sees all tickets.

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const tickets = await Ticket.find(filter)
    .populate('customerId', 'name email')
    .populate('assignedAgentId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, message: 'Tickets fetched', data: tickets });
});

// @route  GET /api/tickets/:id
// @access Customer (owner), Agent (assignee), Manager (any)
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate('assignedAgentId', 'name email');

  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const isOwner = ticket.customerId._id.equals(req.user._id);
  const isAssignedAgent =
    ticket.assignedAgentId && ticket.assignedAgentId._id.equals(req.user._id);
  const isManager = req.user.role === ROLES.MANAGER;

  if (!isOwner && !isAssignedAgent && !isManager) {
    throw new AppError('You do not have access to this ticket', 403, 'FORBIDDEN');
  }

  await checkAndFlagBreach(ticket);

  res.status(200).json({ success: true, message: 'Ticket fetched', data: ticket });
});

// @route  PUT /api/tickets/:id/assign
// @access Manager
const assignTicket = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  const agent = await User.findOne({ _id: agentId, role: ROLES.AGENT });
  if (!agent) {
    throw new AppError('Assigned agent must be a valid agent account', 400, 'VALIDATION_ERROR');
  }

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Cannot reassign a closed ticket', 409, 'BUSINESS_RULE_CONFLICT');
  }

  ticket.assignedAgentId = agent._id;
  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { assignedAgentId: ticket.assignedAgentId },
  });
});

// @route  PUT /api/tickets/:id/status
// @access Agent (assigned), Manager
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  const isAssignedAgent =
    ticket.assignedAgentId && ticket.assignedAgentId.equals(req.user._id);
  const isManager = req.user.role === ROLES.MANAGER;

  if (!isAssignedAgent && !isManager) {
    throw new AppError('Only the assigned agent or a manager can update status', 403, 'FORBIDDEN');
  }

  const allowedNextStates = VALID_STATUS_TRANSITIONS[ticket.status] || [];
  if (!allowedNextStates.includes(status)) {
    throw new AppError(
      `Cannot move ticket from "${ticket.status}" to "${status}"`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }

  ticket.status = status;
  ticket.statusHistory.push({ status, changedBy: req.user._id });

  if (status === TICKET_STATUS.RESOLVED) {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { status: ticket.status },
  });
});

// @route  PUT /api/tickets/:id/escalate
// @access Agent, Manager
const escalateTicket = asyncHandler(async (req, res) => {
  const { escalateToId } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND');

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Cannot escalate a closed ticket', 409, 'BUSINESS_RULE_CONFLICT');
  }

  const seniorAgent = await User.findOne({
    _id: escalateToId,
    role: { $in: [ROLES.AGENT, ROLES.MANAGER] },
  });
  if (!seniorAgent) {
    throw new AppError('Escalation target must be a valid agent/manager', 400, 'VALIDATION_ERROR');
  }

  ticket.isEscalated = true;
  ticket.escalatedTo = seniorAgent._id;
  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Ticket escalated successfully',
    data: { isEscalated: true, escalatedTo: ticket.escalatedTo },
  });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  escalateTicket,
  checkAndFlagBreach,
};
