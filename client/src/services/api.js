// client/src/services/api.js
import { recordGameScore } from '../utils/gameActivity';

const API_BASE = '/api';

export const api = {
  // Fetch all games with optional category
  async getGames(category = 'ALL') {
    try {
      const res = await fetch(`${API_BASE}/games?category=${category}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching games:', err);
      return { success: false, games: [] };
    }
  },

  // Pick random game
  async getRandomGame() {
    try {
      const res = await fetch(`${API_BASE}/games/random`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching random game:', err);
      return { success: false };
    }
  },

  // Submit score, update local & server high score, and check achievements
  async submitScore(gameKey, score, isWin, user) {
    // Record locally right away so user immediately sees their High Score
    const userId = user?.id || 'guest';
    recordGameScore(gameKey, score, userId);

    try {
      const res = await fetch(`${API_BASE}/games/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameKey, score, isWin, user })
      });
      return await res.json();
    } catch (err) {
      console.error('Error submitting score:', err);
      return { success: false };
    }
  },

  // Get user personal high scores across all games
  async getUserHighScores(userId) {
    try {
      const res = await fetch(`${API_BASE}/games/highscores/${userId}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching user high scores:', err);
      return { success: false, highScores: {} };
    }
  },

  // Update user profile info (username, email, avatar)
  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, message: 'Connection error updating profile' };
    }
  },

  // Global leaderboard
  async getGlobalLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/leaderboard/global`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
      return { success: false, leaderboard: [] };
    }
  },

  // Game specific leaderboard
  async getGameLeaderboard(gameKey) {
    try {
      const res = await fetch(`${API_BASE}/leaderboard/${gameKey}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching game leaderboard:', err);
      return { success: false, leaderboard: [] };
    }
  },

  // All achievements
  async getAchievements() {
    try {
      const res = await fetch(`${API_BASE}/achievements`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching achievements:', err);
      return { success: false, achievements: [] };
    }
  },

  // User unlocked achievements
  async getUserAchievements(userId) {
    try {
      const res = await fetch(`${API_BASE}/achievements/user/${userId}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching user achievements:', err);
      return { success: false, unlocked: [] };
    }
  },

  // Unlock achievement directly
  async unlockAchievement(key, user) {
    try {
      const res = await fetch(`${API_BASE}/achievements/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, userId: user?.id || 1 })
      });
      return await res.json();
    } catch (err) {
      console.error('Error unlocking achievement:', err);
      return { success: false };
    }
  },

  // Generic POST helper
  async post(endpoint, data) {
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.error(`Error POST ${endpoint}:`, err);
      return { success: false };
    }
  },

  // Generic GET helper
  async get(endpoint) {
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const res = await fetch(`${API_BASE}${path}`);
      return await res.json();
    } catch (err) {
      console.error(`Error GET ${endpoint}:`, err);
      return { success: false };
    }
  }
};
