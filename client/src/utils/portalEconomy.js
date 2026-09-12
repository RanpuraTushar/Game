// client/src/utils/portalEconomy.js
// Persistent Virtual Economy, Daily Quests, Cosmetic Catalog, and Star Reviews system

const ECONOMY_KEY_PREFIX = 'neon_portal_economy_';
const REVIEWS_KEY_PREFIX = 'neon_portal_reviews_';
const VOTES_KEY_PREFIX = 'neon_portal_votes_';
const QUESTS_KEY_PREFIX = 'neon_portal_quests_';

export const COSMETICS_CATALOG = {
  frames: [
    {
      id: 'frame_neon_cyan',
      name: 'Cyan Pulse',
      description: 'Futuristic high-voltage cyan glow border',
      price: 150,
      type: 'frame',
      color: '#00f3ff',
      cssClass: 'frame-pulse-cyan'
    },
    {
      id: 'frame_golden_crown',
      name: 'Golden Champion',
      description: 'Shimmering 24k gold champion crest aura',
      price: 350,
      type: 'frame',
      color: '#ffd700',
      cssClass: 'frame-pulse-gold'
    },
    {
      id: 'frame_inferno',
      name: 'Inferno Flame',
      description: 'Blazing neon crimson heat aura',
      price: 450,
      type: 'frame',
      color: '#ff0055',
      cssClass: 'frame-pulse-crimson'
    },
    {
      id: 'frame_matrix_glitch',
      name: 'Matrix Cyber',
      description: 'Electric emerald terminal scanlines',
      price: 550,
      type: 'frame',
      color: '#00ff88',
      cssClass: 'frame-pulse-emerald'
    },
    {
      id: 'frame_hologram',
      name: 'Ultra Hologram',
      description: 'Iridescent multi-spectrum cyber radiance',
      price: 800,
      type: 'frame',
      color: '#b026ff',
      cssClass: 'frame-pulse-hologram'
    }
  ],
  titles: [
    {
      id: 'title_arcade_legend',
      name: 'Arcade Legend',
      description: 'Master of all arcade classics',
      price: 200,
      type: 'title',
      badgeColor: '#ffd700',
      icon: '👑'
    },
    {
      id: 'title_speed_demon',
      name: 'Speed Demon',
      description: 'Reflexes faster than light',
      price: 250,
      type: 'title',
      badgeColor: '#00f3ff',
      icon: '⚡'
    },
    {
      id: 'title_grandmaster',
      name: 'Cyber Grandmaster',
      description: 'Strategic genius in board and logic arenas',
      price: 350,
      type: 'title',
      badgeColor: '#b026ff',
      icon: '♟️'
    },
    {
      id: 'title_night_pilot',
      name: 'Night City Pilot',
      description: 'Glides across the neon neon skyline',
      price: 300,
      type: 'title',
      badgeColor: '#00ff88',
      icon: '🏎️'
    },
    {
      id: 'title_retro_king',
      name: 'Pixel King',
      description: 'Champion of 80s and 90s retro nostalgia',
      price: 450,
      type: 'title',
      badgeColor: '#ff007f',
      icon: '🕹️'
    }
  ]
};

const DEFAULT_ECONOMY = {
  coins: 450, // Starting bonus for immediate fun
  xp: 180,
  level: 2,
  inventory: ['frame_neon_cyan'],
  equippedFrame: 'frame_neon_cyan',
  equippedTitle: '',
  lastDailyClaim: null
};

export const getUserEconomy = (userId = 'guest') => {
  try {
    const raw = localStorage.getItem(ECONOMY_KEY_PREFIX + userId);
    if (!raw) {
      localStorage.setItem(ECONOMY_KEY_PREFIX + userId, JSON.stringify(DEFAULT_ECONOMY));
      return { ...DEFAULT_ECONOMY };
    }
    return { ...DEFAULT_ECONOMY, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_ECONOMY };
  }
};

