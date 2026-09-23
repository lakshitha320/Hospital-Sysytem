const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/appointments - List appointments with optional date, doctor, or status filters
router.get('/', authenticateToken, async (req, res) => {
  const { date, doctor_id, status, patient_id } = req.query;
  try {
    let sql = `
      SELECT a.*, p.full_name as patient_name, p.patient_code, p.phone as patient_phone,
             u.full_name as doctor_name, d.specialization, d.room_number, dep.name as department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dep ON a.department_id = dep.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (doctor_id) {
      sql += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (patient_id) {
      sql += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    // If logged in as doctor, optionally restrict or show all
    if (req.user.role === 'doctor' && req.user.doctor_id && !doctor_id && !patient_id) {
      // Allow doctor to see all or prioritize their own
    }

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time ASC';

    const appointments = await query(sql, params);
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments - Book a new appointment
router.post('/', authenticateToken, requireRoles('admin', 'receptionist', 'doctor', 'nurse'), async (req, res) => {
  const { patient_id, doctor_id, department_id, appointment_date, appointment_time, notes } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Patient, doctor, date, and time are required' });
  }

  try {
    // Generate appointment number
    const countRow = await get('SELECT COUNT(*) as count FROM appointments');
    const apptNumber = `APT-2026-${String(countRow.count + 1).padStart(4, '0')}`;

    // Get doctor's department if not provided
    let deptId = department_id;
    if (!deptId) {
      const doc = await get('SELECT department_id FROM doctors WHERE id = ?', [doctor_id]);
      deptId = doc ? doc.department_id : null;
    }

    const result = await run(
      `INSERT INTO appointments (appointment_number, patient_id, doctor_id, department_id, appointment_date, appointment_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'Scheduled', ?)`,
      [apptNumber, patient_id, doctor_id, deptId, appointment_date, appointment_time, notes || '']
    );

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'BOOK_APPOINTMENT', 'Appointment Management', `Booked appointment ${apptNumber} for patient #${patient_id}`]
    );

    const created = await get(
      `SELECT a.*, p.full_name as patient_name, p.patient_code, u.full_name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.id = ?`,
      [result.lastID]
    );
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id/status - Update appointment status (Scheduled, In Progress, Completed, Cancelled)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await run('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// PUT /api/appointments/:id - Reschedule or update appointment
router.put('/:id', authenticateToken, requireRoles('admin', 'receptionist', 'doctor', 'nurse'), async (req, res) => {
  const { appointment_date, appointment_time, doctor_id, notes, status } = req.body;
  try {
    const existing = await get('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await run(
      `UPDATE appointments
       SET appointment_date = ?, appointment_time = ?, doctor_id = ?, notes = ?, status = ?
       WHERE id = ?`,
      [
        appointment_date || existing.appointment_date,
        appointment_time || existing.appointment_time,
        doctor_id || existing.doctor_id,
        notes !== undefined ? notes : existing.notes,
        status || 'Rescheduled',
        req.params.id
      ]
    );

    res.json({ message: 'Appointment updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
