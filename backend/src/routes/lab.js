const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/lab/tests - List all available lab tests
router.get('/tests', authenticateToken, async (req, res) => {
  try {
    const tests = await query('SELECT * FROM lab_tests ORDER BY category, test_name ASC');
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab tests catalog' });
  }
});

// POST /api/lab/tests - Add test to catalog
router.post('/tests', authenticateToken, requireRoles('admin', 'lab_staff'), async (req, res) => {
  const { test_code, test_name, category, sample_type, cost, normal_range } = req.body;
  if (!test_code || !test_name || !cost) {
    return res.status(400).json({ error: 'Test code, name, and cost are required' });
  }

  try {
    const result = await run(
      `INSERT INTO lab_tests (test_code, test_name, category, sample_type, cost, normal_range)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [test_code, test_name, category || 'General', sample_type || 'Blood', cost, normal_range || '']
    );
    const created = await get('SELECT * FROM lab_tests WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lab test' });
  }
});

// GET /api/lab/requests - List test requests
router.get('/requests', authenticateToken, async (req, res) => {
  const { status, patient_id } = req.query;
  try {
    let sql = `
      SELECT lr.*, p.full_name as patient_name, p.patient_code, p.gender, p.dob,
             lt.test_name, lt.category, lt.cost, lt.normal_range as default_normal_range,
             u.full_name as doctor_name, tech.full_name as tech_name
      FROM lab_requests lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN lab_tests lt ON lr.test_id = lt.id
      LEFT JOIN doctors d ON lr.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN users tech ON lr.performed_by = tech.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND lr.status = ?';
      params.push(status);
    }
    if (patient_id) {
      sql += ' AND lr.patient_id = ?';
      params.push(patient_id);
    }
    sql += ' ORDER BY lr.id DESC';

    const requests = await query(sql, params);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching lab requests:', err);
    res.status(500).json({ error: 'Failed to fetch lab requests' });
  }
});

// POST /api/lab/requests - Create lab test request
router.post('/requests', authenticateToken, requireRoles('admin', 'doctor', 'nurse', 'receptionist'), async (req, res) => {
  const { patient_id, doctor_id, test_id } = req.body;
  if (!patient_id || !test_id) {
    return res.status(400).json({ error: 'Patient ID and Test ID are required' });
  }

  try {
    const countRow = await get('SELECT COUNT(*) as count FROM lab_requests');
    const reqNumber = `LRQ-2026-${String(countRow.count + 1).padStart(4, '0')}`;

    let finalDocId = doctor_id;
    if (!finalDocId && req.user.role === 'doctor') {
      const doc = await get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (doc) finalDocId = doc.id;
    }

    const result = await run(
      `INSERT INTO lab_requests (request_number, patient_id, doctor_id, test_id, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [reqNumber, patient_id, finalDocId || null, test_id]
    );

    const created = await get('SELECT * FROM lab_requests WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating lab request:', err);
    res.status(500).json({ error: 'Failed to create lab request' });
  }
});

// PUT /api/lab/requests/:id/collect-sample - Mark sample collected
router.put('/requests/:id/collect-sample', authenticateToken, requireRoles('admin', 'lab_staff', 'nurse'), async (req, res) => {
  try {
    const now = new Date().toISOString();
    await run(
      `UPDATE lab_requests
       SET status = 'Sample Collected', sample_collected_at = ?
       WHERE id = ?`,
      [now, req.params.id]
    );
    res.json({ message: 'Sample marked as collected', sample_collected_at: now });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sample collection' });
  }
});

// PUT /api/lab/requests/:id/result - Enter test result & generate report
router.put('/requests/:id/result', authenticateToken, requireRoles('admin', 'lab_staff'), async (req, res) => {
  const { test_result, reference_range, remarks } = req.body;
  if (!test_result) {
    return res.status(400).json({ error: 'Test result is required' });
  }

  try {
    const now = new Date().toISOString();
    await run(
      `UPDATE lab_requests
       SET test_result = ?, reference_range = ?, remarks = ?, status = 'Completed', performed_by = ?, report_date = ?
       WHERE id = ?`,
      [test_result, reference_range || '', remarks || '', req.user.id, now, req.params.id]
    );

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'LAB_RESULT_ENTRY', 'Laboratory Management', `Entered test result for request #${req.params.id}`]
    );

    res.json({ message: 'Lab result entered and report generated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record lab result' });
  }
});

module.exports = router;
