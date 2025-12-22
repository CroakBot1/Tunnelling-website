const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let messages = [];

// load old messages
if (fs.existsSync("messages.json")) {
  messages = JSON.parse(fs.readFileSync("messages.json"));
}

io.on("connection", (socket) => {
  console.log("User connected");

  // send old messages
  socket.emit("loadMessages", messages);

  socket.on("chatMessage", (msg) => {
    messages.push(msg);
    fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
    io.emit("chatMessage", msg);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
