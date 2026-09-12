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
  {
    id: 'WATERMELON_MERGE',
    title: 'Suika Watermelon Merge',
    description: 'The worldwide viral fruit merge sensation! Drop juicy fruits, merge matching pairs with bouncy 2D physics, trigger combo chains, and create the legendary Giant Watermelon.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🍉',
    color: '#00e676',
    controls: 'Desktop: Mouse move to aim & click to drop (or Left/Right + Space) | Mobile: Drag finger & release to drop',
    badge: 'Trending Viral Hit'
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
  },

  // ==========================================
  // 8. NEW ARCADE & EXPANSION GAMES (8 Games)
  // ==========================================
  {
    id: 'CRICKET_CHALLENGE',
    title: 'Cyber Cricket Batting Pro',
    description: 'Timing-based cricket batting challenge! Hit pace, inswing, and yorkers for 1, 4, or massive 6 runs with crowd cheers and scoreboard.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🏏',
    color: '#00ff66',
    controls: 'Tap SWING button or press Spacebar to hit ball',
    badge: 'Crowd Cheers'
  },
  {
    id: 'PENALTY_SHOOTOUT',
    title: 'Football Penalty Shootout',
    description: 'Penalty shootout against smart reactive goalkeeper AI! Choose shot aim, charge power bar, curve the ball, and score goals.',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '⚽',
    color: '#ffd600',
    controls: 'Tap KICK or Spacebar to lock Aim and Power',
    badge: 'Goalkeeper AI'
  },
  {
    id: 'CIRCUIT_RACER',
    title: 'Neon Grand Prix Circuit',
    description: 'Circuit racing with tire smoke drift mechanics, speed boost pads, turbo power-ups, lap timers, and AI rival racers!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🏎️',
    color: '#e040fb',
    controls: 'WASD / Arrows to drive, Space to Drift, E to use power-up',
    badge: 'Drift & Boost'
  },
  {
    id: 'ADVENTURE_PLATFORMER',
    title: 'Cyber Ninja Platformer',
    description: 'Side-scrolling 2D adventure platformer! Double jump, wall kick, collect coins, activate checkpoints, and defeat Goliath Mech Boss!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🗡️',
    color: '#ff007f',
    controls: 'A/D or Arrows to move, W to jump, Space to slash, K to shoot',
    badge: 'Boss Battles'
  },
  {
    id: 'TRIVIA_QUIZ',
    title: 'Cyber Trivia Quiz Show',
    description: 'Multiplayer party trivia quiz! Bollywood, Sports, Science, and Tech questions with real buzzer system for 1-4 players!',
    category: GAME_CATEGORIES.EDUCATIONAL,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🎤',
    color: '#ffd600',
    controls: 'Hit Buzzer (Q, P, Z, M or Space), then choose 1-4 option',
    badge: 'Party Buzzer'
  },
  {
    id: 'DOODLE_GUESS',
    title: 'Cyber Doodle & Guess',
    description: 'Pictionary-style real-time drawing and guessing! Draw prompts on canvas while bots guess, or guess what the AI is sketching!',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎲',
    color: '#00f3ff',
    controls: 'Draw on canvas with mouse/touch, or type guesses in chat',
    badge: 'Pictionary Draw'
  },
  {
    id: 'JIGSAW_PUZZLE',
    title: 'Cyber Jigsaw Puzzle',
    description: 'Interlocking jigsaw puzzle with magnetic piece snap, ghost preview hints, 3x3 to 5x5 difficulties, and glowing neon artworks.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🧩',
    color: '#00ff66',
    controls: 'Click piece from tray and click target board slot to snap',
    badge: 'Magnetic Snap'
  },
  {
    id: 'CROSSWORD_PUZZLE',
    title: 'Cyber Crossword Challenge',
    description: 'Interactive cyber crossword grid with across and down clue panels, keyboard typing, hint reveals, and puzzle validation.',
    category: GAME_CATEGORIES.PUZZLE,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '📰',
    color: '#00e5ff',
    controls: 'Click cell and type letters on keyboard, use arrow keys',
    badge: 'Brain Logic'
  },
  {
    id: 'BEAT_RHYTHM',
    title: 'Cyber Beat Mania',
    description: '4-Lane rhythm music game! Press D, F, J, K in sync with synthesized Bollywood EDM and synthwave tracks to build massive fever combos!',
    category: GAME_CATEGORIES.ACTION,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🎶',
    color: '#e040fb',
    controls: 'Tap D, F, J, K keys (or on-screen lane buttons) as notes hit strike line',
    badge: 'Rhythm Fever'
  }
];

