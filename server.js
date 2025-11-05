const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all routes
app.use(cors());

// ✅ Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Dynamic proxy for all /api/v3/* requests with clean logging
app.use(
  "/api/v3",
  createProxyMiddleware({
    target: "https://api.binance.com",
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: {
      "^/api/v3": "/api/v3" // keep the same path
    },
    onProxyReq(proxyReq, req, res) {
      console.log(`🔄 Proxying request: ${req.originalUrl}`);
    },
    onError(err, req, res) {
      console.error(`❌ Proxy error: ${err.message}`);
      res.status(500).send("Proxy error");
    }
  })
);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
