/**
 * @file authMiddleware.js
 * @description JWT authentication middleware for protected Admin endpoints
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'deception_adg_jwt_secret_2026_super_secure_key';

export function authenticateAdmin(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = String(req.query.token);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or malformed Authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin token'
    });
  }
}

export function generateAdminToken(admin) {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export default {
  authenticateAdmin,
  generateAdminToken
};
