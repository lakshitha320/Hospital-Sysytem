const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, query } = require('../db/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'User account is inactive. Please contact administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // If user is a doctor, get doctor profile id
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await get('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        doctor_id: doctorProfile ? doctorProfile.id : null
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', 'Authentication', `User logged in from ${req.ip || 'local'}`]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        doctor_id: doctorProfile ? doctorProfile.id : null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, username, full_name, role, email, phone, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await get('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
    }

    res.json({
      ...user,
      doctor_id: doctorProfile ? doctorProfile.id : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/auth/demo-users (For quick testing/demo purposes)
router.get('/demo-users', async (req, res) => {
  try {
    const users = await query('SELECT username, role, full_name FROM users ORDER BY id ASC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

module.exports = router;
