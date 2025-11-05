import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// List of fallback bases
const BASES = [
  "https://api.binance.com",
  "https://croak-express-gateway-henna.vercel.app",
  "https://croak-bot-proxy-three.vercel.app",
  "https://croak-pwa.vercel.app"
];

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // max 60 requests per IP
  message: { error: "Too many requests, slow down." }
});

app.use("/api", apiLimiter);
app.use("/prices", apiLimiter);

// Helper: parse JSON safely
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Invalid JSON:", text.slice(0, 200));
    throw new Error("Invalid JSON response");
  }
}

// Fetch with timeout
async function timedFetch(url, ms = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

let currentBase = null;

// Resilient parallel detection of working base
async function detectBase() {
  console.log("🔍 Detecting working base...");

  const tests = await Promise.all(BASES.map(async (base) => {
    try {
      console.log("Testing base:", base);
      const res = await timedFetch(`${base}/api/v3/ticker/price`, 20000);
      if (!res.ok) {
        console.warn(`⚠️ Base ${base} returned status ${res.status}`);
        return null;
      }
      const data = await safeJson(res);
      if (!Array.isArray(data)) {
        console.warn(`⚠️ Base ${base} returned invalid JSON format`);
        return null;
      }
      console.log(`✅ Base working: ${base}`);
      return base;
    } catch (err) {
      console.warn(`❌ Base ${base} failed:`, err.message);
      return null;
    }
  }));

  const workingBase = tests.find(Boolean);

  if (!workingBase) {
    console.error("❌ No working base found. All attempts failed.");
    throw new Error("No working proxy base");
  }

  console.log("✅ Using base:", workingBase);
  return workingBase;
}

// Get current base, detect if not set
async function getBase() {
  if (!currentBase) currentBase = await detectBase();
  return currentBase;
}

// Proxy request with fallback rotation
async function proxyRequest(path, ms = 20000) {
  let base = await getBase();
  let url = base + path;

  try {
    const res = await timedFetch(url, ms);
    return await safeJson(res);
  } catch (err) {
    console.warn("⚠️ Base failed, rotating...", base, err.message);
    currentBase = null;
    base = await getBase();
    url = base + path;
    const res = await timedFetch(url, ms);
    return await safeJson(res);
  }
}

// Proxy all /api/v3/* requests
app.use("/api/v3/*", async (req, res) => {
  try {
    const data = await proxyRequest(req.originalUrl);
    res.json(data);
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /prices endpoint
app.get("/prices", async (req, res) => {
  try {
    const data = await proxyRequest("/api/v3/ticker/price");
    res.json(data);
  } catch (err) {
    console.error("❌ /prices error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "API Proxy Server Running",
    keepalive: "/keep-alive",
    endpoints: ["/prices", "/api/v3/..."],
    limits: "60 requests/minute per IP"
  });
});

// Keep-alive ping
app.get("/keep-alive", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`;
setInterval(async () => {
  try {
    const res = await fetch(`${SELF_URL}/keep-alive`);
    console.log("🔄 Self-ping:", res.status);
  } catch (err) {
    console.error("❌ Self-ping failed:", err.message);
  }
}, 240000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
