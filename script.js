const socket = io();
const chat = document.getElementById("chat");

// load old messages
socket.on("loadMessages", (messages) => {
  messages.forEach(addMessage);
});

// receive new message
socket.on("chatMessage", (msg) => {
  addMessage(msg);
});

function sendMessage() {
  const user = document.getElementById("username").value;
  const text = document.getElementById("message").value;

  if (!user || !text) return;

  socket.emit("chatMessage", { user, text });
  document.getElementById("message").value = "";
}

function addMessage(msg) {
  const li = document.createElement("li");
  li.textContent = msg.user + ": " + msg.text;
  chat.appendChild(li);
}

