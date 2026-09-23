const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/doctors - List all doctors with user and department info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const doctors = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, dep.name as department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       ORDER BY d.id ASC`
    );
    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Failed to fetch doctors list' });
  }
});

// GET /api/doctors/departments - List all departments
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await query('SELECT * FROM departments ORDER BY name ASC');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/doctors - Add a new doctor
router.post('/', authenticateToken, requireRoles('admin'), async (req, res) => {
  const { user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number } = req.body;

  if (!user_id || !specialization) {
    return res.status(400).json({ error: 'User ID and specialization are required' });
  }

  try {
    const result = await run(
      `INSERT INTO doctors (user_id, department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        department_id || null,
        specialization,
        qualification || '',
        consultation_fee || 1500.0,
        available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday',
        start_time || '09:00 AM',
        end_time || '05:00 PM',
        room_number || 'Room 101'
      ]
    );

    const created = await get('SELECT * FROM doctors WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating doctor:', err);
    res.status(500).json({ error: 'Failed to add doctor record' });
  }
});

// PUT /api/doctors/:id - Update doctor profile and schedules
router.put('/:id', authenticateToken, requireRoles('admin', 'doctor'), async (req, res) => {
  const { department_id, specialization, qualification, consultation_fee, available_days, start_time, end_time, room_number } = req.body;
  try {
    const existing = await get('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // If role is doctor, make sure they only edit their own profile unless admin
    if (req.user.role === 'doctor' && req.user.doctor_id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'You may only edit your own doctor profile.' });
    }

    await run(
      `UPDATE doctors
       SET department_id = ?, specialization = ?, qualification = ?, consultation_fee = ?, available_days = ?, start_time = ?, end_time = ?, room_number = ?
       WHERE id = ?`,
      [
        department_id !== undefined ? department_id : existing.department_id,
        specialization || existing.specialization,
        qualification !== undefined ? qualification : existing.qualification,
        consultation_fee !== undefined ? consultation_fee : existing.consultation_fee,
        available_days || existing.available_days,
        start_time || existing.start_time,
        end_time || existing.end_time,
        room_number || existing.room_number,
        req.params.id
      ]
    );

    const updated = await get(
      `SELECT d.*, u.full_name, u.email, u.phone, dep.name as department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating doctor:', err);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

module.exports = router;
