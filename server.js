// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ===== CORS Configuration =====
app.use(cors({
  origin: '*',            // allow all origins (mobile/web PWA)
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));

// ===== Serve PWA Files =====
app.use(express.static(path.join(__dirname, 'public')));

// Example API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'FPS Auto-Lock PWA backend running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
