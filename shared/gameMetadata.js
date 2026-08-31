// shared/gameMetadata.js - The 12 Ultimate Hit Games Catalog

export const GAME_CATEGORIES = {
  ALL: 'ALL',
  BOARD: 'BOARD',
  PUZZLE: 'PUZZLE',
  ACTION: 'ACTION'
};

export const GAMES_LIST = [
  // ==========================================
  // 1. BOARD & MULTIPLAYER FAVORITES (5 Games)
  // ==========================================
  {
    id: 'CHESS',
    title: 'Grandmaster Chess',
    description: 'The royal game of kings! Full standard rules with smart AI engine (Easy/Medium/Hard), Pass & Play, hints, and custom themes.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '♟️',
    color: '#00f3ff',
    controls: 'Click piece to show moves, click destination square to play',
    badge: 'AI & Full FIDE Rules'
  },
  {
    id: 'LUDO',
    title: '3D Ludo Kingdom',
    description: 'The royal board game of kings! Roll the dice, deploy 3D glossy royal pawns, and race all 4 tokens home with AI / 2-4P.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '👑',
    color: '#ffd600',
    controls: 'Click dice to roll, tap highlighted token to move',
    badge: '3D Royal Pawns'
  },
  {
    id: 'SNAKE',
    title: 'Snakes & Ladders 3D',
    description: 'Classic 1-100 board race with organically generated serpentine snakes and climbing ladders.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🎲',
    color: '#00e676',
    controls: 'Click dice to roll and advance your token',
    badge: 'Dynamic Board'
  },
  {
    id: 'TIC_TAC_TOE',
    title: 'Tic-Tac-Toe 1v1',
    description: 'The classic 3x3 grid duel. Play vs smart AI or challenge friends in online 1v1.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '❌⭕',
    color: '#00f3ff',
    controls: 'Click / Tap cell to place X or O',
    badge: '1v1 Arena'
  },
  {
    id: 'CONNECT_4',
    title: 'Connect-4 Gravity',
    description: 'Drop colored discs into the 6x7 vertical matrix. Connect four in a row horizontally, vertically, or diagonally.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🔴🟡',
    color: '#ff3b30',
    controls: 'Click column to drop token',
    badge: '4 In A Row'
  },

  // ==========================================
  // 2. ADDICTIVE PUZZLE HITS (3 Games)
  // ==========================================
  {
    id: 'WORDLE',
    title: 'Wordle Nexus',
    description: 'The world-famous 5-letter word deduction game! Guess the secret word in 6 tries with Green/Yellow clues.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '📝',
    color: '#00ff66',
    controls: 'Type on keyboard or tap virtual letters',
    badge: 'Word Clues'
  },
  {
    id: 'GAME_2048',
    title: 'Neon 2048',
    description: 'Slide and merge matching numbered tiles to construct the coveted 2048 block with undo support.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔢',
    color: '#ff9100',
    controls: 'Arrow Keys / WASD / Swipe to slide tiles',
    badge: 'Tile Merger'
  },
  {
    id: 'MINESWEEPER',
    title: 'Cyber Minesweeper',
    description: 'Uncover safe tiles, flag suspected mines, and clear the grid without detonating.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '💣',
    color: '#ff3366',
    controls: 'Left-Click reveal, Right-Click / Flag Mode to mark',
    badge: 'Safe Reveal'
  },

  // ==========================================
  // 3. FAST-PACED ARCADE CLASSICS (5 Games)
  // ==========================================
  {
    id: 'SNAKE_GAME',
    title: 'Cyber Snake Arena',
    description: 'Slither, consume neon power apples, and grow your snake without crashing into walls or yourself.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🐍',
    color: '#00ff66',
    controls: 'Arrow Keys / WASD to steer snake',
    badge: 'Apple Slither'
  },
  {
    id: 'BRICK_BREAKER',
    title: 'Hyper Brick Breaker',
    description: 'Smash matrices of high-tech neon bricks with paddle deflections and explosive ball bounces.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧱',
    color: '#e040fb',
    controls: 'Move mouse left/right to slide paddle',
    badge: 'Brick Demolition'
  },
  {
    id: 'PONG',
    title: 'Retro Neon Pong',
    description: 'High-speed 60fps retro tennis battle with dynamic paddle curves and velocity physics.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🏓',
    color: '#ff00ff',
    controls: 'Move mouse vertically to position paddle',
    badge: '60 FPS Duel'
  },
  {
    id: 'PIANO_TILES',
    title: 'Grand Piano & Beats',
    description: 'Play a realistic 3D acoustic grand piano! Includes Song Lessons (Für Elise, Canon in D, Interstellar), Free Play, and Arcade Beat Rush.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🎹',
    color: '#00f3ff',
    controls: 'Play PC keys (Q-M, 1-0, Space for pedal) or tap piano keys',
    badge: 'Real Grand Piano'
  },
  {
    id: 'BUBBLE_SHOOTER',
    title: 'Bubble Shooter Arena',
    description: 'Aim your neon bubble cannon! Match 3 or more bubbles of identical color to pop clusters.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔮',
    color: '#00e676',
    controls: 'Aim mouse cursor & click to shoot bubble',
    badge: 'Cluster Pop'
  },
  {
    id: 'CYBER_RACER',
    title: 'Cyber Highway Racer',
    description: 'Dodge retro synthwave highway traffic at breakneck speeds. Collect energy coins, dodge trucks, and ignite Nitro!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🏎️',
    color: '#ff007f',
    controls: 'A / D or Left / Right to steer, W to accelerate, Shift / Space for Nitro',
    badge: '2.5D Nitro Rush'
  },
  {
    id: 'AIR_HOCKEY',
    title: 'Glow Air Hockey',
    description: 'High-speed glowing air hockey duel! Defend your crease, bounce bank shots, and smash goals against Pro AI or a friend.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🏓',
    color: '#00f3ff',
    controls: 'Drag mouse / touch to position mallet (Arrows for P2 in 2-Player mode)',
    badge: '60 FPS Physics'
  },
  {
    id: 'FRUIT_SLICER',
    title: 'Fruit Blade Slicer',
    description: 'Slash flying juicy fruits with razor-sharp glowing blade swipes. Build massive combo multipliers and avoid explosive bombs!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🍉',
    color: '#ff9100',
    controls: 'Click & Drag mouse or swipe screen to slice fruits',
    badge: 'Juicy Combos'
  },
  {
    id: 'KNIFE_HIT',
    title: 'Knife Hit Master',
    description: 'Throw blades into rotating logs and neon boss shields. Slice apples, dodge existing blades, and clear 5 epic stages!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🎯',
    color: '#9d00ff',
    controls: 'Tap screen or press Spacebar to launch knives',
    badge: 'Boss Battles'
  },
  {
    id: 'BLOCK_PUZZLE',
    title: 'Neon Block Jewel 10x10',
    description: 'Place glowing jewel polyomino shapes onto the 10x10 grid. Complete horizontal and vertical lines to trigger laser line clears!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧱',
    color: '#e040fb',
    controls: 'Click jewel piece in tray, then click grid cell to place',
    badge: '10x10 Laser Blast'
  },
  {
    id: 'ZOMBIE_CLICKER',
    title: 'Cyber Zombie Clicker',
    description: 'Tap to blast hordes of cyber zombies and giant boss mutants! Collect gold coins, upgrade click power, and deploy auto-drones.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧟',
    color: '#ff3d00',
    controls: 'Click / Tap Zombie to deal damage & buy arsenal upgrades',
    badge: 'Idle RPG Clicker'
  },
  {
    id: 'CARROM',
    title: 'Authentic 3D Carrom Board',
    description: 'Realistic wooden carrom board with true physics! Pocket white/black carrom men, sink and cover the Red Queen, and challenge Smart AI or friends.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎱',
    color: '#ffd600',
    controls: 'Slide striker on baseline, drag backwards to aim & set power, release to shoot',
    badge: 'Realistic Physics & Queen Cover'
  }
];

