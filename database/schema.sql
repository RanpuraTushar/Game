-- ==========================================================
-- ARCADE NEXUS - Master Database Schema & Seeds
-- ==========================================================

CREATE DATABASE IF NOT EXISTS arcade_nexus;
USE arcade_nexus;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=arcade',
  bio VARCHAR(255) DEFAULT 'Arcade Nexus Gamer',
  coins INT DEFAULT 100,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Games Catalog Table
CREATE TABLE IF NOT EXISTS games (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL,
  is_multiplayer BOOLEAN DEFAULT FALSE,
  max_players INT DEFAULT 2,
  min_players INT DEFAULT 1,
  icon VARCHAR(50) DEFAULT '🎮',
  color VARCHAR(30) DEFAULT '#00f3ff',
  release_date DATE DEFAULT (CURRENT_DATE),
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_category (category),
  INDEX idx_game_key (game_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Game Stats per User
CREATE TABLE IF NOT EXISTS game_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  game_id INT NOT NULL,
  high_score INT DEFAULT 0,
  total_plays INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  total_draws INT DEFAULT 0,
  total_playtime_seconds INT DEFAULT 0,
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_game (user_id, game_id),
  INDEX idx_user_id (user_id),
  INDEX idx_high_score (high_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Global Leaderboard
CREATE TABLE IF NOT EXISTS global_leaderboard (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  total_points INT DEFAULT 0,
  total_games_played INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  win_rate FLOAT DEFAULT 0.0,
  rank_title VARCHAR(50) DEFAULT 'Novice Gamer',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_total_points (total_points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Per-Game Leaderboards
CREATE TABLE IF NOT EXISTS game_leaderboards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_key VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_game_score (game_key, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Achievements Catalog
CREATE TABLE IF NOT EXISTS achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_key VARCHAR(50) UNIQUE NOT NULL,
  game_key VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🏆',
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  points INT DEFAULT 20,
  INDEX idx_game_key (game_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Player Unlocked Achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  achievement_key VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_key),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Matches History
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_key VARCHAR(50) NOT NULL,
  room_code VARCHAR(10),
  match_type ENUM('single', 'multiplayer') NOT NULL,
  player_count INT DEFAULT 1,
  duration_seconds INT DEFAULT 0,
  winner_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_game_key (game_key),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SEED DATA: 10 Casual Classic Games
-- ==========================================================

INSERT INTO games (game_key, title, description, category, is_multiplayer, max_players, icon, color) VALUES
('TIC_TAC_TOE', 'Tic-Tac-Toe 1v1', 'The quintessential 3x3 strategy battle. Play vs Smart AI or online 1v1.', 'CASUAL', TRUE, 2, '❌⭕', '#00f3ff'),
('SNAKE_GAME', 'Cyber Snake Arena', 'Slither, consume neon power apples, and grow without crashing into walls.', 'CASUAL', TRUE, 2, '🐍', '#00ff66'),
('PONG', 'Retro Neon Pong', 'High-speed 60fps retro tennis battle with dynamic deflection curves.', 'CASUAL', TRUE, 2, '🏓', '#ff00ff'),
('MEMORY_MATCH', 'Cyber Memory Match', 'Flip holographic cyber tiles to discover identical pairs against the clock.', 'CASUAL', TRUE, 2, '🃏', '#ffea00'),
('CONNECT_4', 'Connect-4 Gravity', 'Drop discs into the 6x7 vertical matrix to connect four in a row.', 'CASUAL', TRUE, 2, '🔴🟡', '#ff3b30'),
('GAME_2048', 'Neon 2048', 'Slide and merge identical numbered tiles to reach the coveted 2048 block.', 'CASUAL', FALSE, 1, '🔢', '#ff9100'),
('FLAPPY_BIRD', 'Flappy Cyber-Bird', 'Navigate through treacherous neon pipe obstacles with precise tap physics.', 'CASUAL', FALSE, 1, '🐤', '#00e5ff'),
('BRICK_BREAKER', 'Hyper Brick Breaker', 'Smash matrices of high-tech neon bricks with paddle deflections and power-ups.', 'CASUAL', FALSE, 1, '🧱', '#e040fb'),
('WHACK_A_MOLE', 'Cyber Mole Blitz', 'Fast-paced reaction arcade! Whack cyber-moles before they vanish into burrows.', 'CASUAL', FALSE, 1, '🔨', '#76ff03'),
('SIMON_SAYS', 'Simon Says Pulse', 'Audio-visual electronic pattern memory. Repeat the escalating pulse sequence.', 'CASUAL', FALSE, 1, '💡', '#ffd600')
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), icon=VALUES(icon), color=VALUES(color);

-- ==========================================================
-- SEED DATA: Achievements for all 10 Games
-- ==========================================================

INSERT INTO achievements (achievement_key, game_key, title, description, icon, rarity, points) VALUES
('TTT_FIRST_WIN', 'TIC_TAC_TOE', 'Grid Tactician', 'Win your first match in Tic-Tac-Toe', '❌', 'common', 20),
('TTT_STREAK_5', 'TIC_TAC_TOE', 'Undefeated Mind', 'Win 5 consecutive games of Tic-Tac-Toe', '👑', 'rare', 50),
('SNAKE_LENGTH_30', 'SNAKE_GAME', 'Python Master', 'Grow your snake to a length of 30', '🐍', 'common', 25),
('SNAKE_SCORE_100', 'SNAKE_GAME', 'Cyber Centurion', 'Score over 100 points in Snake Arena', '⚡', 'rare', 60),
('PONG_SHUTOUT', 'PONG', 'Flawless Paddle', 'Win a Pong match without conceding a single point (7-0)', '🏓', 'epic', 75),
('PONG_SPEED_RALLY', 'PONG', 'Sonic Reflexes', 'Sustain a single Pong ball rally over 20 hits', '💨', 'rare', 40),
('MEMORY_PERFECT', 'MEMORY_MATCH', 'Photographic Mind', 'Clear a full memory match grid in under 45 seconds', '🧠', 'rare', 50),
('MEMORY_STREAK_4', 'MEMORY_MATCH', 'Combo Vision', 'Make 4 correct pair matches in a row without mistake', '✨', 'common', 30),
('C4_FIRST_WIN', 'CONNECT_4', 'Vertical Supremacy', 'Win your first Connect-4 match', '🔴', 'common', 25),
('C4_DIAGONAL_WIN', 'CONNECT_4', 'Diagonal Assassin', 'Win a Connect-4 match with a diagonal 4-in-a-row', '⚔️', 'rare', 50),
('2048_REACH_1024', 'GAME_2048', 'Kilobyte Club', 'Construct a 1024 tile in Neon 2048', '💠', 'rare', 40),
('2048_VICTORY', 'GAME_2048', 'Nexus Quantum 2048', 'Create the legendary 2048 tile and achieve victory!', '🏆', 'legendary', 100),
('FLAPPY_SCORE_25', 'FLAPPY_BIRD', 'Sky Ace', 'Pass 25 pipe gates in Flappy Cyber-Bird', '✈️', 'common', 30),
('FLAPPY_SCORE_50', 'FLAPPY_BIRD', 'Master Aviator', 'Pass 50 pipe gates in Flappy Cyber-Bird', '🎖️', 'epic', 80),
('BRICK_CLEAR_1', 'BRICK_BREAKER', 'Demolition Specialist', 'Clear all bricks in a level without losing a life', '💥', 'common', 30),
('BRICK_SCORE_500', 'BRICK_BREAKER', 'Laser Matrix Breaker', 'Score 500+ points in Brick Breaker', '🌟', 'rare', 50),
('MOLE_HITS_30', 'WHACK_A_MOLE', 'Mole Exterminator', 'Whack 30 cyber moles in a single game', '🔨', 'common', 25),
('MOLE_COMBO_10', 'WHACK_A_MOLE', 'Frenzied Reflexes', 'Achieve a 10x hit combo streak without a miss', '🔥', 'rare', 50),
('SIMON_LEVEL_10', 'SIMON_SAYS', 'Harmonic Memory', 'Repeat a 10-step sequence in Simon Says', '🎵', 'rare', 40),
('SIMON_LEVEL_20', 'SIMON_SAYS', 'Cyber Synthesizer', 'Conquer an insane 20-step sequence in Simon Says', '🔮', 'legendary', 100)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), icon=VALUES(icon), points=VALUES(points);
