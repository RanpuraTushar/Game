// server/src/routes/leaderboardRoutes.js
import express from 'express';
import { memDB } from '../config/db.js';

const router = express.Router();

// Global Leaderboard
router.get('/global', (req, res) => {
  const leaderboard = memDB.global_leaderboard || [];
  res.json({ success: true, leaderboard });
});

// Per Game Leaderboard
router.get('/:gameKey', (req, res) => {
  const { gameKey } = req.params;
  const leaderboard = memDB.leaderboards[gameKey.toUpperCase()] || [];
  res.json({ success: true, gameKey: gameKey.toUpperCase(), leaderboard });
});

export default router;
