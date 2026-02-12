/**
 * MARIFAH - Chat API Route
 * Handles chatbot messages via DeepSeek AI
 */

const express = require('express');
const router = express.Router();
const deepseek = require('../services/deepseek');
const telegram = require('../services/telegram');

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

    // If a reservation was detected, send to Telegram
    if (response.reservation) {
      await telegram.sendReservationNotification(response.reservation, 'chatbot');
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
      message: "Désolé, je rencontre un problème technique. Vous pouvez nous appeler au 022 782 55 69 ou utiliser le formulaire de réservation."
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
