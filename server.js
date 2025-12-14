const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));


// ===== In-memory DB (demo only) =====
let users = {}; // username -> { passwordHash, isAdmin }
let sockets = {}; // socket.id -> username
let rooms = ['general'];


// ===== File Upload =====
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
res.json({ file: `/uploads/${req.file.filename}` });
});


// ===== Auth =====
app.post('/register', async (req, res) => {
const { username, password } = req.body;
if (users[username]) return res.status(400).send('User exists');
users[username] = {
passwordHash: await bcrypt.hash(password, 10),
isAdmin: Object.keys(users).length === 0
};
res.send('Registered');
});


app.post('/login', async (req, res) => {
const { username, password } = req.body;
const user = users[username];
if (!user) return res.status(401).send('Invalid');
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).send('Invalid');
res.json({ username, isAdmin: user.isAdmin, rooms });
});


// ===== Socket.IO =====
io.on('connection', socket => {
socket.on('join', ({ username, room }) => {
sockets[socket.id] = username;
socket.join(room);
io.emit('online', Object.values(sockets));
});


socket.on('message', msg => {
const user = sockets[socket.id];
io.emit('message', { user, text: msg, time: new Date().toLocaleTimeString() });
});


socket.on('createRoom', room => {
if (!rooms.includes(room)) rooms.push(room);
io.emit('rooms', rooms);
});


socket.on('deleteRoom', room => {
rooms = rooms.filter(r => r !== room);
io.emit('rooms', rooms);
});


socket.on('disconnect', () => {
server.listen(3000, () => console.log('Advanced Chat running'));
