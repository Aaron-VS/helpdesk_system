const express = require('express');
const { body } = require('express-validator');
const {
  createTicket,
  getTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  escalateTicket,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES, TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORY } = require('../config/constants');
const commentRoutes = require('./commentRoutes');
const ratingRoutes = require('./ratingRoutes');

const router = express.Router();

router.use(protect); // every route below requires authentication

// Nested resource routes: /api/tickets/:id/comments, /api/tickets/:id/rating
router.use('/:id/comments', commentRoutes);
router.use('/:id/rating', ratingRoutes);

router.post(
  '/',
  authorize(ROLES.CUSTOMER),
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(Object.values(TICKET_CATEGORY)).withMessage('Invalid category'),
    body('priority').isIn(Object.values(TICKET_PRIORITY)).withMessage('Invalid priority'),
  ],
  validate,
  createTicket
);

router.get('/', getTickets);
router.get('/:id', getTicketById);

router.put(
  '/:id/assign',
  authorize(ROLES.MANAGER),
  [body('agentId').isMongoId().withMessage('Valid agentId is required')],
  validate,
  assignTicket
);

router.put(
  '/:id/status',
  authorize(ROLES.AGENT, ROLES.MANAGER),
  [body('status').isIn(Object.values(TICKET_STATUS)).withMessage('Invalid status')],
  validate,
  updateTicketStatus
);

router.put(
  '/:id/escalate',
  authorize(ROLES.AGENT, ROLES.MANAGER),
  [body('escalateToId').isMongoId().withMessage('Valid escalateToId is required')],
  validate,
  escalateTicket
);

module.exports = router;
