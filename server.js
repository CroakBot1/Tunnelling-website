const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ SAFE compression (no crash if missing)
let compression;
try {
  compression = require('compression');
  app.use(compression());
  console.log('✅ compression enabled');
} catch (e) {
  console.log('⚠️ compression not installed, skipping');
}

// ✅ CORS (allow PWA + Render + local)
app.use(cors({
  origin: '*',
  methods: ['GET'],
}));

// ✅ Serve PWA files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  immutable: true
}));

// ✅ Health API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'FPS Auto-Lock PWA',
    time: new Date().toISOString()
  });
});

// ✅ SPA fallback (important for PWA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PWA server running on port ${PORT}`);
});
