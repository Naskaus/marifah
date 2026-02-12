/**
 * MARIFAH - Backend Server
 * Express server for chatbot API and reservations
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reservation', require('./routes/reservation'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(config.PORT, () => {
  console.log(`
  🍜 MARIFAH Server running!

  Local:    http://localhost:${config.PORT}

  API Endpoints:
  - POST /api/chat          - Chatbot
  - POST /api/reservation   - New reservation
  - GET  /api/health        - Health check
  `);
});
