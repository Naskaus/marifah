/**
 * MARIFAH - Admin Voucher CRUD + QR Code generation
 */

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');

// GET /api/admin/vouchers - List all vouchers
router.get('/', (req, res) => {
  try {
    res.json(db.vouchers.list());
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement vouchers' });
  }
});

// POST /api/admin/vouchers - Create voucher
router.post('/', (req, res) => {
  try {
    const { code, discount_type, discount_value, expiry_date, max_uses } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, type et valeur requis' });
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Type doit etre percent ou fixed' });
    }

    const id = db.vouchers.insert({
      code,
      discount_type,
      discount_value: Number(discount_value),
      expiry_date: expiry_date || null,
      max_uses: max_uses ? Number(max_uses) : null
    });

    res.json({ success: true, id, voucher: db.vouchers.getById(id) });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ce code existe deja' });
    }
    res.status(500).json({ error: 'Erreur creation voucher' });
  }
});

// PUT /api/admin/vouchers/:id - Update voucher
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = db.vouchers.update(id, req.body);

    if (!updated) return res.status(404).json({ error: 'Voucher non trouve' });
    res.json({ success: true, voucher: db.vouchers.getById(id) });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ce code existe deja' });
    }
    res.status(500).json({ error: 'Erreur mise a jour voucher' });
  }
});

// DELETE /api/admin/vouchers/:id - Delete voucher
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = db.vouchers.delete(id);

    if (!deleted) return res.status(404).json({ error: 'Voucher non trouve' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression voucher' });
  }
});

// GET /api/admin/vouchers/:id/qr - Generate QR code PNG
router.get('/:id/qr', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const voucher = db.vouchers.getById(id);

    if (!voucher) return res.status(404).json({ error: 'Voucher non trouve' });

    // QR code contains the validation URL
    const validationUrl = `${req.protocol}://${req.get('host')}/api/vouchers/validate/${voucher.code}`;
    const qrBuffer = await QRCode.toBuffer(validationUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1f2937', light: '#ffffff' }
    });

    res.set('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Erreur generation QR' });
  }
});

module.exports = router;
