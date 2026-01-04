const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuid } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

/* ========= IN-MEMORY DATABASE ========= */
const users = [];          // {id, username, password, online, lastSeen}
const conversations = [];  // {id, members[], lastMessage, lastTime}
const messages = [];       // {id, convoId, sender, receiver, text, seen, time}

/* ========= AUTH ========= */
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "missing" });

  if (users.find(u => u.username === username))
    return res.status(409).json({ error: "exists" });

  users.push({
    id: uuid(),
    username,
    password,
    online: false,
    lastSeen: null
  });

  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const u = users.find(
    x => x.username === req.body.username && x.password === req.body.password
  );
  if (!u) return res.status(401).json({ error: "invalid" });

  res.json({ id: u.id, username: u.username });
});

app.get("/users", (req, res) => {
  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    online: u.online
  })));
});

/* ========= SOCKET.IO (FB MESSENGER LOGIC) ========= */
io.on("connection", socket => {

  socket.on("join", userId => {
    socket.userId = userId;
    socket.join(userId);

    const u = users.find(x => x.id === userId);
    if (u) {
      u.online = true;
      io.emit("userOnline", userId);
    }
  });

  socket.on("sendMessage", data => {
    let convo = conversations.find(
      c => c.members.includes(data.from) && c.members.includes(data.to)
    );

    if (!convo) {
      convo = {
        id: uuid(),
        members: [data.from, data.to],
        lastMessage: "",
        lastTime: 0
      };
      conversations.push(convo);
    }

    const msg = {
      id: uuid(),
      convoId: convo.id,
      sender: data.from,
      receiver: data.to,
      text: data.text,
      seen: false,
      time: Date.now()
    };

    messages.push(msg);
    convo.lastMessage = msg.text;
    convo.lastTime = msg.time;

    io.to(data.from).emit("newMessage", msg);
    io.to(data.to).emit("newMessage", msg);
  });

  socket.on("getMessages", convoId => {
    socket.emit(
      "messages",
      messages.filter(m => m.convoId === convoId)
    );
  });

  socket.on("markSeen", convoId => {
    messages.forEach(m => {
      if (
        m.convoId === convoId &&
        m.receiver === socket.userId &&
        !m.seen
      ) {
        m.seen = true;
        io.to(m.sender).emit("messageSeen", convoId);
      }
    });
  });

  socket.on("typing", to => {
    io.to(to).emit("typing", socket.userId);
  });

  socket.on("disconnect", () => {
    const u = users.find(x => x.id === socket.userId);
    if (u) {
      u.online = false;
      u.lastSeen = Date.now();
      io.emit("userOffline", socket.userId);
    }
  });
});

server.listen(process.env.PORT || 10000, () => {
  console.log("FB Messenger clone running");
});
