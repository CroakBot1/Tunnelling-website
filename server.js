// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve your HTML/JS files

// =====================================
// 🔁 KEEP ALIVE / PING ENDPOINT
// =====================================
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is alive 🚀",
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

// =====================================
// In-memory storage (demo only)
// =====================================
const users = {};    // { username: hashedPassword }
const messages = []; // chat messages

// =====================================
// LOGIN / VERIFY USER
// =====================================
app.post("/verify", async (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) {
    return res.json({ success: false, msg: "Missing username or password" });
  }

  if (users[user]) {
    const match = await bcrypt.compare(pass, users[user]);
    if (match) return res.json({ success: true });
    else return res.json({ success: false, msg: "Incorrect password" });
  } else {
    const hashed = await bcrypt.hash(pass, 10);
    users[user] = hashed;
    return res.json({ success: true });
  }
});

// =====================================
// SOCKET.IO CHAT
// =====================================
io.on("connection", socket => {
  console.log("🟢 User connected:", socket.id);

  // Send previous messages
  socket.emit("loadMessages", messages);

  socket.on("chatMessage", msg => {
    messages.push(msg);
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// =====================================
// Keep-alive ping (optional, ping your own server every 5 minutes)
// =====================================
const SELF_URL = "https://tunnelling-website.onrender.com/ping"; // Update sa imong deployed URL

cron.schedule("*/5 * * * *", async () => {
  try {
    const res = await axios.get(SELF_URL, { timeout: 10000 });
    console.log(`🔄 Self ping success (${res.status}) at ${new Date().toISOString()}`);
  } catch (err) {
    console.log(`⚠️ Self ping failed: ${err.message} at ${new Date().toISOString()}`);
  }
});

// =====================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