export const ACHIEVEMENTS_DATA = [
  // Board & Classics Achievements
  { key: 'CHESS_GRANDMASTER_WIN', gameKey: 'CHESS', title: 'Grandmaster Tactician', description: 'Win a full chess match against the AI or human player.', desc: 'Win a full chess match against the AI or human player.', points: 150, icon: '♟️' },
  { key: 'POOL_8BALL_WIN', gameKey: 'EIGHT_BALL_POOL', title: 'Pool Shark Master', description: 'Pocket the 8-ball and win an 8-Ball Pool match.', desc: 'Pocket the 8-ball and win an 8-Ball Pool match.', points: 150, icon: '🎱' },
  { key: 'UNO_MATCH_WIN', gameKey: 'UNO', title: 'UNO Champion', description: 'Play your final card and win a match of UNO!', desc: 'Play your final card and win a match of UNO!', points: 150, icon: '🃏' },
  { key: 'LUDO_ROYAL_VICTORY', gameKey: 'LUDO', title: 'Kingdom Crown', description: 'Lead all 4 tokens into the royal center home triangle in Ludo.', desc: 'Lead all 4 tokens into the royal center home triangle in Ludo.', points: 150, icon: '👑' },
  { key: 'SNAKE_LADDER_WIN', gameKey: 'SNAKE', title: 'Ladder Climber', description: 'Reach tile 100 first in Snakes & Ladders 3D.', desc: 'Reach tile 100 first in Snakes & Ladders 3D.', points: 100, icon: '🎲' },
  { key: 'TTT_FIRST_WIN', gameKey: 'TIC_TAC_TOE', title: 'Triple Threat', description: 'Win a Tic-Tac-Toe match with 3 in a row.', desc: 'Win a Tic-Tac-Toe match with 3 in a row.', points: 50, icon: '❌' },
  { key: 'C4_FIRST_WIN', gameKey: 'CONNECT_4', title: 'Gravity Master', description: 'Connect four colored tokens in a line.', desc: 'Connect four colored tokens in a line.', points: 75, icon: '🔴' },
  { key: 'CARROM_QUEEN_COVER', gameKey: 'CARROM', title: 'Carrom Monarch', description: 'Pocket the Queen and cover it with a carrom coin.', desc: 'Pocket the Queen and cover it with a carrom coin.', points: 100, icon: '🎯' },
  { key: 'SOLITAIRE_FOUNDATION_KING', gameKey: 'SOLITAIRE', title: 'Patience Monarch', description: 'Complete a full Klondike Solitaire game into foundations.', desc: 'Complete a full Klondike Solitaire game into foundations.', points: 150, icon: '♠️' },

  // Puzzle Achievements
  { key: 'WORDLE_SOLVED', gameKey: 'WORDLE', title: 'Lexicon Prodigy', description: 'Deduce the secret 5-letter word in Wordle Nexus.', desc: 'Deduce the secret 5-letter word in Wordle Nexus.', points: 100, icon: '📝' },
  { key: '2048_VICTORY', gameKey: 'GAME_2048', title: 'Fusion Reactor', description: 'Merge tiles to create the 2048 neon block.', desc: 'Merge tiles to create the 2048 neon block.', points: 200, icon: '🔢' },
  { key: 'MINE_CLEAR_EASY', gameKey: 'MINESWEEPER', title: 'Bomb Technician', description: 'Clear a minefield without detonating any cyber mines.', desc: 'Clear a minefield without detonating any cyber mines.', points: 100, icon: '💣' },
  { key: 'BLOCK_MULTI_CLEAR', gameKey: 'BLOCK_PUZZLE', title: 'Jewel Overload', description: 'Score 300+ points placing blocks in Block Puzzle 10x10.', desc: 'Score 300+ points placing blocks in Block Puzzle 10x10.', points: 100, icon: '🧱' },
  { key: 'SUDOKU_LOGIC_MASTER', gameKey: 'SUDOKU', title: 'Sudoku Savant', description: 'Solve a full 9x9 Cyber Sudoku puzzle.', desc: 'Solve a full 9x9 Cyber Sudoku puzzle.', points: 150, icon: '🔢' },
  { key: 'MATCH3_SWEET_VICTORY', gameKey: 'MATCH_3', title: 'Candy Crusher', description: 'Reach target score and trigger cascades in Cyber Candy Match-3.', desc: 'Reach target score and trigger cascades in Cyber Candy Match-3.', points: 100, icon: '🍬' },
  { key: 'TETRIS_LINE_MASTER', gameKey: 'TETRIS', title: 'Tetromino Architect', description: 'Clear lines and score points in Tetris.', desc: 'Clear lines and score points in Tetris.', points: 150, icon: '🕹️' },
  { key: 'MEMORY_GRID_CLEAR', gameKey: 'MEMORY_MATCH', title: 'Neural Matrix', description: 'Match all card pairs and clear the holographic memory grid.', desc: 'Match all card pairs and clear the holographic memory grid.', points: 100, icon: '🧠' },

  // Action & CrazyGames Achievements
  { key: 'SNIPER_ROOFTOP_WIN', gameKey: 'ROOFTOP_SNIPERS', title: 'Rooftop Legend', description: 'Win a 2-Player or AI Rooftop Sniper duel.', desc: 'Win a 2-Player or AI Rooftop Sniper duel.', points: 150, icon: '🎯' },
  { key: 'SLOPE_SCORE_1000', gameKey: 'SLOPE_3D', title: 'Slope Master', description: 'Survive 1000+ meters in Slope 3D Neon Runner.', desc: 'Survive 1000+ meters in Slope 3D Neon Runner.', points: 150, icon: '🌐' },
  { key: 'SOCCER_PHYSICS_WIN', gameKey: 'SOCCER_PHYSICS', title: 'Golden Boot', description: 'Score 5 goals and win a Soccer Physics match.', desc: 'Score 5 goals and win a Soccer Physics match.', points: 150, icon: '⚽' },
  { key: 'TANK_WAR_WIN', gameKey: 'TANK_BATTLE', title: 'Tank Commander', description: 'Win a 2-Player or AI Retro Tank Battle duel.', desc: 'Win a 2-Player or AI Retro Tank Battle duel.', points: 150, icon: '💥' },
  { key: 'PONG_SHUTOUT', gameKey: 'PONG', title: 'Neon Paddle Master', description: 'Win a match in Retro Neon Pong.', desc: 'Win a match in Retro Neon Pong.', points: 100, icon: '🏓' },
  { key: 'HOCKEY_WIN_MASTER', gameKey: 'AIR_HOCKEY', title: 'Air Hockey Ace', description: 'Score 7 goals and win a Glow Air Hockey match.', desc: 'Score 7 goals and win a Glow Air Hockey match.', points: 100, icon: '⚡' },
  { key: 'RACER_SCORE_1000', gameKey: 'CYBER_RACER', title: 'Speed Demon', description: 'Survive and score 1000+ meters in Cyber Highway Racer.', desc: 'Survive and score 1000+ meters in Cyber Highway Racer.', points: 100, icon: '🏎️' },
  { key: 'FRUIT_COMBO_5X', gameKey: 'FRUIT_SLICER', title: 'Blade Master', description: 'Score 500+ points slicing flying fruits.', desc: 'Score 500+ points slicing flying fruits.', points: 100, icon: '🍉' },
  { key: 'KNIFE_STAGE_CLEAR', gameKey: 'KNIFE_HIT', title: 'Bullseye Assassin', description: 'Clear 5 stages of spinning logs in Knife Hit Master.', desc: 'Clear 5 stages of spinning logs in Knife Hit Master.', points: 100, icon: '🎯' },
  { key: 'SNAKE_SCORE_100', gameKey: 'SNAKE_GAME', title: 'Arena Apex', description: 'Grow your cyber snake to 100+ points in Snake Arena.', desc: 'Grow your cyber snake to 100+ points in Snake Arena.', points: 75, icon: '🐍' },
  { key: 'BRICK_SCORE_500', gameKey: 'BRICK_BREAKER', title: 'Demolition Legend', description: 'Score 500+ points destroying neon bricks.', desc: 'Score 500+ points destroying neon bricks.', points: 100, icon: '🧱' },
  { key: 'PIANO_TILES_100', gameKey: 'PIANO_TILES', title: 'Virtuoso Maestro', description: 'Tap 100+ piano keys in Grand Piano & Beats.', desc: 'Tap 100+ piano keys in Grand Piano & Beats.', points: 100, icon: '🎹' },
  { key: 'BUBBLE_CLEAR_BOARD', gameKey: 'BUBBLE_SHOOTER', title: 'Orb Nova', description: 'Score 300+ points popping match-3 bubble orbs.', desc: 'Score 300+ points popping match-3 bubble orbs.', points: 100, icon: '🔮' },
  { key: 'FLAPPY_SKY_HIGH', gameKey: 'FLAPPY_BIRD', title: 'Laser Aviator', description: 'Score 10+ points navigating pipes in Cyber Flappy Drone.', desc: 'Score 10+ points navigating pipes in Cyber Flappy Drone.', points: 100, icon: '🪶' },
  { key: 'INVADERS_WAVE_CLEAR', gameKey: 'SPACE_INVADERS', title: 'Earth Defender', description: 'Clear alien waves and defend earth in Retro Space Invaders.', desc: 'Clear alien waves and defend earth in Retro Space Invaders.', points: 150, icon: '👾' },

  // Educational Achievements
  { key: 'MATH_BLITZ_GENIUS', gameKey: 'MATH_QUIZ', title: 'Calculus Prodigy', description: 'Score 500+ points in Speed Math Blitz arithmetic.', desc: 'Score 500+ points in Speed Math Blitz arithmetic.', points: 100, icon: '➕' },
  { key: 'SCRAMBLE_LEXICON_ACE', gameKey: 'WORD_SCRAMBLE', title: 'Anagram Decoder', description: 'Unscramble all words in Cyber Word Scramble.', desc: 'Unscramble all words in Cyber Word Scramble.', points: 100, icon: '🔤' },
  { key: 'TYPING_SPEED_DEMON', gameKey: 'TYPING_TEST', title: 'Cyber Typer 50+ WPM', description: 'Achieve 50+ WPM with high accuracy in Typing Speed Test.', desc: 'Achieve 50+ WPM with high accuracy in Typing Speed Test.', points: 150, icon: '⌨️' },
  { key: 'CODE_QUEST_COMPLETER', gameKey: 'CODING_PUZZLE', title: 'Fullstack Cyber Coder', description: 'Solve all HTML, CSS, and JS code challenges.', desc: 'Solve all HTML, CSS, and JS code challenges.', points: 200, icon: '💻' },
  { key: 'TRIVIA_BUZZER_GENIUS', gameKey: 'TRIVIA_QUIZ', title: 'Mastermind Champion', description: 'Win a full trivia quiz show with top score.', desc: 'Win a full trivia quiz show with top score.', points: 150, icon: '🎤' },

  // New Expansion Achievements
  { key: 'CRICKET_SIXER_BLITZ', gameKey: 'CRICKET_CHALLENGE', title: 'Maximum Sixer King', description: 'Hit 25+ runs in a cricket batting innings.', desc: 'Hit 25+ runs in a cricket batting innings.', points: 150, icon: '🏏' },
  { key: 'PENALTY_HERO_WIN', gameKey: 'PENALTY_SHOOTOUT', title: 'Golden Glove Striker', description: 'Win a 5-round penalty shootout duel.', desc: 'Win a 5-round penalty shootout duel.', points: 150, icon: '⚽' },
  { key: 'CIRCUIT_DRIFT_CHAMP', gameKey: 'CIRCUIT_RACER', title: 'Drift Grandmaster', description: 'Complete a 3-lap circuit race in 1st place.', desc: 'Complete a 3-lap circuit race in 1st place.', points: 150, icon: '🏎️' },
  { key: 'PLATFORMER_GOLIATH_DOWN', gameKey: 'ADVENTURE_PLATFORMER', title: 'Titan Slayer', description: 'Defeat Titan Goliath Mech Boss in the Cyber Citadel.', desc: 'Defeat Titan Goliath Mech Boss in the Cyber Citadel.', points: 200, icon: '🗡️' },
  { key: 'DOODLE_GUESS_PRODIGY', gameKey: 'DOODLE_GUESS', title: 'Picasso Detective', description: 'Correctly guess secret drawings in record time.', desc: 'Correctly guess secret drawings in record time.', points: 100, icon: '🎲' },
  { key: 'JIGSAW_SNAP_SPEED', gameKey: 'JIGSAW_PUZZLE', title: 'Mosaic Virtuoso', description: 'Snap all pieces of a jigsaw puzzle into place.', desc: 'Snap all pieces of a jigsaw puzzle into place.', points: 100, icon: '🧩' },
  { key: 'CROSSWORD_SOLVED', gameKey: 'CROSSWORD_PUZZLE', title: 'Cyber Lexicographer', description: 'Fully decode and solve a cyber crossword puzzle.', desc: 'Fully decode and solve a cyber crossword puzzle.', points: 150, icon: '📰' },
  { key: 'RHYTHM_FEVER_COMBO', gameKey: 'BEAT_RHYTHM', title: 'Rhythm God', description: 'Achieve a 50+ note combo streak in Cyber Beat Mania.', desc: 'Achieve a 50+ note combo streak in Cyber Beat Mania.', points: 150, icon: '🎶' }
];
