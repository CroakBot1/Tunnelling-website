import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_API_KEY = process.env.PROXY_API_KEY || "changeme"; // set in Render env

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Proxy endpoint
app.post("/proxy", async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;

    // Security: check API key
    if (req.headers["x-proxy-key"] !== PROXY_API_KEY) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    // Forward request
    const response = await fetch(url, {
      method: method || "GET",
      headers: headers || {},
      body: body || undefined,
    });

    const text = await response.text();

    // Try JSON parse if possible
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

// Serve addon.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/addon.js", (req, res) => {
  res.send(`(function () {
    const PROXY_ENDPOINT = window.location.origin + "/proxy";
    const PUBLIC_KEY = "changeme"; // must match PROXY_API_KEY

    async function tunnelFetch(url, opts = {}) {
      const payload = {
        url,
        method: opts.method || "GET",
        headers: opts.headers || {},
        body: opts.body ?? null,
      };

      const res = await fetch(PROXY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-proxy-key": PUBLIC_KEY,
        },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      const text = await res.text();
      try { return JSON.parse(text); } catch { return text; }
    }

    window.myTunnel = {
      fetch: tunnelFetch,
      fetchJson: async function (url, opts = {}) {
        const r = await tunnelFetch(url, opts);
        if (typeof r === "string") {
          try { return JSON.parse(r); } catch { throw new Error("Response not JSON"); }
        }
        return r;
      }
    };

    console.log("✅ myTunnel loaded from", PROXY_ENDPOINT);
  })();`);
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Tunnelling server running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

