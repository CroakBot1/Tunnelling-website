import express from 'express';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config();


const WALLET = process.env.WALLET_ADDRESS;
const POOL = process.env.POOL_URL || 'pool.supportxmr.com:3333';
const POOL_PASS = process.env.POOL_PASS || 'rig01';
const DEFAULT_THREADS = parseInt(process.env.DEFAULT_THREADS || '4', 10);
const API_PORT = parseInt(process.env.API_PORT || '3000', 10);


const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });
app.use(bodyParser.json());


const DATA_DIR = path.resolve('./data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const dbFile = path.join(DATA_DIR, 'devices.db');
const db = new Database(dbFile);


db.prepare(`CREATE TABLE IF NOT EXISTS devices (
id TEXT PRIMARY KEY,
name TEXT,
wallet TEXT,
pool TEXT,
threads INTEGER,
status TEXT,
container_name TEXT,
created_at TEXT
)`).run();


const insertDevice = db.prepare('INSERT INTO devices (id,name,wallet,pool,threads,status,container_name,created_at) VALUES (@id,@name,@wallet,@pool,@threads,@status,@container_name,@created_at)');
const getDevices = db.prepare('SELECT * FROM devices');
const getDeviceById = db.prepare('SELECT * FROM devices WHERE id = ?');
const updateDevice = db.prepare('UPDATE devices SET name=@name,wallet=@wallet,pool=@pool,threads=@threads,status=@status,container_name=@container_name WHERE id=@id');
const deleteDevice = db.prepare('DELETE FROM devices WHERE id = ?');


app.post('/devices', (req, res) => {
const { name, wallet, pool, threads } = req.body;
const id = uuidv4();
const device = {
id,
name: name || `miner-${id.slice(0,6)}`,
wallet: wallet || WALLET,
pool: pool || POOL,
threads: threads || DEFAULT_THREADS,
status: 'stopped',
container_name: null,
created_at: new Date().toISOString()
