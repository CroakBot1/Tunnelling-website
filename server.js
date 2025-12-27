const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();

app.use(compression());

// Secure CORS
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET'],
}));

// Serve PWA
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  immutable: true
}));

// Health API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'FPS Auto-Lock PWA',
    time: new Date().toISOString()
  });
});

// SPA fallback (important!)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PWA server running on port ${PORT}`);
});
