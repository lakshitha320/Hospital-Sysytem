require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./db/db');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper to mount routes to both /api/... and /... for seamless proxy/rewrite support
const mountApiRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, require('./routes/auth'));
  app.use(`${prefix}/patients`, require('./routes/patients'));
  app.use(`${prefix}/doctors`, require('./routes/doctors'));
  app.use(`${prefix}/appointments`, require('./routes/appointments'));
  app.use(`${prefix}/emr`, require('./routes/emr'));
  app.use(`${prefix}/lab`, require('./routes/lab'));
  app.use(`${prefix}/pharmacy`, require('./routes/pharmacy'));
  app.use(`${prefix}/billing`, require('./routes/billing'));
  app.use(`${prefix}/staff`, require('./routes/staff'));
  app.use(`${prefix}/dashboard`, require('./routes/dashboard'));
  app.use(`${prefix}/reports`, require('./routes/reports'));

  app.get(`${prefix}/health`, (req, res) => {
    res.json({
      status: 'healthy',
      system: 'Hospital Management System (HMS) API',
      timestamp: new Date().toISOString()
    });
  });
};

// Mount for both standard /api and direct root
mountApiRoutes('/api');
mountApiRoutes('');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'An unexpected internal server error occurred' });
});

module.exports = app;
