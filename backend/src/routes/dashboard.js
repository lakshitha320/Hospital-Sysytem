const express = require('express');
const router = express.Router();
const { query, get } = require('../db/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/summary - Live stats matching UI specs
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total Patients
    const patientCount = await get('SELECT COUNT(*) as count FROM patients');

    // Today's Appointments
    const todayAppointments = await get(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
      [today]
    );

    // Total Appointments
    const totalAppointments = await get('SELECT COUNT(*) as count FROM appointments');

    // Revenue Summary
    const revenueStats = await get(
      `SELECT
         COALESCE(SUM(total_amount), 0) as total_billed,
         COALESCE(SUM(paid_amount), 0) as total_collected,
         COALESCE(SUM(CASE WHEN payment_status = 'Unpaid' THEN total_amount - paid_amount ELSE 0 END), 0) as pending_dues
       FROM invoices`
    );

    // Laboratory Requests
    const labRequests = await get(
      `SELECT
         COUNT(*) as total_requests,
         COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending,
         COALESCE(SUM(CASE WHEN status = 'Sample Collected' THEN 1 ELSE 0 END), 0) as in_progress,
         COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) as completed
       FROM lab_requests`
    );

    // Pharmacy Alerts
    const pharmacyAlerts = await get(
      `SELECT
         COALESCE(SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END), 0) as low_stock,
         COALESCE(SUM(CASE WHEN date(expiry_date) <= date('now', '+60 days') THEN 1 ELSE 0 END), 0) as expiring_soon
       FROM pharmacy_medicines`
    );

    // Recent Appointments
    const recentAppointments = await query(
      `SELECT a.*, p.full_name as patient_name, p.patient_code, u.full_name as doctor_name, dep.name as department_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON a.department_id = dep.id
       ORDER BY a.id DESC LIMIT 5`
    );

    // Recent Invoices
    const recentInvoices = await query(
      `SELECT i.*, p.full_name as patient_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       ORDER BY i.id DESC LIMIT 5`
    );

    res.json({
      total_patients: patientCount.count,
      todays_appointments: todayAppointments.count,
      total_appointments: totalAppointments.count,
      revenue: revenueStats,
      laboratory: labRequests,
      pharmacy_alerts: pharmacyAlerts,
      recent_appointments: recentAppointments,
      recent_invoices: recentInvoices
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
