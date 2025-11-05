const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all routes
app.use(cors());

// Serve static files (HTML, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Dynamic proxy for all /api/v3/* requests
app.use(
  "/api/v3",
  createProxyMiddleware({
    target: "https://api.binance.com",
    changeOrigin: true,
    pathRewrite: {
      "^/api/v3": "/api/v3" // keep the same path
    },
    logLevel: "debug"
  })
);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
