import db, { memDB, isDbConnected, query } from '../config/db.js';
import { GAMES_LIST, ACHIEVEMENTS_DATA } from '../../../shared/gameMetadata.js';

// Get all games catalog
export const getAllGames = async (req, res) => {
  try {
    const { category } = req.query;
    let list = GAMES_LIST;
    if (category && category !== 'ALL') {
      list = list.filter(g => g.category === category);
    }
    res.json({
      success: true,
      count: list.length,
      games: list
    });
  } catch (error) {
    console.error('[Game Controller Error]', error);
    res.status(500).json({ message: 'Error fetching games catalog' });
  }
};

// Get single game by ID
export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = GAMES_LIST.find(g => g.id.toLowerCase() === id.toLowerCase());
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game details' });
  }
};

// Pick a random game (Roulette feature)
export const getRandomGame = async (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * GAMES_LIST.length);
    res.json({
      success: true,
      game: GAMES_LIST[randomIndex]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error picking random game' });
  }
};

// Record score & award achievements
export const submitGameScore = async (req, res) => {
  const { gameKey, score, isWin, user } = req.body;
  const username = user?.username || 'Pilot';
  const userId = user?.id || 1;

  try {
    // 1. Update Game Leaderboard
    if (!memDB.leaderboards[gameKey]) {
      memDB.leaderboards[gameKey] = [];
    }

    memDB.leaderboards[gameKey].push({
      username,
      score: Number(score) || 0,
      achieved_at: new Date()
    });
    
    // Sort descending and keep top 25
    memDB.leaderboards[gameKey].sort((a, b) => b.score - a.score);
    memDB.leaderboards[gameKey] = memDB.leaderboards[gameKey].slice(0, 25);

    // 2. Update Global Leaderboard Points
    let globalEntry = memDB.global_leaderboard.find(p => p.username === username);
    if (!globalEntry) {
      globalEntry = { username, total_points: 0, total_wins: 0, rank_title: 'Novice Gamer' };
      memDB.global_leaderboard.push(globalEntry);
    }
    globalEntry.total_points += Math.max(score || 0, isWin ? 50 : 10);
    if (isWin) globalEntry.total_wins += 1;
    
    // Update rank title based on total points
    if (globalEntry.total_points > 1000) globalEntry.rank_title = 'Arcade Legend';
    else if (globalEntry.total_points > 500) globalEntry.rank_title = 'Neon Veteran';
    else if (globalEntry.total_points > 200) globalEntry.rank_title = 'Rising Star';

    memDB.global_leaderboard.sort((a, b) => b.total_points - a.total_points);

    // 3. Evaluate and unlock achievements
    const unlockedAchievements = [];
    if (!memDB.user_achievements[userId]) {
      memDB.user_achievements[userId] = new Set();
    }

    const checkAndUnlock = (achKey) => {
      if (!memDB.user_achievements[userId].has(achKey)) {
        memDB.user_achievements[userId].add(achKey);
        const ach = ACHIEVEMENTS_DATA.find(a => a.key === achKey);
        if (ach) unlockedAchievements.push(ach);
      }
    };

    // Board & Multiplayer Achievements
    if (gameKey === 'CHESS' && isWin) checkAndUnlock('CHESS_GRANDMASTER_WIN');
    if (gameKey === 'EIGHT_BALL_POOL' && isWin) checkAndUnlock('POOL_8BALL_WIN');
    if (gameKey === 'UNO' && isWin) checkAndUnlock('UNO_MATCH_WIN');
    if (gameKey === 'LUDO' && isWin) checkAndUnlock('LUDO_ROYAL_VICTORY');
    if (gameKey === 'SNAKE' && isWin) checkAndUnlock('SNAKE_LADDER_WIN');
    if (gameKey === 'TIC_TAC_TOE' && isWin) checkAndUnlock('TTT_FIRST_WIN');
    if (gameKey === 'CONNECT_4' && isWin) checkAndUnlock('C4_FIRST_WIN');
    if (gameKey === 'CARROM' && isWin) checkAndUnlock('CARROM_QUEEN_COVER');

    // Puzzle Achievements
    if (gameKey === 'WORDLE' && isWin) checkAndUnlock('WORDLE_SOLVED');
    if (gameKey === 'GAME_2048' && score >= 2048) checkAndUnlock('2048_VICTORY');
    if (gameKey === 'MINESWEEPER' && isWin) checkAndUnlock('MINE_CLEAR_EASY');
    if (gameKey === 'BLOCK_PUZZLE' && score >= 300) checkAndUnlock('BLOCK_MULTI_CLEAR');

    // Action & CrazyGames Achievements
    if (gameKey === 'ROOFTOP_SNIPERS' && isWin) checkAndUnlock('SNIPER_ROOFTOP_WIN');
    if (gameKey === 'SLOPE_3D' && score >= 1000) checkAndUnlock('SLOPE_SCORE_1000');
    if (gameKey === 'SOCCER_PHYSICS' && isWin) checkAndUnlock('SOCCER_PHYSICS_WIN');
    if (gameKey === 'TANK_BATTLE' && isWin) checkAndUnlock('TANK_WAR_WIN');
    if (gameKey === 'PONG' && isWin) checkAndUnlock('PONG_SHUTOUT');
    if (gameKey === 'AIR_HOCKEY' && isWin) checkAndUnlock('HOCKEY_WIN_MASTER');
    if (gameKey === 'CYBER_RACER' && score >= 1000) checkAndUnlock('RACER_SCORE_1000');
    if (gameKey === 'FRUIT_SLICER' && score >= 500) checkAndUnlock('FRUIT_COMBO_5X');
    if (gameKey === 'KNIFE_HIT' && (isWin || score >= 5)) checkAndUnlock('KNIFE_STAGE_CLEAR');
    if (gameKey === 'SNAKE_GAME' && score >= 100) checkAndUnlock('SNAKE_SCORE_100');
    if (gameKey === 'BRICK_BREAKER' && score >= 500) checkAndUnlock('BRICK_SCORE_500');
    if (gameKey === 'PIANO_TILES' && score >= 100) checkAndUnlock('PIANO_TILES_100');
    if (gameKey === 'BUBBLE_SHOOTER' && score >= 300) checkAndUnlock('BUBBLE_CLEAR_BOARD');

    // 4. Update Personal High Score in memDB
    if (!memDB.user_high_scores) {
      memDB.user_high_scores = {};
    }
    if (!memDB.user_high_scores[userId]) {
      memDB.user_high_scores[userId] = {};
    }
    const currentHigh = memDB.user_high_scores[userId][gameKey] || 0;
    const newHigh = Math.max(currentHigh, Number(score) || 0);
    memDB.user_high_scores[userId][gameKey] = newHigh;

    // Also persist to MySQL if connected
    if (isDbConnected()) {
      await query(
        `INSERT INTO game_leaderboards (game_key, user_id, username, score) VALUES (?, ?, ?, ?)`,
        [gameKey, userId, username, score]
      );
    }

    return res.json({
      success: true,
      message: 'Score recorded successfully',
      score,
      highScore: newHigh,
      unlockedAchievements
    });
  } catch (error) {
    console.error('[Score Submission Error]', error);
    res.status(500).json({ message: 'Error recording score' });
  }
};

// Get all personal high scores for a specific user
export const getUserHighScores = async (req, res) => {
  const { userId } = req.params;
  const userScores = (memDB.user_high_scores && memDB.user_high_scores[userId])
    ? memDB.user_high_scores[userId]
    : {};
  return res.json({ success: true, highScores: userScores });
};
