const express = require('express');
const { body } = require('express-validator');
const { createSlaRule, getSlaRules, updateSlaRule } = require('../controllers/slaRuleController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES, TICKET_PRIORITY, TICKET_CATEGORY } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', getSlaRules);

router.post(
  '/',
  authorize(ROLES.MANAGER),
  [
    body('category').isIn(Object.values(TICKET_CATEGORY)).withMessage('Invalid category'),
    body('priority').isIn(Object.values(TICKET_PRIORITY)).withMessage('Invalid priority'),
    body('resolutionHours').isInt({ min: 1 }).withMessage('resolutionHours must be a positive integer'),
  ],
  validate,
  createSlaRule
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER),
  [body('resolutionHours').isInt({ min: 1 }).withMessage('resolutionHours must be a positive integer')],
  validate,
  updateSlaRule
);

module.exports = router;
