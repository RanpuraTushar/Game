import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { GAMES_LIST, ACHIEVEMENTS_DATA } from '../../../shared/gameMetadata.js';

dotenv.config();

let pool = null;
let isConnected = false;

// In-Memory Database Fallback Store
export const memDB = {
  users: [
    { id: 1, username: 'PlayerOne', email: 'player1@arcade.io', password_hash: '$2a$10$abcdef', coins: 500, xp: 120, level: 2 },
    { id: 2, username: 'CyberNinja', email: 'ninja@arcade.io', password_hash: '$2a$10$abcdef', coins: 1200, xp: 850, level: 5 }
  ],
  games: [...GAMES_LIST],
  game_stats: {},
  leaderboards: {
    // 1. Board Classics
    LUDO: [
      { username: 'CyberNinja', score: 350, achieved_at: new Date() },
      { username: 'PlayerOne', score: 210, achieved_at: new Date() }
    ],
    SNAKE: [
      { username: 'RetroKing', score: 100, achieved_at: new Date() }
    ],
    TIC_TAC_TOE: [
      { username: 'CyberNinja', score: 180, achieved_at: new Date() },
      { username: 'PlayerOne', score: 120, achieved_at: new Date() }
    ],
    CONNECT_4: [
      { username: 'GravityGuru', score: 90, achieved_at: new Date() }
    ],

    // 2. Puzzle Hits
    WORDLE: [
      { username: 'LexiconSage', score: 480, achieved_at: new Date() }
    ],
    GAME_2048: [
      { username: 'TileWhiz', score: 18420, achieved_at: new Date() },
      { username: 'CyberNinja', score: 8192, achieved_at: new Date() }
    ],
    MINESWEEPER: [
      { username: 'DefusePro', score: 280, achieved_at: new Date() },
      { username: 'CyberNinja', score: 190, achieved_at: new Date() }
    ],

    // 3. Arcade Classics
    SNAKE_GAME: [
      { username: 'RetroKing', score: 145, achieved_at: new Date() },
      { username: 'CyberNinja', score: 98, achieved_at: new Date() }
    ],
    BRICK_BREAKER: [
      { username: 'MatrixCrusher', score: 840, achieved_at: new Date() }
    ],
    PONG: [
      { username: 'PongMaster', score: 70, achieved_at: new Date() },
      { username: 'CyberNinja', score: 55, achieved_at: new Date() }
    ],
    PIANO_TILES: [
      { username: 'BeatsMaestro', score: 320, achieved_at: new Date() }
    ],
    BUBBLE_SHOOTER: [
      { username: 'OrbPop', score: 680, achieved_at: new Date() }
    ]
  },
  global_leaderboard: [
    { username: 'CyberNinja', total_points: 1250, total_wins: 28, rank_title: 'Arcade Grandmaster' },
    { username: 'PlayerOne', total_points: 620, total_wins: 14, rank_title: 'Neon Veteran' },
    { username: 'RetroKing', total_points: 480, total_wins: 10, rank_title: 'Rising Challenger' }
  ],
  achievements: [...ACHIEVEMENTS_DATA],
  user_achievements: {}
};

export const initDatabase = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'arcade_nexus',
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0
    });

    const conn = await pool.getConnection();
    isConnected = true;
    console.log('[DB] Successfully connected to MySQL database (arcade_nexus)');
    conn.release();
    return true;
  } catch (error) {
    console.warn('[DB] MySQL connection not established. Operating in high-speed In-Memory Mode.');
    isConnected = false;
    return false;
  }
};

export const execute = async (sql, params = []) => {
  if (isConnected && pool) {
    try {
      const [rows, fields] = await pool.execute(sql, params);
      return [rows, fields];
    } catch (err) {
      console.error('[DB Execute Error]', err.message);
      return [[], null];
    }
  }
  return [[], null];
};

export const query = async (sql, params = []) => {
  const [rows] = await execute(sql, params);
  return rows;
};

export const isDbConnected = () => isConnected;

export default {
  execute,
  query,
  initDatabase,
  isDbConnected,
  memDB
};
