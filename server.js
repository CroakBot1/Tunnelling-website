import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_PING_URL = "https://tunnelling-website.onrender.com"; // imong external URL
const PING_INTERVAL_MINUTES = 25; // ping every 25 minutes

app.use(cors());
app.use(express.json());

// Proxy route for Binance API
app.all("/api/*", async (req, res) => {
  try {
    const binanceUrl = `https://api.binance.com/${req.params[0]}`;

    const options = {
      method: req.method,
      headers: { ...req.headers },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body)
    };
    delete options.headers.host;

    const response = await fetch(binanceUrl, options);
    const data = await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Binance proxy server running on port ${PORT}`);
});

// ===== Self-Ping Cron =====
async function selfPing() {
  try {
    const res = await fetch(SELF_PING_URL);
    console.log(`🔔 Self-ping successful at ${new Date().toLocaleString()} - Status: ${res.status}`);
  } catch (err) {
    console.error("❌ Self-ping failed:", err);
  }
}

// Ping every 25 minutes to keep server awake
setInterval(selfPing, PING_INTERVAL_MINUTES * 60 * 1000);
