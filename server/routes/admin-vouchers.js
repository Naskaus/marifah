/**
 * MARIFAH - Admin Voucher CRUD + Background image upload + Claims management
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const upload = require('../middleware/upload');

// GET /api/admin/vouchers - List all vouchers (with claim counts)
router.get('/', (req, res) => {
  try {
    const vouchers = db.vouchers.list();
    // Attach claim counts to each voucher
    const result = vouchers.map(v => {
      const counts = db.voucherClaims.getClaimCounts(v.id);
      return { ...v, claims_count: counts.claimed, used_count: counts.used };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement vouchers' });
  }
});

// POST /api/admin/vouchers - Create voucher
router.post('/', (req, res) => {
  try {
    const { code, discount_type, discount_value, expiry_date, max_uses, title, description } = req.body;

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
      max_uses: max_uses ? Number(max_uses) : null,
      title: title || null,
      description: description || null
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

    // Delete background image if exists
    const voucher = db.vouchers.getById(id);
    if (voucher && voucher.background_image) {
      const imgPath = path.join(__dirname, '..', '..', 'uploads', 'vouchers', voucher.background_image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    const deleted = db.vouchers.delete(id);
    if (!deleted) return res.status(404).json({ error: 'Voucher non trouve' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression voucher' });
  }
});

// POST /api/admin/vouchers/:id/background - Upload background image
router.post('/:id/background', upload.single('background'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const voucher = db.vouchers.getById(id);

    if (!voucher) {
      // Delete uploaded file if voucher not found
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Voucher non trouve' });
    }

    // Delete old background if exists
    if (voucher.background_image) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'vouchers', voucher.background_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.vouchers.update(id, { background_image: req.file.filename });
    res.json({ success: true, background_image: req.file.filename });
  } catch (error) {
    console.error('Background upload error:', error);
    res.status(500).json({ error: 'Erreur upload image' });
  }
});

// DELETE /api/admin/vouchers/:id/background - Remove background image
router.delete('/:id/background', (req, res) => {
  try {
    const id = Number(req.params.id);
    const voucher = db.vouchers.getById(id);

    if (!voucher) return res.status(404).json({ error: 'Voucher non trouve' });

    if (voucher.background_image) {
      const imgPath = path.join(__dirname, '..', '..', 'uploads', 'vouchers', voucher.background_image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      db.vouchers.update(id, { background_image: null });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression image' });
  }
});

// GET /api/admin/vouchers/:id/claims - List all claims for a voucher
router.get('/:id/claims', (req, res) => {
  try {
    const id = Number(req.params.id);
    const voucher = db.vouchers.getById(id);
    if (!voucher) return res.status(404).json({ error: 'Voucher non trouve' });

    const claims = db.voucherClaims.getByVoucher(id);
    res.json({ voucher, claims });
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement claims' });
  }
});

// PUT /api/admin/vouchers/claims/:claimId/use - Mark a claim as used
router.put('/claims/:claimId/use', (req, res) => {
  try {
    const claimId = Number(req.params.claimId);
    const updated = db.voucherClaims.markUsed(claimId);

    if (!updated) return res.status(404).json({ error: 'Claim non trouve ou deja utilise' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise a jour claim' });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 2MB)' });
  }
  if (err.message && err.message.includes('Seuls les fichiers')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
