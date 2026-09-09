const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT from the Authorization header and attaches the user to req.user.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists',
        errorCode: 'UNAUTHORIZED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      errorCode: 'UNAUTHORIZED',
    });
  }
};

// Restricts a route to specific roles. Usage: authorize('manager', 'agent')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        errorCode: 'FORBIDDEN',
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
