import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AuthForms from './components/Auth/AuthForms';
import Lobby from './components/Lobby/Lobby';
import GameHub from './components/GameHub/GameHub';
import LeaderboardModal from './components/Leaderboard/LeaderboardModal';
import AchievementsModal from './components/Achievements/AchievementsModal';
import { GAMES_LIST } from '../../shared/gameMetadata.js';

// 1. Board & Multiplayer Classics
import ChessGame from './components/Game/strategy/ChessGame';
import Ludo from './components/Game/Ludo';
import Snake from './components/Game/Snake';
import TicTacToe from './components/Game/TicTacToe';
import Connect4Game from './components/Game/casual/Connect4Game';

// 2. Addictive Puzzle Hits
import WordleGame from './components/Game/puzzle/WordleGame';
import Game2048 from './components/Game/casual/Game2048';
import MinesweeperGame from './components/Game/puzzle/MinesweeperGame';

// 3. Fast-Paced Arcade Classics
import SnakeArcadeGame from './components/Game/casual/SnakeArcadeGame';
import BrickBreakerGame from './components/Game/casual/BrickBreakerGame';
import PongGame from './components/Game/casual/PongGame';
import PianoTilesGame from './components/Game/action/PianoTilesGame';
import BubbleShooterGame from './components/Game/action/BubbleShooterGame';

// 4. New Viral Games Suite
import CyberRacerGame from './components/Game/action/CyberRacerGame';
import AirHockeyGame from './components/Game/action/AirHockeyGame';
import FruitSlicerGame from './components/Game/action/FruitSlicerGame';
import KnifeHitGame from './components/Game/action/KnifeHitGame';
import BlockPuzzleGame from './components/Game/puzzle/BlockPuzzleGame';
import ZombieClickerGame from './components/Game/action/ZombieClickerGame';
import CarromBoardGame from './components/Game/casual/CarromBoardGame';

// Connect to local backend
const socket = io(`http://${window.location.hostname}:3001`);

// Only games that strictly require online room matchmaking go to Lobby; others launch directly with built-in AI
const MULTIPLAYER_GAMES = ['LUDO', 'SNAKE', 'TIC_TAC_TOE', 'CONNECT_4'];



function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [inGame, setInGame] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('games_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('games_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('games_user');
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);
  };

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
    setActiveRoom(null);
    if (MULTIPLAYER_GAMES.includes(gameId)) {
      setInGame(false); // Directs to Lobby for AI / 1v1 Room
    } else {
      setInGame(true); // Single player direct launch
    }
  };

  const handleLeaveGame = () => {
    setInGame(false);
    setActiveRoom(null);
    setSelectedGame(null);
  };

  if (!user) {
    return (
      <div className="app-container auth-mode">
        <AuthForms onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const isMultiplayerGame = MULTIPLAYER_GAMES.includes(selectedGame);

  return (
    <div className="app-container">
      {/* Platform Header */}
      <header className="app-header glass-panel" style={{ margin: '10px 20px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => setSelectedGame(null)}>
          <span style={{ fontSize: '1.8rem' }}>🎮</span>
          <div>
            <h1 className="neon-text" style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px' }}>CYBER ARCADE</h1>
            <span style={{ fontSize: '0.75rem', color: isConnected ? 'var(--neon-green)' : 'var(--neon-pink)', letterSpacing: '1px' }}>
              ● {isConnected ? `SYSTEM ONLINE (${GAMES_LIST.length} GAMES ACTIVE)` : 'CONNECTING...'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn-tertiary"
            onClick={() => setShowLeaderboard(true)}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            🏆 RANKS
          </button>
          <button 
            className="btn-tertiary"
            onClick={() => setShowAchievements(true)}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            ✨ ACHIEVEMENTS
          </button>
          <div style={{ color: '#fff', fontSize: '0.9rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
            <span style={{ color: '#aaa' }}>PLAYER: </span>
            <strong style={{ color: 'var(--neon-blue)' }}>{user.username}</strong>
          </div>
          <button onClick={handleLogout} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            LOGOUT
          </button>
        </div>
      </header>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal 
          onClose={() => setShowLeaderboard(false)} 
          defaultGame={selectedGame || 'GLOBAL'}
        />
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <AchievementsModal 
          user={user} 
          onClose={() => setShowAchievements(false)} 
        />
      )}

      {/* Main View Router */}
      {!selectedGame ? (
        <GameHub 
          onSelectGame={handleSelectGame}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenAchievements={() => setShowAchievements(true)}
        />
      ) : isMultiplayerGame && !inGame ? (
        <Lobby 
          socket={socket} 
          user={user} 
          selectedGame={selectedGame}
          onBack={() => {
            setSelectedGame(null);
            setActiveRoom(null);
            setInGame(false);
          }}
          onGameStart={(room) => {
            setActiveRoom(room);
            setInGame(true);
          }} 
        />
      ) : (
        /* Active Game Render */
        <>
          {/* 1. Board Classics */}
          {selectedGame === 'CHESS' && (
            <ChessGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'LUDO' && (
            <Ludo socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SNAKE' && (
            <Snake socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'TIC_TAC_TOE' && (
            <TicTacToe socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CONNECT_4' && (
            <Connect4Game socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}

          {/* 2. Puzzle Hits */}
          {selectedGame === 'WORDLE' && (
            <WordleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'GAME_2048' && (
            <Game2048 user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'MINESWEEPER' && (
            <MinesweeperGame user={user} onLeave={handleLeaveGame} />
          )}

          {/* 3. Fast Arcade Hits */}
          {selectedGame === 'SNAKE_GAME' && (
            <SnakeArcadeGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BRICK_BREAKER' && (
            <BrickBreakerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'PONG' && (
            <PongGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'PIANO_TILES' && (
            <PianoTilesGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BUBBLE_SHOOTER' && (
            <BubbleShooterGame user={user} onLeave={handleLeaveGame} />
          )}

          {/* 4. New Viral Hit Games */}
          {selectedGame === 'CYBER_RACER' && (
            <CyberRacerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'AIR_HOCKEY' && (
            <AirHockeyGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'FRUIT_SLICER' && (
            <FruitSlicerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'KNIFE_HIT' && (
            <KnifeHitGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BLOCK_PUZZLE' && (
            <BlockPuzzleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'ZOMBIE_CLICKER' && (
            <ZombieClickerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CARROM' && (
            <CarromBoardGame user={user} onLeave={handleLeaveGame} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
