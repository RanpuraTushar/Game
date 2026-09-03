// shared/gameMetadata.js - The Curated Hit Games Catalog (Curated & User-Friendly)

export const GAME_CATEGORIES = {
  ALL: 'ALL',
  BOARD: 'BOARD',
  PUZZLE: 'PUZZLE',
  ACTION: 'ACTION',
  EDUCATIONAL: 'EDUCATIONAL',
  MULTIPLAYER: 'MULTIPLAYER'
};

export const GAMES_LIST = [
  // ==========================================
  // 1. BOARD & MULTIPLAYER CLASSICS (8 Games)
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
    controls: 'Click piece to show legal moves, click destination square to play',
    badge: 'AI & 2-Player'
  },
  {
    id: 'EIGHT_BALL_POOL',
    title: '8-Ball Pool Billiards Pro',
    description: 'Realistic tournament pool simulator with 3D rotating balls, segmented rubber cushions with angled pocket jaws, authentic spin (draw/follow/english), direct interactive cue stick pull & release, fine-aim dial, and intelligent AI Bot.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎱',
    color: '#00f3ff',
    controls: 'Mouse/Arrows to aim, drag cue back or use power gauge to shoot, click ball for spin',
    badge: 'Pro AI & 2-Player'
  },
  {
    id: 'UNO',
    title: 'UNO Cyber Cards',
    description: 'Match colors and numbers, play Skip, Reverse, +2, +4 Wild cards, shout UNO, and beat 3 Smart AI Bots or friends in 2-Player Pass & Play!',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🃏',
    color: '#ff007f',
    controls: 'Click matching card to discard, tap draw deck if no moves',
    badge: '4-Player Table'
  },
  {
    id: 'LUDO',
    title: '3D Ludo Kingdom',
    description: 'The royal board game of kings! Roll the dice, deploy 3D glossy royal pawns, and race all 4 tokens home with AI or online multiplayer.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '👑',
    color: '#ffd600',
    controls: 'Click dice to roll, tap highlighted token to move',
    badge: '1-4P Multiplayer'
  },
  {
    id: 'SNAKE',
    title: 'Snakes & Ladders 3D',
    description: 'Classic 1-100 board race with serpentine snakes, climbing ladders, and auto-path traversal.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🎲',
    color: '#00e676',
    controls: 'Click dice to roll and advance your token',
    badge: '1-4P Multiplayer'
  },
  {
    id: 'TIC_TAC_TOE',
    title: 'Tic-Tac-Toe 1v1',
    description: 'The classic 3x3 grid duel. Play vs smart AI or challenge friends in online / local 2-Player 1v1.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '❌⭕',
    color: '#00f3ff',
    controls: 'Click / Tap cell to place X or O',
    badge: 'AI & 2-Player'
  },
  {
    id: 'CONNECT_4',
    title: 'Connect-4 Gravity',
    description: 'Drop colored discs into the 7x6 vertical matrix. Connect four in a row horizontally, vertically, or diagonally.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🔴🟡',
    color: '#ff3b30',
    controls: 'Click column to drop token',
    badge: 'AI & 2-Player'
  },
  {
    id: 'CARROM',
    title: 'Carrom Board 3D',
    description: 'Classic carrom board with realistic friction physics, striker aiming line, power meter, Queen cover rules, and AI / 2-Player mode.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎯',
    color: '#ffd600',
    controls: 'Position striker on baseline, drag back to aim & shoot',
    badge: 'AI & 2-Player'
  },

  // ==========================================
  // 2. ADDICTIVE PUZZLE HITS (4 Games)
  // ==========================================
  {
    id: 'WORDLE',
    title: 'Wordle Nexus',
    description: 'The world-famous 5-letter word deduction game! Guess the secret word in 6 tries with Green/Yellow clues. Includes 2-Player Word Duel!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '📝',
    color: '#00ff66',
    controls: 'Type letters using virtual keyboard or physical keyboard, press Enter to submit',
    badge: 'Solo & 2-Player'
  },
  {
    id: 'GAME_2048',
    title: 'Neon 2048',
    description: 'Slide numbered tiles, merge matching numbers, and climb to the 2048 tile! Featuring Undo, D-Pad, and 2-Player Turn Clash mode.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🔢',
    color: '#ffd600',
    controls: 'Arrow keys / WASD / On-screen D-Pad or swipe to slide tiles',
    badge: 'Solo & 2-Player'
  },
  {
    id: 'MINESWEEPER',
    title: 'Cyber Minesweeper',
    description: 'Classic minefield clearance! Uncover safe sectors, plant warning flags, and clear the field without detonating mines. Solo & 2P Mine Hunt!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '💣',
    color: '#ff3366',
    controls: 'Left Click to reveal sector, Right Click (or Flag Toggle) to plant flag',
    badge: 'Solo & 2-Player'
  },
  {
    id: 'BLOCK_PUZZLE',
    title: 'Neon Block Jewel 10x10',
    description: 'Place randomized jewel tetromino blocks on a 10x10 grid. Complete horizontal and vertical lines to trigger laser line clears and combos.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧱',
    color: '#00f3ff',
    controls: 'Click piece from tray and click grid slot to place it',
    badge: 'Classic 10x10'
  },

  // ==========================================
  // 3. FAST-PACED ACTION & ARCADE (13 Games)
  // ==========================================
  {
    id: 'ROOFTOP_SNIPERS',
    title: 'Rooftop Cyber Snipers',
    description: 'Viral 2-Player ragdoll sniper duel! Jump, rotate rifle, fire sniper recoil bullets, and knock your opponent off the skyscraper roof!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎯',
    color: '#00f3ff',
    controls: 'P1: W to Jump, E to Shoot | P2: I / Up to Jump, O / Enter to Shoot',
    badge: 'CrazyGames Hit'
  },
  {
    id: 'SLOPE_3D',
    title: 'Slope 3D Neon Runner',
    description: 'CrazyGames #1 viral endless runner! Control a glowing 3D neon ball rolling down steep polygonal slopes and dodge red barrier blocks.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🌐',
    color: '#00ff66',
    controls: 'A/D or Left/Right Arrow keys to steer ball',
    badge: 'CrazyGames Hit'
  },
  {
    id: 'SOCCER_PHYSICS',
    title: '2-Player Soccer Physics',
    description: 'Hilarious 1-button ragdoll football duel! Jump, kick, and header bouncing soccer balls into the goal against AI or friends!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '⚽',
    color: '#ffd600',
    controls: 'P1: Press W or Space | P2: Press Up Arrow or Enter to Jump & Kick',
    badge: 'CrazyGames Hit'
  },
  {
    id: 'TANK_BATTLE',
    title: '2-Player Retro Tank Battle',
    description: 'Top-down neon tank duel! Bouncing laser shells, destructible brick walls, shields, and triple shot power-ups in 2-Player & vs AI mode!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '💥',
    color: '#00f3ff',
    controls: 'P1: WASD + Space to Fire | P2: Arrows + Enter to Fire',
    badge: 'AI & 2-Player'
  },
  {
    id: 'PONG',
    title: 'Retro Neon Pong',
    description: 'High-speed classic table tennis arcade! Play solo vs Smart AI or grab a friend for split-screen 2-Player keyboard duel.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🏓',
    color: '#00f3ff',
    controls: 'P1: W/S keys or Left Mouse | P2: Up/Down Arrow keys',
    badge: 'AI & 2-Player'
  },
  {
    id: 'AIR_HOCKEY',
    title: 'Glow Air Hockey',
    description: '2D table physics with striker mallets and gliding puck. Defend your goal and score goals against AI or in 2-Player keyboard mode.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '⚡',
    color: '#00e5ff',
    controls: 'P1: Mouse / Touch to glide mallet | P2: Arrow keys in 2-Player mode',
    badge: 'AI & 2-Player'
  },
  {
    id: 'CYBER_RACER',
    title: 'Cyber Highway Racer',
    description: 'Drive realistic 3D supercars down infinite cyberpunk highways. Choose from 4 garage cars, dodge traffic, and activate Nitro boosts.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🏎️',
    color: '#ff007f',
    controls: 'A/D or Left/Right Arrow to steer, W or Up to Nitro boost',
    badge: 'Real Supercar'
  },
  {
    id: 'FRUIT_SLICER',
    title: 'Fruit Blade Slicer',
    description: 'Slice flying watermelons, oranges, bananas, and coconuts with razor-sharp neon katana swipes while avoiding explosive bombs.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🍉',
    color: '#00ff66',
    controls: 'Click and drag mouse (or swipe finger) across flying fruits to slice',
    badge: 'Juicy Combos'
  },
  {
    id: 'KNIFE_HIT',
    title: 'Knife Hit Master',
    description: 'Throw glowing laser daggers into rotating logs and boss shields. Hit apples for bonus points and never overlap existing blades.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🎯',
    color: '#ffd600',
    controls: 'Click anywhere or tap Spacebar to throw dagger',
    badge: 'Boss Battles'
  },
  {
    id: 'SNAKE_GAME',
    title: 'Cyber Snake Arena',
    description: 'Classic slithering snake in a neon cyber arena. Eat glowing orbs, grow longer, avoid wall collisions, and beat high score records.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🐍',
    color: '#00ff66',
    controls: 'Arrow keys or WASD or On-Screen D-Pad to turn',
    badge: 'Classic Arcade'
  },
  {
    id: 'BRICK_BREAKER',
    title: 'Hyper Brick Breaker',
    description: 'Neon paddle & ball demolition! Smash tiered bricks, catch multi-ball laser drops, and clear colorful puzzle waves.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧱',
    color: '#00f3ff',
    controls: 'Move mouse or Left/Right arrows to control paddle',
    badge: 'Multi-Ball'
  },
  {
    id: 'PIANO_TILES',
    title: 'Grand Piano & Beats',
    description: 'Interactive grand keyboard simulator with song lesson autoplay, dynamic neon audio synthesizers, and fast-paced falling beat rush.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🎹',
    color: '#e040fb',
    controls: 'Tap piano keys with mouse, or use keyboard row (A,S,D,F,G,H,J,K)',
    badge: 'Music & Arcade'
  },
  {
    id: 'BUBBLE_SHOOTER',
    title: 'Bubble Shooter Arena',
    description: 'Aim and shoot matching colored bubbles to form clusters of 3 or more. Trigger massive bubble drops and clear the ceiling grid.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔮',
    color: '#ff3366',
    controls: 'Move mouse to aim trajectory line, Click to fire bubble',
    badge: 'Match-3'
  },

  // ==========================================
  // 4. NEW HIT CASUAL & ARCADE ADDITIONS
  // ==========================================
  {
    id: 'FLAPPY_BIRD',
    title: 'Cyber Flappy Drone',
    description: 'Flap cyber wings, dodge neon laser pipes, collect medals, and beat high score records!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🪶',
    color: '#00f3ff',
    controls: 'Click, Tap screen, or Spacebar to flap wings',
    badge: 'Viral Hit'
  },
  {
    id: 'SPACE_INVADERS',
    title: 'Retro Space Invaders',
    description: 'Classic neon arcade shooter! Marching alien squads, mystery UFOs, destructible bunkers, and laser blasts.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '👾',
    color: '#00ff66',
    controls: 'A/D or Arrows to move, Spacebar to fire laser',
    badge: 'Arcade Legend'
  },

  // ==========================================
  // 5. NEW PUZZLE & LOGIC ADDITIONS
  // ==========================================
  {
    id: 'SUDOKU',
    title: 'Neon Cyber Sudoku',
    description: 'Standard 9x9 logic puzzle grid with Easy, Medium, and Hard templates, pencil notes, and mistake tracker.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔢',
    color: '#ffd600',
    controls: 'Click cell and select 1-9 on numpad or keyboard',
    badge: 'Brain Logic'
  },
  {
    id: 'MATCH_3',
    title: 'Cyber Candy Match-3',
    description: 'Swap adjacent glowing candies, match 3+, unleash bombs & rainbow stars, and trigger gravity cascades!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🍬',
    color: '#ff007f',
    controls: 'Click a candy then click an adjacent candy to swap',
    badge: 'Juicy Combos'
  },
  {
    id: 'TETRIS',
    title: 'Tetris Block Arranger',
    description: 'The legendary block-falling arcade! Rotate tetrominoes, hold pieces, ghost drop, and clear lines.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🕹️',
    color: '#00f3ff',
    controls: 'Arrows / WASD to move & rotate, Spacebar to hard drop, C to hold',
    badge: 'All-Time Classic'
  },
  {
    id: 'MEMORY_MATCH',
    title: 'Cyber Memory Match',
    description: 'Flip glowing holographic cards, find matching pairs, build multiplier streaks, and test your memory!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧠',
    color: '#9d4edd',
    controls: 'Click to flip cards and match pairs',
    badge: 'Memory Test'
  },

  // ==========================================
  // 6. NEW BOARD & CARD ADDITIONS
  // ==========================================
  {
    id: 'SOLITAIRE',
    title: 'Klondike Solitaire',
    description: 'Classic 52-card solitaire! 7 tableau cascades, 4 foundation piles, draw stock, and auto-move.',
    category: GAME_CATEGORIES.BOARD,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '♠️',
    color: '#00e5ff',
    controls: 'Click / Double Click cards to move to tableaus or foundations',
    badge: 'Card Classic'
  },

  // ==========================================
  // 7. EDUCATIONAL & SKILL-BASED CHALLENGES
  // ==========================================
  {
    id: 'MATH_QUIZ',
    title: 'Speed Math Blitz',
    description: 'Rapid-fire mental arithmetic! Addition, Subtraction, Multiplication, and Mixed speed challenges in 60s.',
    category: GAME_CATEGORIES.EDUCATIONAL,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '➕',
    color: '#00ff66',
    controls: 'Click answer or press 1, 2, 3, 4 on keyboard',
    badge: 'Speed Math'
  },
  {
    id: 'WORD_SCRAMBLE',
    title: 'Cyber Word Scramble',
    description: 'Unscramble letters to solve tech, space, and gaming words before the clock runs out!',
    category: GAME_CATEGORIES.EDUCATIONAL,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔤',
    color: '#ffd600',
    controls: 'Type letters on keyboard or click letter tiles',
    badge: 'Word Puzzle'
  },
  {
    id: 'TYPING_TEST',
    title: 'Hacker Typing Speed Test',
    description: 'Test your typing speed and accuracy live! Real-time WPM gauge, accuracy %, and developer passages.',
    category: GAME_CATEGORIES.EDUCATIONAL,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '⌨️',
    color: '#00f3ff',
    controls: 'Type on your keyboard to test WPM and accuracy',
    badge: 'WPM Speed'
  },
  {
    id: 'CODING_PUZZLE',
    title: 'Code Quest Puzzles',
    description: 'Gamified HTML, CSS, and JavaScript challenges with interactive code editor and instant unit test suite!',
    category: GAME_CATEGORIES.EDUCATIONAL,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '💻',
    color: '#00e676',
    controls: 'Edit code in editor and click Run & Test',
    badge: 'HTML/CSS/JS'
  }
];

