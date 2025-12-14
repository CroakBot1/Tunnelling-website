const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const multer = require('multer');


const app = express();
const server = http.createServer(app);


const io = new Server(server, {
cors: {
origin: "https://tunnelling-website.onrender.com",
methods: ["GET", "POST"],
credentials: true
}
});


app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));


// ===== In-memory DB (demo) =====
// PRESET ACCOUNT (AUTO-AVAILABLE SA LIVE SERVER)
const users = {
familylove: {
// password: balaba
hash: require('bcrypt').hashSync('balaba', 10),
isAdmin: true
}
};


const online = {}; // socket.id -> username
let rooms = ['general'];


// ===== Upload =====
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
res.json({ url: `/uploads/${req.file.filename}` });
});


// ===== Auth =====
app.post('/register', async (req, res) => {
const { username, password } = req.body;
if (users[username]) return res.status(400).send('Exists');
users[username] = {
hash: await bcrypt.hash(password, 10),
isAdmin: Object.keys(users).length === 0
};
res.send('OK');
});


app.post('/login', async (req, res) => {
const { username, password } = req.body;
const u = users[username];
if (!u) return res.status(401).send('Invalid');
const ok = await bcrypt.compare(password, u.hash);
if (!ok) return res.status(401).send('Invalid');
res.json({ username, isAdmin: u.isAdmin, rooms });
});


// ===== Socket =====
io.on('connection', socket => {
socket.on('join', ({ username, room }) => {
online[socket.id] = username;
socket.join(room);
io.emit('online', Object.values(online));
});


socket.on('message', data => {
io.to(data.room).emit('message', {
server.listen(3000, () => console.log('LIVE'));
