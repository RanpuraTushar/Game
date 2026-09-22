import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gamesRoutes from './routes/gamesRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import { handleSocketConnections } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// Root Welcome / Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Royal Nexus Backend API & Socket Station',
    version: '1.0.0',
    frontend: 'https://royal-nexus-delta.vercel.app',
    health: '/api/health'
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Arcade Nexus Server is running',
    gamesCount: 10,
    timestamp: new Date()
  });
});

// Socket.IO Connection Handling
handleSocketConnections(io);

const PORT = process.env.PORT || 3001;

// Initialize Database connection then start server
db.initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] Arcade Nexus backend running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('[Server Error]', err);
  server.listen(PORT, () => {
    console.log(`[Server] Arcade Nexus backend running in In-Memory Mode on port ${PORT}`);
  });
});
