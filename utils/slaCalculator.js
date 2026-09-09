const SlaRule = require('../models/SlaRule');
const { AppError } = require('../middleware/errorHandler');

// Looks up the SLA rule for a given category+priority and returns the
// slaDueAt timestamp (createdAt + resolutionHours).
const calculateSlaDueDate = async (category, priority, fromDate = new Date()) => {
  const rule = await SlaRule.findOne({ category, priority });

  if (!rule) {
    throw new AppError(
      `No SLA rule configured for category "${category}" and priority "${priority}"`,
      400,
      'SLA_RULE_NOT_FOUND'
    );
  }

  const dueDate = new Date(fromDate);
  dueDate.setHours(dueDate.getHours() + rule.resolutionHours);
  return dueDate;
};

module.exports = { calculateSlaDueDate };