export const saveUserEconomy = (data, userId = 'guest') => {
  try {
    localStorage.setItem(ECONOMY_KEY_PREFIX + userId, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving economy:', e);
  }
};

export const addCoins = (amount, userId = 'guest') => {
  const current = getUserEconomy(userId);
  current.coins = Math.max(0, (current.coins || 0) + amount);
  saveUserEconomy(current, userId);
  return current.coins;
};

export const addXP = (amount, userId = 'guest') => {
  const current = getUserEconomy(userId);
  const oldLevel = current.level || 1;
  current.xp = (current.xp || 0) + amount;
  
  // XP required for next level: level * 150
  const xpNeeded = oldLevel * 150;
  let leveledUp = false;
  if (current.xp >= xpNeeded) {
    current.level = oldLevel + 1;
    current.xp -= xpNeeded;
    current.coins = (current.coins || 0) + 100; // Level up coin prize!
    leveledUp = true;
  }
  
  saveUserEconomy(current, userId);
  return { ...current, leveledUp };
};

export const canClaimDailyBonus = (userId = 'guest') => {
  const current = getUserEconomy(userId);
  if (!current.lastDailyClaim) return true;
  const today = new Date().toDateString();
  const lastDate = new Date(current.lastDailyClaim).toDateString();
  return today !== lastDate;
};

export const claimDailyBonus = (userId = 'guest') => {
  if (!canClaimDailyBonus(userId)) return { success: false, message: 'Already claimed today' };
  const current = getUserEconomy(userId);
  const bonusCoins = 150;
  const bonusXP = 75;
  current.coins = (current.coins || 0) + bonusCoins;
  current.xp = (current.xp || 0) + bonusXP;
  current.lastDailyClaim = Date.now();
  saveUserEconomy(current, userId);
  return { success: true, bonusCoins, bonusXP, current };
};

export const buyCosmeticItem = (itemId, userId = 'guest') => {
  const current = getUserEconomy(userId);
  const allItems = [...COSMETICS_CATALOG.frames, ...COSMETICS_CATALOG.titles];
  const item = allItems.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not found' };
  if (current.inventory?.includes(itemId)) return { success: false, message: 'Already owned' };
  if ((current.coins || 0) < item.price) return { success: false, message: 'Insufficient coins' };

  current.coins -= item.price;
  current.inventory = [...(current.inventory || []), itemId];
  
  // Auto-equip if nothing equipped
  if (item.type === 'frame' && !current.equippedFrame) current.equippedFrame = item.id;
  if (item.type === 'title' && !current.equippedTitle) current.equippedTitle = item.id;

  saveUserEconomy(current, userId);
  return { success: true, item, current };
};

export const equipCosmeticItem = (itemId, userId = 'guest') => {
  const current = getUserEconomy(userId);
  const allItems = [...COSMETICS_CATALOG.frames, ...COSMETICS_CATALOG.titles];
  const item = allItems.find(i => i.id === itemId);
  if (!item) return { success: false };

  if (item.type === 'frame') {
    current.equippedFrame = current.equippedFrame === itemId ? '' : itemId;
  } else if (item.type === 'title') {
    current.equippedTitle = current.equippedTitle === itemId ? '' : itemId;
  }

  saveUserEconomy(current, userId);
  return { success: true, current };
};

// ==========================================
// DAILY QUESTS
// ==========================================
const BASE_DAILY_QUESTS = [
  {
    id: 'daily_play_games',
    title: 'Arcade Explorer',
    description: 'Play any 3 different games across the portal',
    target: 3,
    rewardCoins: 120,
    rewardXP: 60,
    icon: '🎮'
  },
  {
    id: 'daily_high_score',
    title: 'High Score Hero',
    description: 'Score 500+ points or play 2 matches in Action or Arcade',
    target: 1,
    rewardCoins: 180,
    rewardXP: 90,
    icon: '⚡'
  },
  {
    id: 'daily_classic_duel',
    title: 'Master Tactician',
    description: 'Play at least 1 match in Board, Puzzle, or Multiplayer mode',
    target: 1,
    rewardCoins: 200,
    rewardXP: 100,
    icon: '♟️'
  }
];

export const getDailyQuests = (userId = 'guest') => {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem(QUESTS_KEY_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && parsed.quests) {
        return parsed.quests;
      }
    }
  } catch (e) {}

  const initialQuests = BASE_DAILY_QUESTS.map(q => ({
    ...q,
    progress: 0,
    completed: false,
    claimed: false
  }));

  localStorage.setItem(QUESTS_KEY_PREFIX + userId, JSON.stringify({
    date: today,
    quests: initialQuests
  }));

  return initialQuests;
};

