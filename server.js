import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get("/paclagw.json", (req, res) => {
  res.sendFile(path.join(__dirname, "paclagw.json"));
});

app.get("/v2/public/*", async (req, res) => {
  try {
    const endpoint = req.path.replace("/v2/public", "");
    const query = req.url.includes("?") ? req.url.split("?")[1] : "";
    const apiUrl = `https://api.bybit.com/v2/public${endpoint}${query ? "?" + query : ""}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
