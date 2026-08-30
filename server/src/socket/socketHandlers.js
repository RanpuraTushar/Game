import RoomManager from '../game/RoomManager.js';

export const handleSocketConnections = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    const triggerBotSequence = (roomId) => {
      const room = RoomManager.getRoom(roomId);
      if (!room || room.status !== 'PLAYING' || !room.isSinglePlayer) return;

      const currentBot = room.players.find(
        p => p.socketId === room.currentTurn && p.socketId.startsWith('BOT_')
      );

      if (currentBot) {
        const delay = (room.gameType === 'LUDO' || room.gameType === 'SNAKE') ? 2200 : 700;
        setTimeout(() => {
          const updatedRoom = RoomManager.makeBotMove(roomId);
          if (updatedRoom) {
            io.to(roomId).emit('roomUpdated', updatedRoom);
            triggerBotSequence(roomId);
          }
        }, delay);
      }
    };

    // Create Room
    socket.on('createRoom', ({ user, gameType, maxPlayers = 2 }, callback) => {
      try {
        const oldRoom = RoomManager.leaveRoom(socket.id);
        if (oldRoom && !oldRoom.deleted) {
          socket.leave(oldRoom.roomId);
          io.to(oldRoom.roomId).emit('roomUpdated', oldRoom.room);
        }

        const room = RoomManager.createRoom(socket.id, user, gameType, maxPlayers);
        socket.join(room.id);
        if (typeof callback === 'function') callback({ success: true, room });
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: error.message });
      }
    });

    // Create Single Player Room
    socket.on('createSinglePlayerRoom', ({ user, gameType, maxPlayers = 2 }, callback) => {
      try {
        const oldRoom = RoomManager.leaveRoom(socket.id);
        if (oldRoom && !oldRoom.deleted) {
          socket.leave(oldRoom.roomId);
          io.to(oldRoom.roomId).emit('roomUpdated', oldRoom.room);
        }

        const room = RoomManager.createSinglePlayerRoom(socket.id, user, gameType, maxPlayers);
        socket.join(room.id);
        if (typeof callback === 'function') callback({ success: true, room });
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: error.message });
      }
    });

    // Join Room
    socket.on('joinRoom', ({ roomId, user }, callback) => {
      try {
        const roomCode = roomId.toUpperCase();
        const oldRoom = RoomManager.leaveRoom(socket.id);
        if (oldRoom && !oldRoom.deleted) {
          socket.leave(oldRoom.roomId);
          io.to(oldRoom.roomId).emit('roomUpdated', oldRoom.room);
        }

        const room = RoomManager.joinRoom(roomCode, socket.id, user);
        socket.join(room.id);

        io.to(room.id).emit('roomUpdated', room);
        if (typeof callback === 'function') callback({ success: true, room });
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: error.message });
      }
    });

    // TicTacToe Move
    socket.on('makeMove', ({ roomId, index }) => {
      try {
        const room = RoomManager.makeMove(roomId, index, socket.id);
        io.to(roomId).emit('roomUpdated', room);
        triggerBotSequence(roomId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Snakes & Ladders Roll
    socket.on('rollDice', ({ roomId }) => {
      try {
        const room = RoomManager.rollDiceSnake(roomId, socket.id);
        if (room) {
          io.to(roomId).emit('roomUpdated', room);
          triggerBotSequence(roomId);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Ludo Roll
    socket.on('rollDiceLudo', ({ roomId }) => {
      try {
        const room = RoomManager.rollDiceLudo(roomId, socket.id);
        if (room) {
          io.to(roomId).emit('roomUpdated', room);
          triggerBotSequence(roomId);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Ludo Move Token
    socket.on('moveLudoToken', ({ roomId, tokenId }) => {
      try {
        const room = RoomManager.moveLudoToken(roomId, socket.id, tokenId);
        if (room) {
          io.to(roomId).emit('roomUpdated', room);
          triggerBotSequence(roomId);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Chess Move
    socket.on('makeChessMove', ({ roomId, fen, lastMove }) => {
      try {
        const room = RoomManager.makeChessMove(roomId, fen, lastMove, socket.id);
        if (room) {
          io.to(roomId).emit('roomUpdated', room);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Connect-4 Move
    socket.on('makeConnect4Move', ({ roomId, col }) => {
      try {
        const room = RoomManager.makeConnect4Move(roomId, col, socket.id);
        io.to(roomId).emit('roomUpdated', room);
        triggerBotSequence(roomId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Memory Match Flip
    socket.on('makeMemoryFlip', ({ roomId, cardIndex }) => {
      try {
        const { room, matchResult } = RoomManager.makeMemoryFlip(roomId, cardIndex, socket.id);
        io.to(roomId).emit('roomUpdated', room);
        if (matchResult) {
          io.to(roomId).emit('memoryMatchResult', matchResult);
        }
        triggerBotSequence(roomId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Pong Paddle Sync
    socket.on('updatePongPaddle', ({ roomId, paddleY }) => {
      const room = RoomManager.updatePongPaddle(roomId, paddleY, socket.id);
      if (room) {
        socket.to(roomId).emit('pongPaddleMoved', { socketId: socket.id, paddleY });
      }
    });

    // Pong Score Sync
    socket.on('updatePongScore', ({ roomId, playerIndex }) => {
      const room = RoomManager.updatePongScore(roomId, playerIndex);
      if (room) {
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    // Reset Game
    socket.on('resetGame', ({ roomId }) => {
      const room = RoomManager.resetGame(roomId);
      if (room) {
        io.to(roomId).emit('roomUpdated', room);
        triggerBotSequence(roomId);
      }
    });

    // Leave Room
    socket.on('leaveRoom', () => {
      const result = RoomManager.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.roomId);
        if (!result.deleted) {
          io.to(result.roomId).emit('roomUpdated', result.room);
          triggerBotSequence(result.roomId);
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const result = RoomManager.leaveRoom(socket.id);
      if (result && !result.deleted) {
        io.to(result.roomId).emit('roomUpdated', result.room);
        triggerBotSequence(result.roomId);
      }
    });
  });
};
