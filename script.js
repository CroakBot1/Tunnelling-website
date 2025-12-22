const socket = io();
const chat = document.getElementById("chat");

socket.on("loadMessages", (messages) => {
  messages.forEach(addMessage);
});

socket.on("chatMessage", addMessage);

function sendMessage() {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;

  if (!username || !message) return;

  socket.emit("chatMessage", {
    user: username,
    text: message
  });

  document.getElementById("message").value = "";
}

function addMessage(msg) {
  const li = document.createElement("li");
  li.textContent = `${msg.user}: ${msg.text}`;
  chat.appendChild(li);
}
