/**
 * MARIFAH - Reservation API Route
 * Handles form submissions and sends to Telegram
 */

const express = require('express');
const router = express.Router();
const telegram = require('../services/telegram');
const email = require('../services/email');
const config = require('../config');

/**
 * POST /api/reservation
 * Create a new reservation
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date, time, guests, message } = req.body;

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
        error: 'Nous sommes fermés le dimanche. Veuillez choisir un autre jour.'
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return res.status(400).json({
        error: 'La date de réservation ne peut pas être dans le passé.'
      });
    }

    const reservationData = { name, email, phone, date, time, guests, message };

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

    // Log reservation (in production, save to database)
    console.log('📅 New reservation:', {
      name,
      date,
      time,
      guests,
      phone,
      notifications: results,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Réservation envoyée avec succès!',
      notifications: {
        telegram: results.telegram.ok,
        email: results.email.ok
      }
    });

  } catch (error) {
    console.error('Reservation API error:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi de la réservation. Veuillez nous appeler au 022 782 55 69.'
    });
  }
});

module.exports = router;
