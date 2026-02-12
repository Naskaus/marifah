/**
 * MARIFAH - Admin Authentication Middleware
 * Simple token-based auth using x-admin-token header
 */

const config = require('../config');

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];

  if (!token || token !== config.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  next();
}

module.exports = adminAuth;
