const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" } // for testing
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve html/js

// ================================
// 🔁 KEEP ALIVE / PING ENDPOINT
// ================================
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is alive 🚀",
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

// ================================
// In-memory storage (demo only)
// ================================
const users = {};    // { username: hashedPassword }
const messages = []; // chat messages

// ================================
// LOGIN / VERIFY USER
// ================================
app.post("/verify", async (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.json({
      success: false,
      msg: "Missing username or password"
    });
  }

  if (users[user]) {
    // Verify existing user
    const match = await bcrypt.compare(pass, users[user]);
    if (match) {
      return res.json({ success: true });
    } else {
      return res.json({
        success: false,
        msg: "Incorrect password"
      });
    }
  } else {
    // Create new user
    const hashed = await bcrypt.hash(pass, 10);
    users[user] = hashed;
    return res.json({ success: true });
  }
});

// ================================
// SOCKET.IO CHAT
// ================================
io.on("connection", socket => {
  console.log("🟢 User connected:", socket.id);

  // Send previous messages
  socket.emit("loadMessages", messages);

  socket.on("chatMessage", msg => {
    messages.push(msg);        // store in memory
    io.emit("chatMessage", msg); // broadcast to all
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
