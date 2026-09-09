const express = require('express');
const {
  getAgentWorkload,
  getSlaComplianceReport,
  getCategoryBreakdown,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Module 12 - an agent can view their own workload; a manager can view any agent's.
router.get('/agents/:id/workload', authorize(ROLES.AGENT, ROLES.MANAGER), getAgentWorkload);

// Module 13 - manager-only aggregate reports.
router.get('/manager/reports/sla', authorize(ROLES.MANAGER), getSlaComplianceReport);
router.get('/manager/reports/volume', authorize(ROLES.MANAGER), getCategoryBreakdown);

module.exports = router;
