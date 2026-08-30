// RoomManager.js - Master Game State & Logic Engine for Arcade Nexus Games

const LUDO_COLORS = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
const LUDO_START_INDICES = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const LUDO_SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];
const LUDO_GOAL_STEP = 56;
const MEMORY_ICONS = ['⚡', '🚀', '💎', '👑', '🎯', '🔥', '🕹️', '👾'];

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerToRoom = new Map();

    this.winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  generateSnakesAndLadders() {
    const occupied = new Set([1, 100]);
    const ladders = {};
    const snakes = {};

    const ladderTiers = [
      { minStart: 3, maxStart: 15, minSpan: 15, maxSpan: 28 },
      { minStart: 12, maxStart: 25, minSpan: 20, maxSpan: 36 },
      { minStart: 24, maxStart: 38, minSpan: 18, maxSpan: 34 },
      { minStart: 36, maxStart: 50, minSpan: 18, maxSpan: 32 },
      { minStart: 50, maxStart: 65, minSpan: 15, maxSpan: 28 },
      { minStart: 62, maxStart: 75, minSpan: 12, maxSpan: 22 },
      { minStart: 72, maxStart: 82, minSpan: 10, maxSpan: 16 }
    ];

    const snakeTiers = [
      { minHead: 25, maxHead: 38, minDrop: 14, maxDrop: 22 },
      { minHead: 38, maxHead: 52, minDrop: 16, maxDrop: 30 },
      { minHead: 50, maxHead: 65, minDrop: 18, maxDrop: 34 },
      { minHead: 64, maxHead: 78, minDrop: 18, maxDrop: 34 },
      { minHead: 75, maxHead: 88, minDrop: 20, maxDrop: 40 },
      { minHead: 85, maxHead: 95, minDrop: 25, maxDrop: 48 },
      { minHead: 96, maxHead: 99, minDrop: 35, maxDrop: 65 }
    ];

    for (const tier of ladderTiers) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const start = Math.floor(Math.random() * (tier.maxStart - tier.minStart + 1)) + tier.minStart;
        const span = Math.floor(Math.random() * (tier.maxSpan - tier.minSpan + 1)) + tier.minSpan;
        const end = start + span;
        if (end <= 98 && !occupied.has(start) && !occupied.has(end)) {
          occupied.add(start);
          occupied.add(end);
          ladders[start] = end;
          break;
        }
      }
    }

    for (const tier of snakeTiers) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const head = Math.floor(Math.random() * (tier.maxHead - tier.minHead + 1)) + tier.minHead;
        const drop = Math.floor(Math.random() * (tier.maxDrop - tier.minDrop + 1)) + tier.minDrop;
        const tail = head - drop;
        if (tail >= 2 && !occupied.has(head) && !occupied.has(tail)) {
          occupied.add(head);
          occupied.add(tail);
          snakes[head] = tail;
          break;
        }
      }
    }

    return { ladders, snakes };
  }

  generateMemoryDeck() {
    const deck = [];
    MEMORY_ICONS.forEach((icon, idx) => {
      deck.push({ id: idx * 2, icon, pairId: idx });
      deck.push({ id: idx * 2 + 1, icon, pairId: idx });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  initGameRoomState(room) {
    const type = room.gameType;

    if (type === 'TIC_TAC_TOE') {
      room.grid = Array(9).fill(null);
    } else if (type === 'CONNECT_4') {
      room.grid = Array(42).fill(null);
    } else if (type === 'PONG') {
      room.paddle1 = 50;
      room.paddle2 = 50;
      room.score1 = 0;
      room.score2 = 0;
      room.targetScore = 7;
    } else if (type === 'MEMORY_MATCH') {
      room.deck = this.generateMemoryDeck();
      room.flippedCards = [];
      room.matchedPairs = [];
      room.scores = {};
      room.players.forEach(p => { room.scores[p.socketId] = 0; });
    } else if (type === 'SNAKE') {
      room.snakesAndLadders = this.generateSnakesAndLadders();
      room.lastRoll = null;
    } else if (type === 'CHESS') {
      room.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      room.lastMove = null;
    } else if (type === 'LUDO') {
      room.lastRoll = null;
      room.consecutiveSixes = 0;
      room.waitingForTokenChoice = false;
      room.movableTokens = [];
    }
  }

  createRoom(hostSocketId, hostUser, gameType = 'TIC_TAC_TOE', maxPlayers = 2) {
    const roomId = this.generateRoomCode();
    const totalPlayersAllowed = (gameType === 'LUDO' || gameType === 'SNAKE') ? Math.min(Math.max(maxPlayers, 2), 4) : 2;

    const room = {
      id: roomId,
      hostId: hostUser.id,
      status: 'WAITING',
      gameType,
      isSinglePlayer: false,
      maxPlayers: totalPlayersAllowed,
      currentTurn: hostSocketId,
      winner: null,
      rankings: [],
      players: [
        this.createPlayerObj(hostSocketId, hostUser, gameType, 0, 'X')
      ]
    };

    this.initGameRoomState(room);
    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostSocketId, roomId);

    return room;
  }

  createSinglePlayerRoom(hostSocketId, hostUser, gameType = 'TIC_TAC_TOE', maxPlayers = 2) {
    const roomId = this.generateRoomCode();
    const totalPlayers = (gameType === 'LUDO' || gameType === 'SNAKE') ? Math.min(Math.max(maxPlayers, 2), 4) : 2;

    const players = [
      this.createPlayerObj(hostSocketId, hostUser, gameType, 0, 'X')
    ];

    for (let i = 1; i < totalPlayers; i++) {
      players.push(
        this.createPlayerObj(
          `BOT_${roomId}_${i}`,
          { id: `bot_${i}`, username: `Nexus AI Bot ${i > 1 ? i : ''}`.trim() },
          gameType,
          i,
          i === 1 ? 'O' : `P${i + 1}`
        )
      );
    }

    const room = {
      id: roomId,
      hostId: hostUser.id,
      status: 'PLAYING',
      gameType,
      isSinglePlayer: true,
      maxPlayers: totalPlayers,
      currentTurn: hostSocketId,
      winner: null,
      rankings: [],
      players
    };

    this.initGameRoomState(room);
    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostSocketId, roomId);

    return room;
  }

  createPlayerObj(socketId, user, gameType, colorIndex, symbol) {
    const color = LUDO_COLORS[colorIndex % 4];
    const player = {
      socketId,
      userId: user ? user.id : 'anon',
      username: user ? user.username : 'Player',
      color,
      colorIndex,
      symbol: symbol || (colorIndex === 0 ? 'X' : 'O'),
      score: 0,
      hasWon: false
    };

    if (gameType === 'SNAKE') {
      player.position = 1;
    } else if (gameType === 'LUDO') {
      player.tokens = [
        { id: 0, step: -1, finished: false },
        { id: 1, step: -1, finished: false },
        { id: 2, step: -1, finished: false },
        { id: 3, step: -1, finished: false }
      ];
    }

    return player;
  }

  joinRoom(roomId, socketId, user) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Game already in progress');
    if (room.players.length >= room.maxPlayers) throw new Error('Room is full');

    const nextIndex = room.players.length;
    const newPlayer = this.createPlayerObj(
      socketId,
      user,
      room.gameType,
      nextIndex,
      nextIndex === 1 ? 'O' : `P${nextIndex + 1}`
    );

    room.players.push(newPlayer);
    this.playerToRoom.set(socketId, roomId);

    if (room.players.length === room.maxPlayers) {
      room.status = 'PLAYING';
    }

    return room;
  }

  leaveRoom(socketId) {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.socketId !== socketId);
    this.playerToRoom.delete(socketId);

    if (room.players.length === 0 || room.players.every(p => p.socketId.startsWith('BOT_'))) {
      this.rooms.delete(roomId);
      return { roomId, deleted: true };
    }

    if (room.status === 'PLAYING') {
      room.status = 'FINISHED';
      room.winner = room.players[0].socketId;
    }

    return { roomId, room, deleted: false };
  }

  getRoomBySocket(socketId) {
    const roomId = this.playerToRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  // ==========================================
  // GAME LOGIC: TIC-TAC-TOE
  // ==========================================
  makeMove(roomId, index, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'TIC_TAC_TOE') throw new Error('Invalid game room');
    if (room.status !== 'PLAYING') throw new Error('Game is not in progress');
    if (room.currentTurn !== socketId) throw new Error('Not your turn');
    if (room.grid[index] !== null) throw new Error('Cell already taken');

    const player = room.players.find(p => p.socketId === socketId);
    room.grid[index] = player.symbol || (room.players.indexOf(player) === 0 ? 'X' : 'O');

    const winnerSymbol = this.checkTicTacToeWin(room.grid);
    if (winnerSymbol) {
      room.status = 'FINISHED';
      room.winner = socketId;
    } else if (room.grid.every(cell => cell !== null)) {
      room.status = 'FINISHED';
      room.winner = 'DRAW';
    } else {
      const nextPlayer = room.players.find(p => p.socketId !== socketId);
      room.currentTurn = nextPlayer ? nextPlayer.socketId : null;
    }

    return room;
  }

  checkTicTacToeWin(grid) {
    for (const pattern of this.winPatterns) {
      const [a, b, c] = pattern;
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return grid[a];
      }
    }
    return null;
  }

  getBestTicTacToeMove(grid) {
    const available = grid.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (available.length === 0) return null;

    for (const idx of available) {
      grid[idx] = 'O';
      if (this.checkTicTacToeWin(grid) === 'O') {
        grid[idx] = null;
        return idx;
      }
      grid[idx] = null;
    }

    for (const idx of available) {
      grid[idx] = 'X';
      if (this.checkTicTacToeWin(grid) === 'X') {
        grid[idx] = null;
        return idx;
      }
      grid[idx] = null;
    }

    if (grid[4] === null) return 4;
    return available[Math.floor(Math.random() * available.length)];
  }

  // ==========================================
  // GAME LOGIC: SNAKES & LADDERS (Board Race)
  // ==========================================
  rollDiceSnake(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'SNAKE') return null;
    if (room.status !== 'PLAYING') return null;
    if (room.currentTurn !== socketId) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    const rollValue = Math.floor(Math.random() * 6) + 1;
    const initialPos = player.position || 1;
    let targetPos = initialPos + rollValue;
    let finalPos = targetPos;
    let eventType = 'NORMAL';

    if (targetPos > 100) {
      targetPos = initialPos;
      finalPos = initialPos;
      eventType = 'OVERSHOOT';
    } else {
      if (room.snakesAndLadders.ladders[targetPos]) {
        finalPos = room.snakesAndLadders.ladders[targetPos];
        eventType = 'LADDER';
      } else if (room.snakesAndLadders.snakes[targetPos]) {
        finalPos = room.snakesAndLadders.snakes[targetPos];
        eventType = 'SNAKE';
      }
    }

    player.position = finalPos;

    room.lastRoll = {
      socketId,
      username: player.username,
      value: rollValue,
      initialPos,
      targetPos,
      finalPos,
      eventType
    };

    if (finalPos === 100) {
      player.hasWon = true;
      room.status = 'FINISHED';
      room.winner = socketId;
      return room;
    }

    const currentIndex = room.players.findIndex(p => p.socketId === socketId);
    const nextPlayer = room.players[(currentIndex + 1) % room.players.length];
    room.currentTurn = nextPlayer.socketId;

    return room;
  }

  // ==========================================
  // GAME LOGIC: LUDO KINGDOM (3D Royal Pawns)
  // ==========================================
  rollDiceLudo(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'LUDO') return null;
    if (room.status !== 'PLAYING') return null;
    if (room.currentTurn !== socketId) return null;
    if (room.waitingForTokenChoice) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    const roll = Math.floor(Math.random() * 6) + 1;

    if (roll === 6) room.consecutiveSixes += 1;
    else room.consecutiveSixes = 0;

    room.lastRoll = { socketId, username: player.username, value: roll };

    if (room.consecutiveSixes === 3) {
      room.consecutiveSixes = 0;
      this.advanceLudoTurn(room);
      return room;
    }

    const movableTokens = [];
    player.tokens.forEach(token => {
      if (token.finished) return;
      if (token.step === -1 && roll === 6) movableTokens.push(token.id);
      else if (token.step >= 0 && token.step + roll <= LUDO_GOAL_STEP) movableTokens.push(token.id);
    });

    if (movableTokens.length === 0) {
      if (roll === 6 && room.consecutiveSixes < 3) {
        // Keeps turn
      } else {
        this.advanceLudoTurn(room);
      }
    } else if (movableTokens.length === 1) {
      return this.moveLudoToken(roomId, socketId, movableTokens[0]);
    } else {
      room.waitingForTokenChoice = true;
      room.movableTokens = movableTokens;
    }

    return room;
  }

  moveLudoToken(roomId, socketId, tokenId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'LUDO') return null;
    if (room.currentTurn !== socketId) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    const token = player.tokens.find(t => t.id === tokenId);
    if (!token) return null;

    const roll = room.lastRoll ? room.lastRoll.value : 0;
    let extraTurn = roll === 6;

    if (token.step === -1 && roll === 6) {
      token.step = 0;
    } else if (token.step >= 0 && token.step + roll <= LUDO_GOAL_STEP) {
      token.step += roll;
      if (token.step === LUDO_GOAL_STEP) {
        token.finished = true;
        extraTurn = true;
      }
    }

    room.waitingForTokenChoice = false;
    room.movableTokens = [];

    if (player.tokens.every(t => t.finished)) {
      player.hasWon = true;
      room.status = 'FINISHED';
      room.winner = socketId;
      return room;
    }

    if (!extraTurn) {
      this.advanceLudoTurn(room);
    }

    return room;
  }

  advanceLudoTurn(room) {
    room.consecutiveSixes = 0;
    room.waitingForTokenChoice = false;
    room.movableTokens = [];
    const currentIndex = room.players.findIndex(p => p.socketId === room.currentTurn);
    const nextPlayer = room.players[(currentIndex + 1) % room.players.length];
    room.currentTurn = nextPlayer.socketId;
  }

  // ==========================================
  // GAME LOGIC: CONNECT-4
  // ==========================================
  makeConnect4Move(roomId, col, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'CONNECT_4') throw new Error('Invalid Connect4 room');
    if (room.status !== 'PLAYING') throw new Error('Game not in progress');
    if (room.currentTurn !== socketId) throw new Error('Not your turn');

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    const disc = playerIndex === 0 ? 'RED' : 'YELLOW';

    let placedRow = -1;
    for (let r = 5; r >= 0; r--) {
      const idx = r * 7 + col;
      if (room.grid[idx] === null) {
        room.grid[idx] = disc;
        placedRow = r;
        break;
      }
    }

    if (placedRow === -1) throw new Error('Column is full');

    if (this.checkConnect4Win(room.grid, disc)) {
      room.status = 'FINISHED';
      room.winner = socketId;
    } else if (room.grid.every(cell => cell !== null)) {
      room.status = 'FINISHED';
      room.winner = 'DRAW';
    } else {
      const nextPlayer = room.players.find(p => p.socketId !== socketId);
      room.currentTurn = nextPlayer ? nextPlayer.socketId : null;
    }

    return room;
  }

  checkConnect4Win(grid, disc) {
    const rows = 6;
    const cols = 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (grid[r * cols + c] === disc && grid[r * cols + c + 1] === disc && grid[r * cols + c + 2] === disc && grid[r * cols + c + 3] === disc) return true;
      }
    }
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r * cols + c] === disc && grid[(r + 1) * cols + c] === disc && grid[(r + 2) * cols + c] === disc && grid[(r + 3) * cols + c] === disc) return true;
      }
    }
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (grid[r * cols + c] === disc && grid[(r - 1) * cols + c + 1] === disc && grid[(r - 2) * cols + c + 2] === disc && grid[(r - 3) * cols + c + 3] === disc) return true;
      }
    }
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (grid[r * cols + c] === disc && grid[(r + 1) * cols + c + 1] === disc && grid[(r + 2) * cols + c + 2] === disc && grid[(r + 3) * cols + c + 3] === disc) return true;
      }
    }
    return false;
  }

  getBestConnect4Move(grid) {
    const validCols = [];
    for (let c = 0; c < 7; c++) {
      if (grid[c] === null) validCols.push(c);
    }
    if (validCols.length === 0) return 0;
    if (validCols.includes(3)) return 3;
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // ==========================================
  // GAME LOGIC: MEMORY MATCH
  // ==========================================
  makeMemoryFlip(roomId, cardIndex, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'MEMORY_MATCH') throw new Error('Invalid Memory room');
    if (room.status !== 'PLAYING') throw new Error('Game not in progress');
    if (room.currentTurn !== socketId) throw new Error('Not your turn');

    if (room.flippedCards.includes(cardIndex) || room.matchedPairs.includes(room.deck[cardIndex].pairId)) {
      throw new Error('Card already revealed');
    }

    room.flippedCards.push(cardIndex);
    let matchResult = null;

    if (room.flippedCards.length === 2) {
      const [idx1, idx2] = room.flippedCards;
      const card1 = room.deck[idx1];
      const card2 = room.deck[idx2];

      if (card1.pairId === card2.pairId) {
        room.matchedPairs.push(card1.pairId);
        room.scores[socketId] = (room.scores[socketId] || 0) + 20;
        matchResult = { match: true, pairId: card1.pairId };
        room.flippedCards = [];

        if (room.matchedPairs.length === 8) {
          room.status = 'FINISHED';
          const p1 = room.players[0];
          const p2 = room.players[1];
          const s1 = room.scores[p1?.socketId] || 0;
          const s2 = room.scores[p2?.socketId] || 0;
          if (s1 > s2) room.winner = p1.socketId;
          else if (s2 > s1) room.winner = p2.socketId;
          else room.winner = 'DRAW';
        }
      } else {
        matchResult = { match: false, cards: [idx1, idx2] };
        const nextPlayer = room.players.find(p => p.socketId !== socketId);
        room.currentTurn = nextPlayer ? nextPlayer.socketId : null;
      }
    }

    return { room, matchResult };
  }

  // ==========================================
  // GAME LOGIC: PONG
  // ==========================================
  updatePongPaddle(roomId, paddleY, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'PONG') return null;
    if (room.players[0]?.socketId === socketId) room.paddle1 = paddleY;
    else room.paddle2 = paddleY;
    return room;
  }

  updatePongScore(roomId, playerIndex) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'PONG') return null;

    if (playerIndex === 0) room.score1 += 1;
    else room.score2 += 1;

    if (room.score1 >= room.targetScore) {
      room.status = 'FINISHED';
      room.winner = room.players[0].socketId;
    } else if (room.score2 >= room.targetScore) {
      room.status = 'FINISHED';
      room.winner = room.players[1].socketId;
    }

    return room;
  }

  // ==========================================
  // AI BOT AUTOMATION
  // ==========================================
  makeBotMove(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'PLAYING' || !room.isSinglePlayer) return null;

    const currentBot = room.players.find(p => p.socketId === room.currentTurn);
    if (!currentBot || !currentBot.socketId.startsWith('BOT_')) return null;

    if (room.gameType === 'TIC_TAC_TOE') {
      const bestMove = this.getBestTicTacToeMove(room.grid);
      if (bestMove !== null) return this.makeMove(roomId, bestMove, currentBot.socketId);
    } else if (room.gameType === 'SNAKE') {
      return this.rollDiceSnake(roomId, currentBot.socketId);
    } else if (room.gameType === 'LUDO') {
      if (room.waitingForTokenChoice) {
        const choice = room.movableTokens[Math.floor(Math.random() * room.movableTokens.length)];
        return this.moveLudoToken(roomId, currentBot.socketId, choice);
      } else {
        return this.rollDiceLudo(roomId, currentBot.socketId);
      }
    } else if (room.gameType === 'CONNECT_4') {
      const bestCol = this.getBestConnect4Move(room.grid);
      return this.makeConnect4Move(roomId, bestCol, currentBot.socketId);
    }
    return null;
  }

  makeChessMove(roomId, fen, lastMove, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.fen = fen;
    room.lastMove = lastMove;

    const nextPlayer = room.players.find(p => p.socketId !== socketId);
    if (nextPlayer) {
      room.currentTurn = nextPlayer.socketId;
    }

    return room;
  }

  resetGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.status = 'PLAYING';
    room.winner = null;
    room.rankings = [];
    room.currentTurn = room.players[0].socketId;

    room.players.forEach(p => {
      p.score = 0;
      p.hasWon = false;
      if (room.gameType === 'SNAKE') p.position = 1;
      else if (room.gameType === 'LUDO') {
        p.tokens = [
          { id: 0, step: -1, finished: false },
          { id: 1, step: -1, finished: false },
          { id: 2, step: -1, finished: false },
          { id: 3, step: -1, finished: false }
        ];
      }
    });

    this.initGameRoomState(room);
    return room;
  }
}

export default new RoomManager();