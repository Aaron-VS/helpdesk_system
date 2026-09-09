const Ticket = require('../models/Ticket');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { TICKET_STATUS, ROLES } = require('../config/constants');

// @route  GET /api/agents/:id/workload
// @access Agent (self only), Manager (any agent)
// Module 12: open ticket count + average resolution time for one agent.
const getAgentWorkload = asyncHandler(async (req, res) => {
  const agentId = req.params.id;

  // Agents may only view their own dashboard, not a colleague's.
  if (req.user.role === ROLES.AGENT && String(req.user._id) !== agentId) {
    throw new AppError("You can only view your own workload dashboard", 403, 'FORBIDDEN');
  }

  const [openCount, resolvedStats] = await Promise.all([
    Ticket.countDocuments({
      assignedAgentId: agentId,
      status: { $nin: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
    }),
    Ticket.aggregate([
      {
        $match: {
          assignedAgentId: new (require('mongoose').Types.ObjectId)(agentId),
          resolvedAt: { $ne: null },
        },
      },
      {
        $project: {
          resolutionMs: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: '$resolutionMs' },
          resolvedCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const avgResolutionHours = resolvedStats.length
    ? +(resolvedStats[0].avgResolutionMs / (1000 * 60 * 60)).toFixed(2)
    : 0;

  res.status(200).json({
    success: true,
    message: 'Agent workload fetched',
    data: {
      agentId,
      openTicketCount: openCount,
      resolvedTicketCount: resolvedStats.length ? resolvedStats[0].resolvedCount : 0,
      averageResolutionHours: avgResolutionHours,
    },
  });
});

// @route  GET /api/manager/reports/sla
// @access Manager
// Module 13: SLA compliance rate across all tickets that have been resolved/closed.
const getSlaComplianceReport = asyncHandler(async (req, res) => {
  const report = await Ticket.aggregate([
    {
      $match: { status: { $in: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] } },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
      },
    },
  ]);

  const total = report.length ? report[0].total : 0;
  const breached = report.length ? report[0].breached : 0;
  const complianceRate = total ? +(((total - breached) / total) * 100).toFixed(2) : 100;

  res.status(200).json({
    success: true,
    message: 'SLA compliance report fetched',
    data: { totalResolvedOrClosed: total, breachedCount: breached, complianceRatePercent: complianceRate },
  });
});

// @route  GET /api/manager/reports/volume
// @access Manager
// Module 13: ticket volume trend by category (a common "breakdown" report).
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await Ticket.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    message: 'Category breakdown fetched',
    data: breakdown.map((b) => ({ category: b._id, count: b.count })),
  });
});

module.exports = { getAgentWorkload, getSlaComplianceReport, getCategoryBreakdown };
