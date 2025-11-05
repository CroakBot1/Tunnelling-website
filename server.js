import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Initial base list
let BASES = [
  "https://api.binance.com",
  "https://croak-express-gateway-henna.vercel.app",
  "https://croak-bot-proxy-three.vercel.app",
  "https://croak-pwa.vercel.app"
];

// Limit requests per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down." }
});
app.use("/api", apiLimiter);
app.use("/prices", apiLimiter);

// Helper to safely parse JSON
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Invalid JSON:", text.slice(0, 200));
    throw new Error("Invalid JSON response");
  }
}

// Timeout fetch
async function timedFetch(url, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Keep track of working bases
let workingBases = [...BASES];

// Attempt to fetch from available bases
async function proxyRequest(path, ms = 10000) {
  if (!workingBases.length) {
    console.warn("⚠️ All bases failed, retrying with full list...");
    workingBases = [...BASES]; // Reset
  }

  for (let i = 0; i < workingBases.length; i++) {
    const base = workingBases[i];
    const url = base + path;

    try {
      const res = await timedFetch(url, ms);
      const json = await safeJson(res);

      // Move successful base to front (optional: keep it preferred)
      workingBases.unshift(...workingBases.splice(i, 1));
      return json;
    } catch (err) {
      console.warn(`❌ Base failed: ${base}`, err.message);
      // Remove failed base from working list temporarily
      workingBases.splice(i, 1);
      i--; // Adjust index since we removed an element
      continue;
    }
  }

  throw new Error("No working base could fetch the request.");
}

// Routes
app.use("/api/v3/*", async (req, res) => {
  try {
    const data = await proxyRequest(req.originalUrl);
    res.json(data);
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/prices", async (req, res) => {
  try {
    const data = await proxyRequest("/api/v3/ticker/price");
    res.json(data);
  } catch (err) {
    console.error("❌ /prices error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "API Proxy Server Running",
    endpoints: ["/prices", "/api/v3/..."],
    limits: "60 requests/minute per IP"
  });
});

app.get("/keep-alive", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Self-ping every 4 minutes
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`;
setInterval(async () => {
  try {
    const res = await fetch(`${SELF_URL}/keep-alive`);
    console.log("🔄 Self-ping:", res.status);
  } catch (err) {
    console.error("❌ Self-ping failed:", err.message);
  }
}, 240000);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
