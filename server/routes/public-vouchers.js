/**
 * MARIFAH - Public Voucher Routes
 * Get voucher details, claim with phone, get customer's vouchers
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/vouchers/validate/:code - Legacy validation endpoint
router.get('/validate/:code', (req, res) => {
  try {
    const result = db.vouchers.validate(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Erreur de validation' });
  }
});

// GET /api/vouchers/my-vouchers - Get customer's claimed vouchers
// Header: x-customer-phone
router.get('/my-vouchers', (req, res) => {
  try {
    const phone = req.headers['x-customer-phone'];
    if (!phone) {
      return res.status(400).json({ error: 'Numero de telephone requis' });
    }

    const claims = db.voucherClaims.getByCustomerPhone(phone);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement vouchers' });
  }
});

// GET /api/vouchers/:code - Get voucher info for public display
router.get('/:code', (req, res) => {
  try {
    const voucher = db.vouchers.getByCode(req.params.code);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher introuvable' });
    }

    if (!voucher.is_active) {
      return res.status(410).json({ error: 'Ce voucher n\'est plus actif' });
    }

    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return res.status(410).json({ error: 'Ce voucher a expire' });
    }

    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      return res.status(410).json({ error: 'Ce voucher a atteint sa limite d\'utilisation' });
    }

    // Check if requesting customer already claimed it
    const phone = req.headers['x-customer-phone'];
    let claim = null;
    if (phone) {
      claim = db.voucherClaims.getClaimForCustomerVoucher(voucher.id, phone);
    }

    res.json({
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      expiry_date: voucher.expiry_date,
      background_image: voucher.background_image,
      claim: claim || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement voucher' });
  }
});

// POST /api/vouchers/:code/claim - Claim a voucher
router.post('/:code/claim', (req, res) => {
  try {
    const { phone, name, email } = req.body;

    if (!phone || phone.trim().length < 6) {
      return res.status(400).json({ error: 'Numero de telephone valide requis' });
    }

    const voucher = db.vouchers.getByCode(req.params.code);
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher introuvable' });
    }

    if (!voucher.is_active) {
      return res.status(410).json({ error: 'Ce voucher n\'est plus actif' });
    }

    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return res.status(410).json({ error: 'Ce voucher a expire' });
    }

    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      return res.status(410).json({ error: 'Ce voucher a atteint sa limite d\'utilisation' });
    }

    // Find or create customer
    const customer = db.customers.findOrCreate(phone.trim(), {
      name: name ? name.trim() : null,
      email: email ? email.trim() : null
    });

    // Claim the voucher
    const claim = db.voucherClaims.claim(voucher.id, customer.id);

    res.json({
      success: true,
      claim,
      customer: { id: customer.id, phone: customer.phone, name: customer.name }
    });
  } catch (error) {
    console.error('Claim error:', error);
    res.status(500).json({ error: 'Erreur lors du claim' });
  }
});

module.exports = router;
