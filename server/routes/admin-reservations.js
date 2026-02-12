/**
 * MARIFAH - Admin Reservation Routes
 * List, filter, and update reservation status
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/reservations - List with filters
router.get('/', (req, res) => {
  try {
    const { status, source, date, dateFrom, dateTo, page, limit } = req.query;
    const result = db.reservations.list({
      status,
      source,
      date,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20
    });
    res.json(result);
  } catch (error) {
    console.error('Admin reservations error:', error);
    res.status(500).json({ error: 'Erreur chargement reservations' });
  }
});

// PUT /api/admin/reservations/:id/status - Update status
router.put('/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const updated = db.reservations.updateStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Reservation non trouvee' });

    res.json({ success: true });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ error: 'Erreur mise a jour statut' });
  }
});

module.exports = router;
