const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/patients - List & Search patients
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let sql = 'SELECT * FROM patients';
    let params = [];

    if (search) {
      sql += ' WHERE patient_code LIKE ? OR full_name LIKE ? OR phone LIKE ? OR email LIKE ?';
      const term = `%${search}%`;
      params = [term, term, term, term];
    }
    sql += ' ORDER BY id DESC';

    const patients = await query(sql, params);
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Patient details with full history
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Associated appointments
    const appointments = await query(
      `SELECT a.*, d.specialization, u.full_name as doctor_name, dep.name as department_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON a.department_id = dep.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient.id]
    );

    // Associated medical records
    const medicalRecords = await query(
      `SELECT mr.*, u.full_name as doctor_name
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [patient.id]
    );

    // Associated lab requests
    const labRequests = await query(
      `SELECT lr.*, lt.test_name, lt.category, lt.cost, u.full_name as doctor_name
       FROM lab_requests lr
       JOIN lab_tests lt ON lr.test_id = lt.id
       LEFT JOIN doctors d ON lr.doctor_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE lr.patient_id = ?
       ORDER BY lr.created_at DESC`,
      [patient.id]
    );

    // Associated invoices
    const invoices = await query(
      `SELECT * FROM invoices WHERE patient_id = ? ORDER BY created_at DESC`,
      [patient.id]
    );

    res.json({
      ...patient,
      appointments,
      medical_records: medicalRecords,
      lab_requests: labRequests,
      invoices
    });
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
});

// POST /api/patients - Register new patient
router.post('/', authenticateToken, requireRoles('admin', 'receptionist', 'nurse', 'doctor'), async (req, res) => {
  const { full_name, dob, gender, blood_group, phone, email, address, emergency_contact, allergies } = req.body;

  if (!full_name || !dob || !phone) {
    return res.status(400).json({ error: 'Full name, date of birth, and phone number are required.' });
  }

  try {
    // Generate next patient code: PAT-100X
    const lastPatient = await get('SELECT id FROM patients ORDER BY id DESC LIMIT 1');
    const nextNum = (lastPatient ? lastPatient.id : 0) + 1001;
    const patientCode = `PAT-${nextNum}`;

    const result = await run(
      `INSERT INTO patients (patient_code, full_name, dob, gender, blood_group, phone, email, address, emergency_contact, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientCode, full_name, dob, gender || 'Other', blood_group || 'Unknown', phone, email || '', address || '', emergency_contact || '', allergies || 'None']
    );

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'CREATE_PATIENT', 'Patient Management', `Created patient ${patientCode} (${full_name})`]
    );

    const createdPatient = await get('SELECT * FROM patients WHERE id = ?', [result.lastID]);
    res.status(201).json(createdPatient);
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient record' });
  }
});

// PUT /api/patients/:id - Update patient information
router.put('/:id', authenticateToken, requireRoles('admin', 'receptionist', 'nurse', 'doctor'), async (req, res) => {
  const { full_name, dob, gender, blood_group, phone, email, address, emergency_contact, allergies } = req.body;
  try {
    const existing = await get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await run(
      `UPDATE patients
       SET full_name = ?, dob = ?, gender = ?, blood_group = ?, phone = ?, email = ?, address = ?, emergency_contact = ?, allergies = ?
       WHERE id = ?`,
      [
        full_name || existing.full_name,
        dob || existing.dob,
        gender || existing.gender,
        blood_group || existing.blood_group,
        phone || existing.phone,
        email !== undefined ? email : existing.email,
        address !== undefined ? address : existing.address,
        emergency_contact !== undefined ? emergency_contact : existing.emergency_contact,
        allergies !== undefined ? allergies : existing.allergies,
        req.params.id
      ]
    );

    const updated = await get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

module.exports = router;
