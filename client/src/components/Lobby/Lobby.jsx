import React, { useState } from 'react';
import './Lobby.css';

const Lobby = ({ socket, user, selectedGame, onBack, onGameStart }) => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  const supportsMultiplayerCount = selectedGame === 'LUDO' || selectedGame === 'SNAKE';

  const handleCreateRoom = () => {
    setError('');
    setIsConnecting(true);

    if (!socket.connected) {
      setIsConnecting(false);
      setError('Backend server not connected. Please run `npm run dev` in the server folder.');
      return;
    }

    const timer = setTimeout(() => {
      setIsConnecting(false);
      setError('Connection timed out. Please check if the backend server is running on port 3001.');
    }, 4000);

    socket.emit('createRoom', {
      user,
      gameType: selectedGame,
      maxPlayers: supportsMultiplayerCount ? playerCount : 2
    }, (response) => {
      clearTimeout(timer);
      setIsConnecting(false);
      if (response && response.success) {
        onGameStart(response.room);
      } else {
        setError(response?.message || 'Failed to create room.');
      }
    });
  };

  const handleSinglePlayer = () => {
    setError('');
    setIsConnecting(true);

    if (!socket.connected) {
      setIsConnecting(false);
      setError('Backend server not connected. Please run `npm run dev` in the server folder.');
      return;
    }

    const timer = setTimeout(() => {
      setIsConnecting(false);
      setError('Connection timed out. Please check if the backend server is running on port 3001.');
    }, 4000);

    socket.emit('createSinglePlayerRoom', {
      user,
      gameType: selectedGame,
      maxPlayers: supportsMultiplayerCount ? playerCount : 2
    }, (response) => {
      clearTimeout(timer);
      setIsConnecting(false);
      if (response && response.success) {
        onGameStart(response.room);
      } else {
        setError(response?.message || 'Failed to start single player mode.');
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    
    setError('');
    setIsConnecting(true);

    if (!socket.connected) {
      setIsConnecting(false);
      setError('Backend server not connected. Please run `npm run dev` in the server folder.');
      return;
    }

    const timer = setTimeout(() => {
      setIsConnecting(false);
      setError('Connection timed out. Please check if the backend server is running on port 3001.');
    }, 4000);

    socket.emit('joinRoom', { roomId: roomCode.trim(), user }, (response) => {
      clearTimeout(timer);
      setIsConnecting(false);
      if (response && response.success) {
        onGameStart(response.room);
      } else {
        setError(response?.message || 'Failed to join room. Check the code.');
      }
    });
  };


  const [isQuickMatching, setIsQuickMatching] = useState(false);
  const [matchCountdown, setMatchCountdown] = useState(6);

  const handleQuickMatch = () => {
    setError('');
    setIsQuickMatching(true);
    setMatchCountdown(6);

    let remaining = 6;
    const cdInterval = setInterval(() => {
      remaining -= 1;
      setMatchCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(cdInterval);
        setIsQuickMatching(false);
        // Fallback to seamless AI bot match
        handleSinglePlayer();
      }
    }, 1000);

    // Try finding open room on socket
    if (socket.connected) {
      socket.emit('findMatch', {
        user,
        gameType: selectedGame,
        maxPlayers: supportsMultiplayerCount ? playerCount : 2
      }, (response) => {
        if (response && response.success) {
          clearInterval(cdInterval);
          setIsQuickMatching(false);
          onGameStart(response.room);
        }
      });
    }
  };

  return (
    <div className="lobby-container glass-panel" style={{ maxWidth: '440px', margin: '0 auto', padding: '35px 30px' }}>
      <h2 className="neon-text" style={{ fontSize: '2.2rem', marginBottom: '25px', textAlign: 'center' }}>
        {selectedGame.replace(/_/g, ' ')} LOBBY
      </h2>
      
      {error && (
        <div className="lobby-error" style={{ color: '#ff3366', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {/* Player Count Selection for Ludo and Snake */}
      {supportsMultiplayerCount && (
        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#00f3ff', marginBottom: '10px', letterSpacing: '1px' }}>
            SELECT NUMBER OF PLAYERS:
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {[2, 3, 4].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setPlayerCount(num)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: `2px solid ${playerCount === num ? 'var(--neon-green)' : '#444'}`,
                  background: playerCount === num ? 'rgba(0, 255, 102, 0.2)' : 'rgba(0,0,0,0.5)',
                  color: playerCount === num ? '#00ff66' : '#fff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: playerCount === num ? '0 0 10px rgba(0, 255, 102, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1-Click Quick Match Online Matchmaking */}
        <button
          className="btn-primary quick-match-glow-btn"
          onClick={handleQuickMatch}
          disabled={isConnecting || isQuickMatching}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #00f3ff 0%, #ff007f 100%)',
            border: '2px solid #00f3ff',
            boxShadow: '0 0 25px rgba(0, 243, 255, 0.5)'
          }}
        >
          {isQuickMatching ? `🔍 FINDING MATCH (${matchCountdown}s)...` : '⚡ 1-CLICK QUICK MATCH'}
        </button>

        <div style={{ textAlign: 'center', margin: '2px 0', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', fontSize: '0.85rem' }}>
          --- OR CHOOSE MODE ---
        </div>

        <button 
          className="btn-tertiary" 
          onClick={handleSinglePlayer} 
          disabled={isConnecting || isQuickMatching}
          style={{ width: '100%', padding: '14px', fontSize: '1.15rem' }}
        >
          {isConnecting ? 'CONNECTING...' : `VS AI BOT (${playerCount}P)`}
        </button>

        <button 
          className="btn-secondary" 
          onClick={handleCreateRoom} 
          disabled={isConnecting || isQuickMatching}
          style={{ width: '100%', padding: '14px', fontSize: '1.15rem' }}
        >
          {isConnecting ? 'CONNECTING...' : `CREATE PRIVATE ROOM (${playerCount}P)`}
        </button>

        <div style={{ textAlign: 'center', margin: '2px 0', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', fontSize: '0.85rem' }}>
          --- OR ---
        </div>

        <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="ENTER ROOM CODE" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
            className="neon-input"
            disabled={isConnecting}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '1.1rem', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--neon-pink)',
              color: '#fff',
              outline: 'none',
              fontFamily: 'Orbitron, sans-serif'
            }}
          />
          <button 
            type="submit" 
            className="btn-secondary" 
            disabled={isConnecting || !roomCode.trim()}
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}
          >
            JOIN ROOM
          </button>
        </form>
        
        <button 
          onClick={onBack}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#aaa', 
            marginTop: '15px', 
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.9rem'
          }}
        >
          BACK TO GAMES
        </button>
      </div>
    </div>
  );
};

export default Lobby;
