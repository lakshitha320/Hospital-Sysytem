const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/reports/summary - Comprehensive reports aggregation
router.get('/summary', authenticateToken, requireRoles('admin', 'accountant'), async (req, res) => {
  try {
    // 1. Revenue by category
    const revenueByCategory = await query(`
      SELECT
        COALESCE(SUM(consultation_charges), 0) as consultation_total,
        COALESCE(SUM(laboratory_charges), 0) as lab_total,
        COALESCE(SUM(pharmacy_charges), 0) as pharmacy_total,
        COALESCE(SUM(admission_charges), 0) as admission_total,
        COALESCE(SUM(total_amount), 0) as grand_total
      FROM invoices
    `);

    // 2. Appointments by status
    const apptsByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
    `);

    // 3. Appointments by department
    const apptsByDept = await query(`
      SELECT COALESCE(dep.name, 'Unassigned') as department, COUNT(a.id) as count
      FROM appointments a
      LEFT JOIN departments dep ON a.department_id = dep.id
      GROUP BY dep.name
    `);

    // 4. Patient demographics (Gender & Blood Group)
    const patientGender = await query(`
      SELECT gender, COUNT(*) as count FROM patients GROUP BY gender
    `);
    const patientBlood = await query(`
      SELECT blood_group, COUNT(*) as count FROM patients GROUP BY blood_group
    `);

    // 5. Pharmacy Stock Overview
    const pharmacyOverview = await query(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(stock_quantity * unit_price), 0) as inventory_value,
        COALESCE(SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END), 0) as low_stock_items,
        COALESCE(SUM(CASE WHEN date(expiry_date) <= date('now', '+60 days') THEN 1 ELSE 0 END), 0) as near_expiry_items
      FROM pharmacy_medicines
    `);

    // 6. Laboratory performance
    const labStats = await query(`
      SELECT
        lt.category,
        COUNT(lr.id) as total_tests,
        COALESCE(SUM(lt.cost), 0) as total_value
      FROM lab_requests lr
      JOIN lab_tests lt ON lr.test_id = lt.id
      GROUP BY lt.category
    `);

    // 7. Staff Headcount by Role
    const staffByRole = await query(`
      SELECT role, COUNT(*) as count FROM employees GROUP BY role
    `);

    res.json({
      revenue: revenueByCategory[0] || {},
      appointments_by_status: apptsByStatus,
      appointments_by_dept: apptsByDept,
      patient_gender: patientGender,
      patient_blood: patientBlood,
      pharmacy_overview: pharmacyOverview[0] || {},
      lab_stats: labStats,
      staff_by_role: staffByRole
    });
  } catch (err) {
    console.error('Error generating reports:', err);
    res.status(500).json({ error: 'Failed to generate analytical reports' });
  }
});

module.exports = router;