export const ACHIEVEMENTS_DATA = [
  // Board & Classics Achievements
  { key: 'CHESS_GRANDMASTER_WIN', title: 'Grandmaster Tactician', description: 'Win a full chess match against the AI or human player.', points: 150, icon: '♟️' },
  { key: 'POOL_8BALL_WIN', title: 'Pool Shark Master', description: 'Pocket the 8-ball and win an 8-Ball Pool match.', points: 150, icon: '🎱' },
  { key: 'UNO_MATCH_WIN', title: 'UNO Champion', description: 'Play your final card and win a match of UNO!', points: 150, icon: '🃏' },
  { key: 'LUDO_ROYAL_VICTORY', title: 'Kingdom Crown', description: 'Lead all 4 tokens into the royal center home triangle in Ludo.', points: 150, icon: '👑' },
  { key: 'SNAKE_LADDER_WIN', title: 'Ladder Climber', description: 'Reach tile 100 first in Snakes & Ladders 3D.', points: 100, icon: '🎲' },
  { key: 'TTT_FIRST_WIN', title: 'Triple Threat', description: 'Win a Tic-Tac-Toe match with 3 in a row.', points: 50, icon: '❌' },
  { key: 'C4_FIRST_WIN', title: 'Gravity Master', description: 'Connect four colored tokens in a line.', points: 75, icon: '🔴' },
  { key: 'CARROM_QUEEN_COVER', title: 'Carrom Monarch', description: 'Pocket the Queen and cover it with a carrom coin.', points: 100, icon: '🎯' },

  // Puzzle Achievements
  { key: 'WORDLE_SOLVED', title: 'Lexicon Prodigy', description: 'Deduce the secret 5-letter word in Wordle Nexus.', points: 100, icon: '📝' },
  { key: '2048_VICTORY', title: 'Fusion Reactor', description: 'Merge tiles to create the 2048 neon block.', points: 200, icon: '🔢' },
  { key: 'MINE_CLEAR_EASY', title: 'Bomb Technician', description: 'Clear a minefield without detonating any cyber mines.', points: 100, icon: '💣' },
  { key: 'BLOCK_MULTI_CLEAR', title: 'Jewel Overload', description: 'Score 300+ points placing blocks in Block Puzzle 10x10.', points: 100, icon: '🧱' },

  // Action & CrazyGames Achievements
  { key: 'SNIPER_ROOFTOP_WIN', title: 'Rooftop Legend', description: 'Win a 2-Player or AI Rooftop Sniper duel.', points: 150, icon: '🎯' },
  { key: 'SLOPE_SCORE_1000', title: 'Slope Master', description: 'Survive 1000+ meters in Slope 3D Neon Runner.', points: 150, icon: '🌐' },
  { key: 'SOCCER_PHYSICS_WIN', title: 'Golden Boot', description: 'Score 5 goals and win a Soccer Physics match.', points: 150, icon: '⚽' },
  { key: 'TANK_WAR_WIN', title: 'Tank Commander', description: 'Win a 2-Player or AI Retro Tank Battle duel.', points: 150, icon: '💥' },
  { key: 'PONG_SHUTOUT', title: 'Neon Paddle Master', description: 'Win a match in Retro Neon Pong.', points: 100, icon: '🏓' },
  { key: 'HOCKEY_WIN_MASTER', title: 'Air Hockey Ace', description: 'Score 7 goals and win a Glow Air Hockey match.', points: 100, icon: '⚡' },
  { key: 'RACER_SCORE_1000', title: 'Speed Demon', description: 'Survive and score 1000+ meters in Cyber Highway Racer.', points: 100, icon: '🏎️' },
  { key: 'FRUIT_COMBO_5X', title: 'Blade Master', description: 'Score 500+ points slicing flying fruits.', points: 100, icon: '🍉' },
  { key: 'KNIFE_STAGE_CLEAR', title: 'Bullseye Assassin', description: 'Clear 5 stages of spinning logs in Knife Hit Master.', points: 100, icon: '🎯' },
  { key: 'SNAKE_SCORE_100', title: 'Arena Apex', description: 'Grow your cyber snake to 100+ points in Snake Arena.', points: 75, icon: '🐍' },
  { key: 'BRICK_SCORE_500', title: 'Demolition Legend', description: 'Score 500+ points destroying neon bricks.', points: 100, icon: '🧱' },
  { key: 'PIANO_TILES_100', title: 'Virtuoso Maestro', description: 'Tap 100+ piano keys in Grand Piano & Beats.', points: 100, icon: '🎹' },
  { key: 'BUBBLE_CLEAR_BOARD', title: 'Orb Nova', description: 'Score 300+ points popping match-3 bubble orbs.', points: 100, icon: '🔮' }
];
