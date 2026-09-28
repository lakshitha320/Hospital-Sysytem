const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Serve frontend static build in standalone production mode
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏥 Hospital Management System (HMS) Server running on port ${PORT}`);
  console.log(`🔗 Local Access:   http://localhost:${PORT}`);
  console.log(`🔗 API Base:       http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