export const ACHIEVEMENTS_DATA = [
  { key: 'CHESS_GRANDMASTER_WIN', gameKey: 'CHESS', title: 'Grandmaster Checkmate', desc: 'Defeat the AI or an opponent in Chess', icon: '♟️', points: 80 },
  { key: 'LUDO_ROYAL_VICTORY', gameKey: 'LUDO', title: 'Royal Sovereign', desc: 'Win a full match of 3D Ludo Kingdom', icon: '👑', points: 60 },
  { key: 'SNAKE_LADDER_WIN', gameKey: 'SNAKE', title: 'Serpentine Climber', desc: 'Reach cell 100 in Snakes & Ladders', icon: '🎲', points: 40 },
  { key: 'TTT_FIRST_WIN', gameKey: 'TIC_TAC_TOE', title: 'Grid Tactician', desc: 'Win your first match in Tic-Tac-Toe', icon: '❌', points: 20 },
  { key: 'C4_FIRST_WIN', gameKey: 'CONNECT_4', title: 'Vertical Supremacy', desc: 'Win your first Connect-4 match', icon: '🔴', points: 25 },
  { key: 'WORDLE_SOLVED', gameKey: 'WORDLE', title: 'Linguistic Oracle', desc: 'Guess the secret 5-letter word', icon: '📝', points: 45 },
  { key: '2048_VICTORY', gameKey: 'GAME_2048', title: 'Nexus Quantum 2048', desc: 'Create the legendary 2048 tile!', icon: '🏆', points: 100 },
  { key: 'MINE_CLEAR_EASY', gameKey: 'MINESWEEPER', title: 'Bomb Squad', desc: 'Clear a full Minesweeper grid safely', icon: '💣', points: 40 },
  { key: 'SNAKE_SCORE_100', gameKey: 'SNAKE_GAME', title: 'Cyber Centurion', desc: 'Score over 100 points in Snake Arena', icon: '🐍', points: 50 },
  { key: 'BRICK_SCORE_500', gameKey: 'BRICK_BREAKER', title: 'Laser Matrix Breaker', desc: 'Score 500+ points in Brick Breaker', icon: '🧱', points: 45 },
  { key: 'PONG_SHUTOUT', gameKey: 'PONG', title: 'Flawless Paddle', desc: 'Win a Pong match without conceding a point', icon: '🏓', points: 60 },
  { key: 'PIANO_TILES_100', gameKey: 'PIANO_TILES', title: 'Virtuoso Maestro', desc: 'Hit 100 consecutive piano tiles', icon: '🎹', points: 50 },
  { key: 'BUBBLE_CLEAR_BOARD', gameKey: 'BUBBLE_SHOOTER', title: 'Cluster Buster', desc: 'Pop 50 bubbles in Bubble Shooter', icon: '🔮', points: 40 },
  { key: 'RACER_SCORE_1000', gameKey: 'CYBER_RACER', title: 'Highway Phantom', desc: 'Survive and score 1000+ in Cyber Racer', icon: '🏎️', points: 70 },
  { key: 'HOCKEY_WIN_MASTER', gameKey: 'AIR_HOCKEY', title: 'Rink Dominator', desc: 'Defeat the Master AI in Glow Air Hockey', icon: '🏓', points: 65 },
  { key: 'FRUIT_COMBO_5X', gameKey: 'FRUIT_SLICER', title: 'Blade Master', desc: 'Achieve a 5x fruit slice combo', icon: '🍉', points: 55 },
  { key: 'KNIFE_STAGE_CLEAR', gameKey: 'KNIFE_HIT', title: 'Target Virtuoso', desc: 'Clear all 5 Knife Hit stages', icon: '🎯', points: 75 },
  { key: 'BLOCK_MULTI_CLEAR', gameKey: 'BLOCK_PUZZLE', title: 'Matrix Demolition', desc: 'Clear 3 or more lines at once in Block Puzzle', icon: '🧱', points: 60 },
  { key: 'ZOMBIE_SLAYER_10', gameKey: 'ZOMBIE_CLICKER', title: 'Apocalypse Survivor', desc: 'Defeat 10 waves of cyber zombies', icon: '🧟', points: 50 },
  { key: 'CARROM_QUEEN_COVER', gameKey: 'CARROM', title: 'Carrom Grandmaster', desc: 'Win a Carrom match by pocketing and covering the Queen', icon: '🎱', points: 75 }
];

