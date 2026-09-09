const SlaRule = require('../models/SlaRule');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route  POST /api/sla-rules
// @access Manager
const createSlaRule = asyncHandler(async (req, res) => {
  const { category, priority, resolutionHours } = req.body;

  const existing = await SlaRule.findOne({ category, priority });
  if (existing) {
    throw new AppError(
      'An SLA rule already exists for this category/priority combination',
      409,
      'DUPLICATE_KEY'
    );
  }

  const rule = await SlaRule.create({ category, priority, resolutionHours });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: rule,
  });
});

// @route  GET /api/sla-rules
// @access Any authenticated user (read-only, needed to show SLA info to agents/customers)
const getSlaRules = asyncHandler(async (req, res) => {
  const rules = await SlaRule.find().sort({ category: 1, priority: 1 });
  res.status(200).json({ success: true, message: 'SLA rules fetched', data: rules });
});

// @route  PUT /api/sla-rules/:id
// @access Manager
const updateSlaRule = asyncHandler(async (req, res) => {
  const { resolutionHours } = req.body;

  const rule = await SlaRule.findById(req.params.id);
  if (!rule) throw new AppError('SLA rule not found', 404, 'NOT_FOUND');

  rule.resolutionHours = resolutionHours;
  await rule.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: rule,
  });
});

module.exports = { createSlaRule, getSlaRules, updateSlaRule };