export const reportQuestProgress = (type, value = 1, userId = 'guest') => {
  const quests = getDailyQuests(userId);
  let updated = false;

  quests.forEach(q => {
    if (q.claimed) return;
    if (type === 'PLAY_ANY' && q.id === 'daily_play_games') {
      q.progress = Math.min(q.target, q.progress + value);
      if (q.progress >= q.target) q.completed = true;
      updated = true;
    }
    if (type === 'HIGH_SCORE' && q.id === 'daily_high_score') {
      q.progress = Math.min(q.target, q.progress + 1);
      if (q.progress >= q.target) q.completed = true;
      updated = true;
    }
    if (type === 'BOARD_PLAY' && q.id === 'daily_classic_duel') {
      q.progress = Math.min(q.target, q.progress + 1);
      if (q.progress >= q.target) q.completed = true;
      updated = true;
    }
  });

  if (updated) {
    const today = new Date().toDateString();
    localStorage.setItem(QUESTS_KEY_PREFIX + userId, JSON.stringify({
      date: today,
      quests
    }));
  }
  return quests;
};

export const claimQuestReward = (questId, userId = 'guest') => {
  const quests = getDailyQuests(userId);
  const quest = quests.find(q => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) return { success: false };

  quest.claimed = true;
  const today = new Date().toDateString();
  localStorage.setItem(QUESTS_KEY_PREFIX + userId, JSON.stringify({
    date: today,
    quests
  }));

  addCoins(quest.rewardCoins, userId);
  addXP(quest.rewardXP, userId);
  return { success: true, rewardCoins: quest.rewardCoins, rewardXP: quest.rewardXP };
};

// ==========================================
// STAR RATINGS & USER REVIEWS
// ==========================================
const SEED_REVIEWS = {
  CYBER_RACER: [
    { id: 'r1', username: 'VortexRider', avatar: '🏎️', rating: 5, time: '2 hours ago', comment: 'The synthwave music and sense of speed is incredible! Best arcade racer on the platform.' },
    { id: 'r2', username: 'NeonKnight', avatar: '⚡', rating: 5, time: 'Yesterday', comment: 'Super smooth steering controls. Love upgrading my score multiplier.' },
    { id: 'r3', username: 'PixelPilot', avatar: '🤖', rating: 4, time: '3 days ago', comment: 'Really addictive! Challenging boost management at high speeds.' }
  ],
  CHESS: [
    { id: 'r4', username: 'Kasparov99', avatar: '♟️', rating: 5, time: '1 hour ago', comment: 'The AI engine is legitimately tactical! Great board animations.' },
    { id: 'r5', username: 'QueenGambit', avatar: '👑', rating: 5, time: 'Yesterday', comment: 'Pass and Play mode works flawlessly with my friends.' }
  ],
  EIGHT_BALL_POOL: [
    { id: 'r6', username: 'CueMaster', avatar: '🎱', rating: 5, time: '4 hours ago', comment: 'Realistic spin physics and angled pockets. Best browser pool game hands down.' },
    { id: 'r7', username: 'TrickShot', avatar: '🎯', rating: 4, time: '2 days ago', comment: 'The interactive cue stick pull feels extremely satisfying!' }
  ],
  SLOPE_3D: [
    { id: 'r8', username: 'GravityDefier', avatar: '🚀', rating: 5, time: '5 hours ago', comment: 'Fast, thrilling, and instantly restarts when you fall. Pure reflex arcade goodness!' }
  ],
  ROOFTOP_SNIPERS: [
    { id: 'r9', username: 'SniperElite', avatar: '🥷', rating: 5, time: '1 day ago', comment: 'Hilarious ragdoll physics! Endless laughter playing against friends.' }
  ]
};

