const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/billing/invoices - List invoices with patient info
router.get('/invoices', authenticateToken, async (req, res) => {
  const { payment_status, patient_id } = req.query;
  try {
    let sql = `
      SELECT i.*, p.full_name as patient_name, p.patient_code, p.phone as patient_phone,
             u.full_name as created_by_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (payment_status) {
      sql += ' AND i.payment_status = ?';
      params.push(payment_status);
    }
    if (patient_id) {
      sql += ' AND i.patient_id = ?';
      params.push(patient_id);
    }
    sql += ' ORDER BY i.id DESC';

    const invoices = await query(sql, params);
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to fetch billing invoices' });
  }
});

// GET /api/billing/invoices/:id - Detailed invoice for preview & printing
router.get('/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await get(
      `SELECT i.*, p.full_name as patient_name, p.patient_code, p.phone as patient_phone, p.address as patient_address,
              u.full_name as cashier_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = await query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
    res.json({
      ...invoice,
      items
    });
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// POST /api/billing/invoices - Generate new itemized invoice
router.post('/invoices', authenticateToken, requireRoles('admin', 'accountant', 'receptionist'), async (req, res) => {
  const {
    patient_id,
    appointment_id,
    consultation_charges,
    laboratory_charges,
    pharmacy_charges,
    admission_charges,
    tax,
    discount,
    payment_status,
    payment_method,
    paid_amount,
    notes,
    items
  } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const countRow = await get('SELECT COUNT(*) as count FROM invoices');
    const invNumber = `INV-2026-${String(countRow.count + 1).padStart(4, '0')}`;

    const consult = parseFloat(consultation_charges) || 0;
    const lab = parseFloat(laboratory_charges) || 0;
    const pharm = parseFloat(pharmacy_charges) || 0;
    const admit = parseFloat(admission_charges) || 0;
    const tx = parseFloat(tax) || 0;
    const disc = parseFloat(discount) || 0;

    let subtotal = consult + lab + pharm + admit;

    // If custom line items provided and sum > subtotal
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsSum = items.reduce((acc, it) => acc + (parseFloat(it.total) || (parseFloat(it.unit_price) * parseInt(it.quantity || 1))), 0);
      if (itemsSum > 0 && subtotal === 0) {
        subtotal = itemsSum;
      }
    }

    const totalAmount = Math.max(0, subtotal + tx - disc);
    const paid = paid_amount !== undefined ? parseFloat(paid_amount) : (payment_status === 'Paid' ? totalAmount : 0);
    const status = paid >= totalAmount ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    const result = await run(
      `INSERT INTO invoices (invoice_number, patient_id, appointment_id, consultation_charges, laboratory_charges, pharmacy_charges, admission_charges, tax, discount, total_amount, paid_amount, payment_status, payment_method, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invNumber,
        patient_id,
        appointment_id || null,
        consult,
        lab,
        pharm,
        admit,
        tx,
        disc,
        totalAmount,
        paid,
        status,
        payment_method || 'Cash',
        req.user.id,
        notes || ''
      ]
    );

    const invoiceId = result.lastID;

    // Save line items
    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const qty = parseInt(it.quantity) || 1;
        const price = parseFloat(it.unit_price) || 0;
        const lineTotal = it.total ? parseFloat(it.total) : qty * price;
        await run(
          `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [invoiceId, it.item_type || 'General', it.description, qty, price, lineTotal]
        );
      }
    } else {
      // Auto create summary line items
      if (consult > 0) {
        await run(`INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total) VALUES (?, 'Consultation', 'Doctor Consultation Fee', 1, ?, ?)`, [invoiceId, consult, consult]);
      }
      if (lab > 0) {
        await run(`INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total) VALUES (?, 'Lab Test', 'Laboratory Diagnostics Charges', 1, ?, ?)`, [invoiceId, lab, lab]);
      }
      if (pharm > 0) {
        await run(`INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total) VALUES (?, 'Medicine', 'Pharmacy Medications', 1, ?, ?)`, [invoiceId, pharm, pharm]);
      }
      if (admit > 0) {
        await run(`INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, total) VALUES (?, 'Admission', 'Room & Inpatient Care', 1, ?, ?)`, [invoiceId, admit, admit]);
      }
    }

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'CREATE_INVOICE', 'Billing System', `Generated invoice ${invNumber} for LKR ${totalAmount}`]
    );

    const created = await get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// PUT /api/billing/invoices/:id/payment - Record payment
router.put('/invoices/:id/payment', authenticateToken, requireRoles('admin', 'accountant', 'receptionist'), async (req, res) => {
  const { paid_amount, payment_method } = req.body;
  try {
    const inv = await get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const newPaid = parseFloat(paid_amount) || inv.total_amount;
    const status = newPaid >= inv.total_amount ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');

    await run(
      `UPDATE invoices
       SET paid_amount = ?, payment_status = ?, payment_method = ?
       WHERE id = ?`,
      [newPaid, status, payment_method || inv.payment_method, req.params.id]
    );

    res.json({ message: 'Payment recorded successfully', status, paid_amount: newPaid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;
