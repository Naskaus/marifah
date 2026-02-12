/**
 * MARIFAH - Reservation API Route
 * Handles form submissions and sends to Telegram + Email, stores in SQLite
 */

const express = require('express');
const router = express.Router();
const telegram = require('../services/telegram');
const email = require('../services/email');
const config = require('../config');
const db = require('../db');

/**
 * POST /api/reservation
 * Create a new reservation
 */
router.post('/', async (req, res) => {
  try {
    const { name, email: emailAddr, phone, date, time, guests, message } = req.body;

    // Validation
    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'phone', 'date', 'time', 'guests']
      });
    }

    // Validate date is not Sunday
    const reservationDate = new Date(date);
    if (reservationDate.getDay() === 0) {
      return res.status(400).json({
        error: 'Nous sommes fermes le dimanche. Veuillez choisir un autre jour.'
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return res.status(400).json({
        error: 'La date de reservation ne peut pas etre dans le passe.'
      });
    }

    const reservationData = { name, email: emailAddr, phone, date, time, guests, message };

    // Send notifications to all enabled channels
    const results = {
      telegram: { ok: false },
      email: { ok: false }
    };

    // Telegram notification
    if (config.NOTIFICATIONS?.telegram !== false) {
      results.telegram = await telegram.sendReservationNotification(reservationData, 'formulaire');
    }

    // Email notification
    if (config.NOTIFICATIONS?.email) {
      results.email = await email.sendReservationEmail(reservationData, 'formulaire');
    }

    // Store in database
    const reservationId = db.reservations.insert({
      ...reservationData,
      source: 'formulaire',
      telegram_sent: results.telegram.ok,
      email_sent: results.email.ok
    });

    console.log('New reservation #' + reservationId + ':', {
      name, date, time, guests, phone,
      notifications: results
    });

    res.json({
      success: true,
      message: 'Reservation envoyee avec succes!',
      reservationId,
      notifications: {
        telegram: results.telegram.ok,
        email: results.email.ok
      }
    });

  } catch (error) {
    console.error('Reservation API error:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi de la reservation. Veuillez nous appeler au 022 782 55 69.'
    });
  }
});

module.exports = router;
