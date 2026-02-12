/**
 * MARIFAH - Public Voucher Validation
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/vouchers/validate/:code - Validate a voucher code
router.get('/validate/:code', (req, res) => {
  try {
    const result = db.vouchers.validate(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Erreur de validation' });
  }
});

module.exports = router;
