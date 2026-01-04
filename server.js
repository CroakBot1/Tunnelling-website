const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

let messages = [];

// Load saved messages
if (fs.existsSync("messages.json")) {
  messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
}

io.on("connection", (socket) => {
  console.log("User connected");

  // send old messages
  socket.emit("loadMessages", messages);

  // receive new messages
  socket.on("chatMessage", (msg) => {
    console.log("Received:", msg);
    messages.push(msg);
    fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
