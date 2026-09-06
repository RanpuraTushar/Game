// server/src/routes/achievementRoutes.js
import express from 'express';
import { ACHIEVEMENTS_DATA } from '../../../shared/gameMetadata.js';
import { memDB } from '../config/db.js';

const router = express.Router();

// Get all achievements
router.get('/', (req, res) => {
  res.json({ success: true, achievements: ACHIEVEMENTS_DATA });
});

// Unlock an achievement directly
router.post('/unlock', (req, res) => {
  const { key, userId = 1 } = req.body;
  if (!memDB.user_achievements[userId]) {
    memDB.user_achievements[userId] = new Set();
  }
  memDB.user_achievements[userId].add(key);
  const achievement = ACHIEVEMENTS_DATA.find(a => a.key === key);
  res.json({ success: true, achievement });
});

// Get user unlocked achievements
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userSet = memDB.user_achievements[userId];
  const userKeys = userSet ? Array.from(userSet) : [];
  const unlocked = ACHIEVEMENTS_DATA.filter(a => userKeys.includes(a.key));
  res.json({ success: true, unlocked, unlockedKeys: userKeys });
});

export default router;
