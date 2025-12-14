const express = require("express");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Server } = require("socket.io");


const app = express();
const server = http.createServer(app);


const io = new Server(server, {
cors: {
origin: "https://tunnelling-website.onrender.com",
methods: ["GET", "POST"],
credentials: true
}
});


app.use(cors({
origin: "https://tunnelling-website.onrender.com",
credentials: true
}));
app.use(express.json());
app.use(express.static("public"));


// ===== USERS DB =====
const users = {
familylove: {
hash: bcrypt.hashSync("balaba", 10),
isAdmin: true
}
};


let rooms = ["general"];
let online = {};


// ===== REGISTER =====
app.post("/register", async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.status(400).json({ error: "Missing fields" });
if (users[username]) return res.status(409).json({ error: "User exists" });
users[username] = { hash: await bcrypt.hash(password, 10), isAdmin: false };
res.json({ success: true });
});


// ===== LOGIN =====
app.post("/login", async (req, res) => {
const { username, password } = req.body;
const user = users[username];
if (!user) return res.status(401).json({ error: "Invalid" });
const ok = await bcrypt.compare(password, user.hash);
if (!ok) return res.status(401).json({ error: "Invalid" });
res.json({ success: true, username, isAdmin: user.isAdmin, rooms });
});


// ===== SOCKET =====
io.on("connection", socket => {
socket.on("join", ({ room, user }) => {
online[socket.id] = user;
});
