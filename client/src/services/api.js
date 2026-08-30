// client/src/services/api.js
const API_BASE = `http://${window.location.hostname}:3001/api`;

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

  // Submit score and check achievements
  async submitScore(gameKey, score, isWin, user) {
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
  }
};