export const getGameReviews = (gameId) => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY_PREFIX + gameId);
    const userReviews = raw ? JSON.parse(raw) : [];
    const seed = SEED_REVIEWS[gameId] || [
      { id: 'def1', username: 'CyberGamer', avatar: '👾', rating: 5, time: '1 day ago', comment: 'Super smooth gameplay and gorgeous neon visuals!' },
      { id: 'def2', username: 'ArcadeFan', avatar: '🕹️', rating: 4, time: '3 days ago', comment: 'Love the controls and responsiveness. 10/10 time killer.' }
    ];
    return [...userReviews, ...seed];
  } catch (e) {
    return SEED_REVIEWS[gameId] || [];
  }
};

export const addGameReview = (gameId, { username, avatar, rating, comment }) => {
  if (!gameId || !comment.trim()) return null;
  const newReview = {
    id: 'rev_' + Date.now(),
    username: username || 'Pilot',
    avatar: avatar || '👤',
    rating: Number(rating) || 5,
    time: 'Just now',
    comment: comment.trim()
  };

  try {
    const raw = localStorage.getItem(REVIEWS_KEY_PREFIX + gameId);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [newReview, ...existing];
    localStorage.setItem(REVIEWS_KEY_PREFIX + gameId, JSON.stringify(updated));
    return newReview;
  } catch (e) {
    console.error('Error saving review:', e);
    return newReview;
  }
};

export const getGameVotes = (gameId, userId = 'guest') => {
  try {
    const raw = localStorage.getItem(VOTES_KEY_PREFIX + gameId);
    const base = raw ? JSON.parse(raw) : { up: 124, down: 4, userVote: null };
    const userVoteKey = `${VOTES_KEY_PREFIX}user_${userId}_${gameId}`;
    base.userVote = localStorage.getItem(userVoteKey) || null;
    return base;
  } catch (e) {
    return { up: 124, down: 4, userVote: null };
  }
};

export const voteGame = (gameId, voteType, userId = 'guest') => {
  try {
    const userVoteKey = `${VOTES_KEY_PREFIX}user_${userId}_${gameId}`;
    const currentVote = localStorage.getItem(userVoteKey);
    const votes = getGameVotes(gameId, userId);

    if (currentVote === voteType) {
      // Toggle off
      if (voteType === 'up') votes.up = Math.max(0, votes.up - 1);
      if (voteType === 'down') votes.down = Math.max(0, votes.down - 1);
      localStorage.removeItem(userVoteKey);
      votes.userVote = null;
    } else {
      // Switch or set
      if (currentVote === 'up') votes.up = Math.max(0, votes.up - 1);
      if (currentVote === 'down') votes.down = Math.max(0, votes.down - 1);

      if (voteType === 'up') votes.up += 1;
      if (voteType === 'down') votes.down += 1;

      localStorage.setItem(userVoteKey, voteType);
      votes.userVote = voteType;
    }

    localStorage.setItem(VOTES_KEY_PREFIX + gameId, JSON.stringify({ up: votes.up, down: votes.down }));
    return votes;
  } catch (e) {
    return { up: 125, down: 4, userVote: voteType };
  }
};

// ==========================================
// COMMUNITY PULSE LIVE TICKER
// ==========================================
export const COMMUNITY_EVENTS = [
  { id: '1', icon: '🔥', text: 'Alex_Zero scored 3,840 on Cyber Racer!' },
  { id: '2', icon: '👑', text: 'Valkyrie unlocked the Golden Champion frame!' },
  { id: '3', icon: '⚡', text: 'Ghost_Pilot completed all 3 Daily Quests (+500 Coins)!' },
  { id: '4', icon: '♟️', text: 'ShadowMaster reached Level 12 in Grandmaster Chess!' },
  { id: '5', icon: '🎉', text: 'CyberQueen joined Uno multiplayer table with 3 friends!' },
  { id: '6', icon: '🎱', text: 'RickShot pulled a clean 8-ball combo in Pool Pro!' },
  { id: '7', icon: '✨', text: 'NeoGamer equipped the "Arcade Legend" prestige title!' }
];
