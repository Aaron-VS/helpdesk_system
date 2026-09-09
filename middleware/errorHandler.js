// Custom error class so controllers can throw errors with a status code + errorCode.
class AppError extends Error {
  constructor(message, statusCode, errorCode = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// Wraps async route handlers so rejected promises are forwarded to the error
// handler instead of crashing the server (Pitfall: unhandled promise rejection).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Must be registered LAST, after all routes.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'SERVER_ERROR';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
    errorCode = 'NOT_FOUND';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for field: ${Object.keys(err.keyValue).join(', ')}`;
    errorCode = 'DUPLICATE_KEY';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
};

module.exports = { AppError, asyncHandler, errorHandler, notFound };
