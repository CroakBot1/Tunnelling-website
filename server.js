// ================================
// Balaba Family Chat - Server
// ================================

const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
const server = http.createServer(app);

// ================================
// SOCKET.IO CONFIG
// ================================
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ================================
// MIDDLEWARES
// ================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================================
// STATIC FILES (PWA REQUIRED)
// ================================
app.use(express.static(path.join(__dirname, "public")));

// ================================
// HEALTH / PING (RENDER SAFE)
// ================================
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ================================
// IN-MEMORY STORAGE
// ================================
const users = {};          // { username: hashedPassword }
const messages = [];       // chat messages
const onlineUsers = {};    // { socketId: username }

// ================================
// LOGIN / REGISTER VERIFY
// ================================
app.post("/verify", async (req, res) => {
  try {
    const { user, pass } = req.body;
    if (!user || !pass) {
      return res.json({ success: false, msg: "Missing credentials" });
    }

    // existing user
    if (users[user]) {
      const match = await bcrypt.compare(pass, users[user]);
      if (!match) {
        return res.json({ success: false, msg: "Wrong password" });
      }
      return res.json({ success: true });
    }

    // new user
    const hash = await bcrypt.hash(pass, 10);
    users[user] = hash;
    return res.json({ success: true });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.json({ success: false, msg: "Server error" });
  }
});

// ================================
// SOCKET.IO CHAT
// ================================
io.on("connection", socket => {
  console.log("🟢 Connected:", socket.id);

  // send previous messages
  socket.emit("loadMessages", messages);

  // send online users
  socket.emit("onlineUsers", Object.values(onlineUsers));

  // login
  socket.on("login", username => {
    if (!username) return;
    onlineUsers[socket.id] = username;
    io.emit("onlineUsers", Object.values(onlineUsers));
  });

  // receive message
  socket.on("chatMessage", msg => {
    if (!msg || !msg.text) return;

    messages.push(msg);

    // limit memory (prevent crash)
    if (messages.length > 300) {
      messages.shift();
    }

    io.emit("chatMessage", msg);
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
    delete onlineUsers[socket.id];
    io.emit("onlineUsers", Object.values(onlineUsers));
  });
});

// ================================
// FALLBACK (PWA ROUTING FIX)
// ================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================================
// KEEP ALIVE (OPTIONAL – RENDER)
// ================================
const SELF_URL = process.env.SELF_URL || "https://tunnelling-website.onrender.com/ping";

cron.schedule("*/5 * * * *", async () => {
  try {
    await axios.get(SELF_URL);
    console.log("🔄 Self ping OK:", new Date().toISOString());
  } catch (err) {
    console.log("⚠️ Ping failed:", err.message);
  }
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
