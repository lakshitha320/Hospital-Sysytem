const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/staff/employees - List employees
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await query(
      `SELECT e.*, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY e.id ASC`
    );
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/staff/employees - Register employee
router.post('/employees', authenticateToken, requireRoles('admin'), async (req, res) => {
  const { full_name, role, department_id, designation, phone, email, join_date, salary } = req.body;
  if (!full_name || !role || !designation) {
    return res.status(400).json({ error: 'Name, role, and designation are required' });
  }

  try {
    const countRow = await get('SELECT COUNT(*) as count FROM employees');
    const empCode = `EMP-${String(countRow.count + 1).padStart(3, '0')}`;

    const result = await run(
      `INSERT INTO employees (employee_code, full_name, role, department_id, designation, phone, email, join_date, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empCode,
        full_name,
        role,
        department_id || null,
        designation,
        phone || '',
        email || '',
        join_date || new Date().toISOString().split('T')[0],
        parseFloat(salary) || 0.0
      ]
    );

    const created = await get('SELECT * FROM employees WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register employee' });
  }
});

// GET /api/staff/attendance - List attendance records
router.get('/attendance', authenticateToken, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const attendance = await query(
      `SELECT a.*, e.full_name as employee_name, e.employee_code, e.role, e.designation, d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.date = ?
       ORDER BY e.full_name ASC`,
      [date]
    );
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/staff/attendance - Mark or update attendance
router.post('/attendance', authenticateToken, requireRoles('admin', 'receptionist'), async (req, res) => {
  const { employee_id, date, check_in_time, check_out_time, status } = req.body;
  if (!employee_id || !date) {
    return res.status(400).json({ error: 'Employee ID and date are required' });
  }

  try {
    const existing = await get('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
    if (existing) {
      await run(
        `UPDATE attendance
         SET check_in_time = ?, check_out_time = ?, status = ?
         WHERE id = ?`,
        [check_in_time || existing.check_in_time, check_out_time || existing.check_out_time, status || existing.status, existing.id]
      );
    } else {
      await run(
        `INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, status)
         VALUES (?, ?, ?, ?, ?)`,
        [employee_id, date, check_in_time || '08:30 AM', check_out_time || '05:00 PM', status || 'Present']
      );
    }
    res.json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// GET /api/staff/leaves - List leaves
router.get('/leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await query(
      `SELECT l.*, e.full_name as employee_name, e.employee_code, e.role, e.designation, u.full_name as approver_name
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       LEFT JOIN users u ON l.approved_by = u.id
       ORDER BY l.id DESC`
    );
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave records' });
  }
});

// POST /api/staff/leaves - Apply for leave
router.post('/leaves', authenticateToken, async (req, res) => {
  const { employee_id, leave_type, start_date, end_date, reason } = req.body;
  if (!employee_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Employee, leave type, start and end dates are required' });
  }

  try {
    const result = await run(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [employee_id, leave_type, start_date, end_date, reason || '']
    );
    res.status(201).json({ message: 'Leave request submitted', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// PUT /api/staff/leaves/:id/status - Approve or reject leave
router.put('/leaves/:id/status', authenticateToken, requireRoles('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  try {
    await run(
      `UPDATE leaves SET status = ?, approved_by = ? WHERE id = ?`,
      [status, req.user.id, req.params.id]
    );
    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

module.exports = router;
