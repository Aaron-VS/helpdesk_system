const express = require('express');
const { body } = require('express-validator');
const { addRating, getRating } = require('../controllers/ratingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post(
  '/',
  authorize(ROLES.CUSTOMER),
  [
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be an integer between 1 and 5'),
    body('comment').optional().trim(),
  ],
  validate,
  addRating
);

router.get('/', getRating);

module.exports = router;
