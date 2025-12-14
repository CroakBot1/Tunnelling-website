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
server.listen(3000, () => console.log('LIVE'));
