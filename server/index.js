/**
 * MARIFAH - Backend Server
 * Express server for chatbot API, reservations, admin, and vouchers
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');
const adminAuth = require('./middleware/auth');

// Initialize database
db.init();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ==========================================
// PUBLIC ROUTES
// ==========================================
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/vouchers', require('./routes/vouchers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Login (no auth required)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === config.ADMIN_PASSWORD) {
    res.json({ token: config.ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
});

// Protected admin routes
app.use('/api/admin/menu', adminAuth, require('./routes/admin-menu'));
app.use('/api/admin/reservations', adminAuth, require('./routes/admin-reservations'));
app.use('/api/admin/vouchers', adminAuth, require('./routes/admin-vouchers'));

// ==========================================
// FRONTEND CATCH-ALL
// ==========================================

// Serve admin pages directly (not SPA catch-all)
app.get('/admin/*', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.sendFile(filePath, (err) => {
    if (err) res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
  });
});

// SPA catch-all for main site
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(config.PORT, () => {
  console.log(`
  MARIFAH Server running!

  Local:    http://localhost:${config.PORT}
  Admin:    http://localhost:${config.PORT}/admin/index.html

  API Endpoints:
  - POST /api/chat              - Chatbot
  - POST /api/reservation       - New reservation
  - GET  /api/vouchers/validate - Validate voucher
  - POST /api/admin/login       - Admin login
  - GET  /api/admin/menu        - Menu CRUD
  - GET  /api/admin/reservations - Reservation history
  - GET  /api/admin/vouchers    - Voucher management
  - GET  /api/health            - Health check
  `);
});
