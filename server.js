const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (if you have index.html with your <script>)
app.use(express.static(path.join(__dirname, "public")));

// Proxy setup
const API_SERVER = "https://api.binance.com";
const relayEndpoints = [
  "/api/v3/ticker/price",
  "/api/v3/exchangeInfo",
  "/api/v3/depth",
  "/api/v3/klines",
  "/api/v3/ping"
];

relayEndpoints.forEach(endpoint => {
  app.use(
    endpoint,
    createProxyMiddleware({
      target: API_SERVER,
      changeOrigin: true,
      pathRewrite: (path) => path, // keep the same path
      logLevel: "debug"
    })
  );
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
