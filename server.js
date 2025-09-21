import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_API_KEY = process.env.PROXY_API_KEY || "changeme"; // set in Render env

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Proxy endpoint
app.post("/proxy", async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;

    if (req.headers["x-proxy-key"] !== PROXY_API_KEY) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    const response = await fetch(url, {
      method: method || "GET",
      headers: headers || {},
      body: body || undefined,
    });

    const text = await response.text();

    try { res.json(JSON.parse(text)); }
    catch { res.send(text); }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

// Serve failover addon.js
app.get("/addon.js", (req, res) => {
  const addonScript = `(function () {
    const PROXIES = [
      "https://croak-bot-proxy-three.vercel.app/api/proxy",
      "https://croak-express-gateway-henna.vercel.app/api/proxy",
      "https://croak-pwa.vercel.app/api/proxy",
      window.location.origin + "/proxy"
    ];
    const PUBLIC_KEY = "changeme";

    async function tryProxies(payload) {
      let lastError = null;
      for (let i = 0; i < PROXIES.length; i++) {
        const endpoint = PROXIES[i];
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-proxy-key": PUBLIC_KEY },
            body: JSON.stringify(payload),
            mode: "cors"
          });
          if (!res.ok) {
            if (res.status >= 400 && res.status < 500) throw new Error(\`Proxy \${endpoint} rejected: \${res.status}\`);
            lastError = new Error(\`Proxy \${endpoint} server error: \${res.status}\`);
            continue;
          }
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) return await res.json();
          else return await res.text();
        } catch (err) { lastError = err; continue; }
      }
      throw lastError || new Error("All proxies failed");
    }

    window.myTunnel = {
      fetch: async function (url, opts = {}) {
        const payload = { url, method: opts.method || "GET", headers: opts.headers || {}, body: opts.body ?? null };
        return await tryProxies(payload);
      },
      fetchJson: async function (url, opts = {}) {
        const r = await this.fetch(url, opts);
        if (typeof r === "string") {
          try { return JSON.parse(r); } catch { throw new Error("Response not JSON"); }
        }
        return r;
      }
    };
    console.log("✅ myTunnel loaded with failover:", PROXIES);
  })();`;

  res.type("application/javascript").send(addonScript);
});

// Health check
app.get("/", (req, res) => res.send("✅ Tunnelling server running"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
