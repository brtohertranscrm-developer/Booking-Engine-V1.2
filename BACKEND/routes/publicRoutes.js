const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/motors', (req, res) => {
  // 1. Cek apakah ada aturan Harga Dinamis yang sedang menyala
  db.get(`SELECT markup_percentage FROM price_rules WHERE is_active = 1 LIMIT 1`, (err, rule) => {
    const markup = rule ? rule.markup_percentage : 0;

    // 2. Ambil data motor dan hitung stok otomatis (Hanya plat yang RDY)
    const queryMotors = `
      SELECT m.*, 
             (SELECT COUNT(*) FROM motor_units mu WHERE mu.motor_id = m.id AND mu.status = 'RDY') as stock
      FROM motors m 
      ORDER BY m.base_price ASC
    `;

    db.all(queryMotors, (err, motors) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      // 3. Format data & Terapkan Logika Whitelist
      const formattedMotors = motors.map(motor => {
        let currentPrice = motor.base_price;
        let currentPrice12h = motor.price_12h || 0;
        let isSurge = false;

        const isDynamicAllowed = (motor.allow_dynamic_pricing === undefined || motor.allow_dynamic_pricing === null) 
          ? true 
          : parseInt(motor.allow_dynamic_pricing) === 1;

        if (isDynamicAllowed && markup > 0) {
          currentPrice = motor.base_price + (motor.base_price * (markup / 100));
          currentPrice12h = currentPrice12h + (currentPrice12h * (markup / 100));
          isSurge = true;
        }

        return {
          ...motor,
          // PERBAIKAN: Jangan timpa base_price dan price_12h agar frontend tahu harga aslinya
          current_price: currentPrice,         // Harga 24 jam final (termasuk surge jika aktif)
          current_price_12h: currentPrice12h,  // Harga 12 jam final (termasuk surge jika aktif)
          is_surge: isSurge
        };
      });
      res.json({ success: true, data: formattedMotors || [] });
    });
  });
});

router.get('/lockers', (req, res) => {
  db.all('SELECT * FROM lockers ORDER BY location ASC', (err, rows) => res.json({ success: true, data: rows }));
});

router.get('/promotions', (req, res) => {
  db.all('SELECT * FROM promotions', (err, rows) => res.json({ success: true, data: rows }));
});

router.get('/articles', (req, res) => {
  db.all(`SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

router.get('/articles/:id', (req, res) => {
  db.get('SELECT * FROM articles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
    res.json({ success: true, data: row });
  });
});

// Endpoint untuk cek validasi kode promo
router.post('/promotions/validate', (req, res) => {
  const { code } = req.body;
  
  db.get(`SELECT * FROM promotions WHERE code = ? AND is_active = 1`, [code], (err, promo) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!promo) return res.status(404).json({ success: false, message: "Kode promo tidak ditemukan atau sudah tidak aktif." });

    // Cek limit penggunaan
    if (promo.usage_limit > 0 && promo.current_usage >= promo.usage_limit) {
      return res.status(400).json({ success: false, message: "Kuota kode promo ini sudah habis." });
    }

    res.json({ 
      success: true, 
      data: {
        code: promo.code,
        discount_percent: promo.discount_percent,
        max_discount: promo.max_discount
      } 
    });
  });
});

module.exports = router;