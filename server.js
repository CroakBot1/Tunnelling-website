const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Proxy endpoint
app.get('/v2/public/*', async (req, res) => {
  try {
    const apiUrl = `https://api.bybit.com${req.path.replace('/v2/public', '')}${req.url.includes('?') ? req.url.split('?')[1] : ''}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve paclagw.json
app.get('/paclagw.json', (req, res) => {
  res.sendFile(__dirname + '/paclagw.json');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
