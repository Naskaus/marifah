/**
 * MARIFAH - Chat API Route
 * Handles chatbot messages via DeepSeek AI
 */

const express = require('express');
const router = express.Router();
const deepseek = require('../services/deepseek');
const telegram = require('../services/telegram');
const email = require('../services/email');
const config = require('../config');
const db = require('../db');

/**
 * POST /api/chat
 * Send a message to the chatbot
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate session ID if not provided
    const session = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get AI response
    const response = await deepseek.chat(session, message);

    // If a reservation was detected, send notifications and store in DB
    if (response.reservation) {
      const reservationData = response.reservation;
      const results = { telegram: { ok: false }, email: { ok: false } };

      // Telegram notification
      if (config.NOTIFICATIONS?.telegram !== false) {
        results.telegram = await telegram.sendReservationNotification(reservationData, 'chatbot');
      }

      // Email notification
      if (config.NOTIFICATIONS?.email) {
        results.email = await email.sendReservationEmail(reservationData, 'chatbot');
      }

      // Store in database
      db.reservations.insert({
        name: reservationData.name || 'Client chatbot',
        email: reservationData.email || null,
        phone: reservationData.phone || '',
        date: reservationData.date || '',
        time: reservationData.time || '',
        guests: reservationData.guests || 1,
        message: reservationData.message || null,
        source: 'chatbot',
        telegram_sent: results.telegram.ok,
        email_sent: results.email.ok
      });
    }

    res.json({
      message: response.message,
      sessionId: session,
      reservation: response.reservation ? true : false
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Return fallback response
    res.status(500).json({
      error: 'Service temporarily unavailable',
      fallback: true,
      message: "Desole, je rencontre un probleme technique. Vous pouvez nous appeler au 022 782 55 69 ou utiliser le formulaire de reservation."
    });
  }
});

/**
 * DELETE /api/chat/:sessionId
 * Clear conversation history
 */
router.delete('/:sessionId', (req, res) => {
  deepseek.clearHistory(req.params.sessionId);
  res.json({ success: true });
});

module.exports = router;
