const express = require('express');
const { body } = require('express-validator');
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// mergeParams: true so we can read :id (ticketId) from the parent router mount.
const router = express.Router({ mergeParams: true });

router.use(protect);

router.post(
  '/',
  [body('message').trim().notEmpty().withMessage('Comment message is required')],
  validate,
  addComment
);

router.get('/', getComments);

module.exports = router;
