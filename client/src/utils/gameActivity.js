// client/src/utils/gameActivity.js
// Utility to track and retrieve user game activity (play counts & recently played)

const STORAGE_PREFIX = 'neon_game_activity_';

export const getStorageKey = (userId = 'guest') => `${STORAGE_PREFIX}${userId}`;

/**
 * Get all activity records for a given user.
 * Structure: { [gameId]: { count: number, lastPlayed: number } }
 */
export const getGameActivity = (userId = 'guest') => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Error reading game activity from localStorage:', err);
    return {};
  }
};

/**
 * Record a game play event.
 * Increments play count and updates the lastPlayed timestamp.
 */
export const recordGamePlay = (gameId, userId = 'guest') => {
  if (!gameId) return;
  try {
    const activity = getGameActivity(userId);
    const existing = activity[gameId] || { count: 0, lastPlayed: 0, highScore: 0 };

    activity[gameId] = {
      count: existing.count + 1,
      lastPlayed: Date.now(),
      highScore: existing.highScore || 0
    };

    localStorage.setItem(getStorageKey(userId), JSON.stringify(activity));
  } catch (err) {
    console.error('Error saving game activity to localStorage:', err);
  }
};

/**
 * Record a game score and update personal high score if it exceeds previous best.
 */
export const recordGameScore = (gameId, score, userId = 'guest') => {
  if (!gameId) return 0;
  const numScore = Number(score) || 0;
  try {
    const activity = getGameActivity(userId);
    const existing = activity[gameId] || { count: 0, lastPlayed: 0, highScore: 0 };
    const newHigh = Math.max(existing.highScore || 0, numScore);

    activity[gameId] = {
      count: existing.count || 1,
      lastPlayed: existing.lastPlayed || Date.now(),
      highScore: newHigh
    };

    localStorage.setItem(getStorageKey(userId), JSON.stringify(activity));
    return newHigh;
  } catch (err) {
    console.error('Error recording game score to localStorage:', err);
    return numScore;
  }
};

/**
 * Get personal high score for a specific game.
 */
export const getGameHighScore = (gameId, userId = 'guest') => {
  const activity = getGameActivity(userId);
  return activity[gameId]?.highScore || 0;
};

/**
 * Get list of game IDs ordered by most recently played.
 */
export const getRecentGameIds = (userId = 'guest', limit = 10) => {
  const activity = getGameActivity(userId);
  return Object.entries(activity)
    .filter(([_, data]) => data && data.lastPlayed > 0)
    .sort((a, b) => b[1].lastPlayed - a[1].lastPlayed)
    .slice(0, limit)
    .map(([gameId]) => gameId);
};

/**
 * Get list of game IDs ordered by play count (most played first).
 */
export const getMostPlayedGameIds = (userId = 'guest', limit = 10) => {
  const activity = getGameActivity(userId);
  return Object.entries(activity)
    .filter(([_, data]) => data && data.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([gameId]) => gameId);
};

/**
 * Format relative time (e.g. "Just now", "5m ago", "Yesterday")
 */
export const formatLastPlayed = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
};
