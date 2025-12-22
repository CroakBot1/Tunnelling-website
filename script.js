const socket = io();
const chat = document.getElementById("chat");

socket.on("chatMessage", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg.user + ": " + msg.text;
  chat.appendChild(li);
});

function sendMessage() {
  const user = document.getElementById("username").value;
  const text = document.getElementById("message").value;

  socket.emit("chatMessage", { user, text });
}

window.sendMessage = sendMessage;
