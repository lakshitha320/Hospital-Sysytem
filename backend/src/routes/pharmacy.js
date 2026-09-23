const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/pharmacy/medicines - List and search medicines
router.get('/medicines', authenticateToken, async (req, res) => {
  const { search, category, low_stock, expiring_soon } = req.query;
  try {
    let sql = 'SELECT * FROM pharmacy_medicines WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR generic_name LIKE ? OR batch_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (low_stock === 'true') {
      sql += ' AND stock_quantity <= min_stock_level';
    }
    if (expiring_soon === 'true') {
      // Expiring in next 60 days
      sql += " AND date(expiry_date) <= date('now', '+60 days')";
    }

    sql += ' ORDER BY stock_quantity ASC, expiry_date ASC';
    const medicines = await query(sql, params);
    res.json(medicines);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Failed to fetch pharmacy inventory' });
  }
});

// GET /api/pharmacy/alerts - Low stock & near expiry summary
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const lowStock = await query(
      'SELECT * FROM pharmacy_medicines WHERE stock_quantity <= min_stock_level ORDER BY stock_quantity ASC'
    );
    const expiringSoon = await query(
      "SELECT * FROM pharmacy_medicines WHERE date(expiry_date) <= date('now', '+60 days') ORDER BY expiry_date ASC"
    );

    res.json({
      low_stock_count: lowStock.length,
      expiring_soon_count: expiringSoon.length,
      low_stock: lowStock,
      expiring_soon: expiringSoon
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pharmacy alerts' });
  }
});

// POST /api/pharmacy/medicines - Add new medicine batch
router.post('/medicines', authenticateToken, requireRoles('admin', 'pharmacist'), async (req, res) => {
  const { name, generic_name, category, batch_number, stock_quantity, min_stock_level, unit_price, expiry_date, supplier } = req.body;
  if (!name || !batch_number || !unit_price || !expiry_date) {
    return res.status(400).json({ error: 'Medicine name, batch number, unit price, and expiry date are required.' });
  }

  try {
    const countRow = await get('SELECT COUNT(*) as count FROM pharmacy_medicines');
    const medicineCode = `MED-${String(countRow.count + 1).padStart(3, '0')}`;

    const result = await run(
      `INSERT INTO pharmacy_medicines (medicine_code, name, generic_name, category, batch_number, stock_quantity, min_stock_level, unit_price, expiry_date, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineCode,
        name,
        generic_name || name,
        category || 'General',
        batch_number,
        parseInt(stock_quantity) || 0,
        parseInt(min_stock_level) || 15,
        parseFloat(unit_price),
        expiry_date,
        supplier || 'Local Supplier'
      ]
    );

    const created = await get('SELECT * FROM pharmacy_medicines WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error adding medicine:', err);
    res.status(500).json({ error: 'Failed to add medicine to inventory' });
  }
});

// PUT /api/pharmacy/medicines/:id - Update stock or details
router.put('/medicines/:id', authenticateToken, requireRoles('admin', 'pharmacist'), async (req, res) => {
  const { stock_quantity, min_stock_level, unit_price, expiry_date, supplier } = req.body;
  try {
    const existing = await get('SELECT * FROM pharmacy_medicines WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    await run(
      `UPDATE pharmacy_medicines
       SET stock_quantity = ?, min_stock_level = ?, unit_price = ?, expiry_date = ?, supplier = ?
       WHERE id = ?`,
      [
        stock_quantity !== undefined ? parseInt(stock_quantity) : existing.stock_quantity,
        min_stock_level !== undefined ? parseInt(min_stock_level) : existing.min_stock_level,
        unit_price !== undefined ? parseFloat(unit_price) : existing.unit_price,
        expiry_date || existing.expiry_date,
        supplier !== undefined ? supplier : existing.supplier,
        req.params.id
      ]
    );

    const updated = await get('SELECT * FROM pharmacy_medicines WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update medicine inventory' });
  }
});

// DELETE /api/pharmacy/medicines/:id - Delete medicine
router.delete('/medicines/:id', authenticateToken, requireRoles('admin', 'pharmacist'), async (req, res) => {
  try {
    await run('DELETE FROM pharmacy_medicines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Medicine removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
});

module.exports = router;
