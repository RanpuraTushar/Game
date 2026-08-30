// server/src/routes/achievementRoutes.js
import express from 'express';
import { ACHIEVEMENTS_DATA } from '../../../shared/gameMetadata.js';
import { memDB } from '../config/db.js';

const router = express.Router();

// Get all achievements
router.get('/', (req, res) => {
  res.json({ success: true, achievements: ACHIEVEMENTS_DATA });
});

// Get user unlocked achievements
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const unlockedSet = memDB.user_achievements[userId] || new Set();
  const unlocked = ACHIEVEMENTS_DATA.filter(a => unlockedSet.has(a.key));
  res.json({ success: true, unlocked, total: ACHIEVEMENTS_DATA.length });
});

export default router;
