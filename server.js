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

// In-memory user storage (replace with DB in production)
const users = {}; // { username: hashedPassword }
const messages = []; // chat messages

// Register or verify user
app.post("/verify", async (req, res) => {
  const { user, pass } = req.body;
  if(!user || !pass) return res.json({ success:false, msg:"Missing username or password" });

  if(users[user]) {
    // verify existing user
    const match = await bcrypt.compare(pass, users[user]);
    if(match) return res.json({ success:true });
    else return res.json({ success:false, msg:"Incorrect password" });
  } else {
    // create new user
    const hashed = await bcrypt.hash(pass, 10);
    users[user] = hashed;
    return res.json({ success:true });
  }
});

// Socket.IO for chat
io.on("connection", socket => {
  // Send previous messages
  socket.emit("loadMessages", messages);

  socket.on("chatMessage", (msg) => {
    messages.push(msg); // store
    io.emit("chatMessage", msg); // broadcast
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
