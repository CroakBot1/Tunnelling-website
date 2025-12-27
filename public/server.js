const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Example API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', service: 'FPS Auto-Lock PWA', time: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
