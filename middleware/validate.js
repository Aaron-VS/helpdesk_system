const { validationResult } = require('express-validator');

// Runs after express-validator check chains in a route; returns a clean 400
// if any validation rule failed, instead of letting bad data reach the controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errorCode: 'VALIDATION_ERROR',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
