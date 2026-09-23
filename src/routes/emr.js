const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/emr/patient/:patientId - Full EMR for patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const records = await query(
      `SELECT mr.*, u.full_name as doctor_name, d.specialization
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [patientId]
    );

    // Fetch prescriptions for each record
    for (const record of records) {
      const prescriptions = await query(
        `SELECT * FROM prescriptions WHERE record_id = ?`,
        [record.id]
      );
      for (const pres of prescriptions) {
        pres.items = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [pres.id]);
      }
      record.prescriptions = prescriptions;
    }

    res.json(records);
  } catch (err) {
    console.error('Error fetching EMR records:', err);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// POST /api/emr - Create medical record & prescription
router.post('/', authenticateToken, requireRoles('admin', 'doctor'), async (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_id,
    symptoms,
    diagnosis,
    treatment_plan,
    blood_pressure,
    pulse_rate,
    temperature,
    weight,
    notes,
    prescription_items
  } = req.body;

  if (!patient_id || !diagnosis) {
    return res.status(400).json({ error: 'Patient ID and diagnosis are required' });
  }

  try {
    // Determine doctor ID
    let finalDocId = doctor_id;
    if (!finalDocId && req.user.role === 'doctor') {
      const doc = await get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (doc) finalDocId = doc.id;
    }
    if (!finalDocId) {
      const firstDoc = await get('SELECT id FROM doctors LIMIT 1');
      finalDocId = firstDoc ? firstDoc.id : 1;
    }

    // Insert medical record
    const recordResult = await run(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, symptoms, diagnosis, treatment_plan, blood_pressure, pulse_rate, temperature, weight, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, finalDocId, appointment_id || null, symptoms || '', diagnosis, treatment_plan || '', blood_pressure || '', pulse_rate || '', temperature || '', weight || '', notes || '']
    );

    const recordId = recordResult.lastID;

    // If an appointment was linked, mark it completed
    if (appointment_id) {
      await run('UPDATE appointments SET status = ? WHERE id = ?', ['Completed', appointment_id]);
    }

    // If prescriptions were added
    if (prescription_items && Array.isArray(prescription_items) && prescription_items.length > 0) {
      const presResult = await run(
        `INSERT INTO prescriptions (record_id, patient_id, doctor_id, instructions, status)
         VALUES (?, ?, ?, ?, 'Pending')`,
        [recordId, patient_id, finalDocId, notes || 'Take as prescribed']
      );
      const presId = presResult.lastID;

      for (const item of prescription_items) {
        await run(
          `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [presId, item.medicine_name, item.dosage || '1 tab', item.frequency || 'Daily', item.duration || '5 days', item.quantity || 1, item.instructions || '']
        );
      }
    }

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'CREATE_EMR', 'Electronic Medical Records', `Recorded diagnosis for patient #${patient_id}`]
    );

    res.status(201).json({ message: 'Medical record created successfully', record_id: recordId });
  } catch (err) {
    console.error('Error saving EMR record:', err);
    res.status(500).json({ error: 'Failed to save medical record' });
  }
});

// GET /api/emr/prescriptions - List all prescriptions (with filters)
router.get('/prescriptions', authenticateToken, async (req, res) => {
  const { status, patient_id } = req.query;
  try {
    let sql = `
      SELECT pr.*, p.full_name as patient_name, p.patient_code, u.full_name as doctor_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND pr.status = ?';
      params.push(status);
    }
    if (patient_id) {
      sql += ' AND pr.patient_id = ?';
      params.push(patient_id);
    }
    sql += ' ORDER BY pr.id DESC';

    const prescriptions = await query(sql, params);
    for (const pr of prescriptions) {
      pr.items = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [pr.id]);
    }
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// PUT /api/emr/prescriptions/:id/dispense - Mark as dispensed (Pharmacy)
router.put('/prescriptions/:id/dispense', authenticateToken, requireRoles('admin', 'pharmacist'), async (req, res) => {
  try {
    await run('UPDATE prescriptions SET status = ? WHERE id = ?', ['Dispensed', req.params.id]);
    res.json({ message: 'Prescription marked as Dispensed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

module.exports = router;
