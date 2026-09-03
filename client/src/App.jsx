import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AuthForms from './components/Auth/AuthForms';
import Lobby from './components/Lobby/Lobby';
import GameHub from './components/GameHub/GameHub';
import LeaderboardModal from './components/Leaderboard/LeaderboardModal';
import AchievementsModal from './components/Achievements/AchievementsModal';
import { GAMES_LIST } from '../../shared/gameMetadata.js';

// ==========================================
// 1. Board & Multiplayer Classics (8 Games)
// ==========================================
import ChessGame from './components/Game/strategy/ChessGame';
import EightBallPoolGame from './components/Game/casual/EightBallPoolGame';
import UnoGame from './components/Game/casual/UnoGame';
import Ludo from './components/Game/Ludo';
import Snake from './components/Game/Snake';
import TicTacToe from './components/Game/TicTacToe';
import Connect4Game from './components/Game/casual/Connect4Game';
import CarromBoardGame from './components/Game/casual/CarromBoardGame';

// ==========================================
// 2. Addictive Puzzle & Mind Hits (4 Games)
// ==========================================
import WordleGame from './components/Game/puzzle/WordleGame';
import Game2048 from './components/Game/casual/Game2048';
import MinesweeperGame from './components/Game/puzzle/MinesweeperGame';
import BlockPuzzleGame from './components/Game/puzzle/BlockPuzzleGame';

// ==========================================
// 3. Fast-Paced Action & Arcade (13 Games)
// ==========================================
import RooftopSnipersGame from './components/Game/action/RooftopSnipersGame';
import SlopeGame from './components/Game/action/SlopeGame';
import SoccerPhysicsGame from './components/Game/action/SoccerPhysicsGame';
import TankBattleGame from './components/Game/action/TankBattleGame';
import PongGame from './components/Game/casual/PongGame';
import AirHockeyGame from './components/Game/action/AirHockeyGame';
import CyberRacerGame from './components/Game/action/CyberRacerGame';
import FruitSlicerGame from './components/Game/action/FruitSlicerGame';
import KnifeHitGame from './components/Game/action/KnifeHitGame';
import SnakeArcadeGame from './components/Game/casual/SnakeArcadeGame';
import BrickBreakerGame from './components/Game/casual/BrickBreakerGame';
import PianoTilesGame from './components/Game/action/PianoTilesGame';
import BubbleShooterGame from './components/Game/action/BubbleShooterGame';

// New Arcade, Puzzle, Board & Educational Additions
import FlappyBirdGame from './components/Game/casual/FlappyBirdGame';
import SpaceInvadersGame from './components/Game/action/SpaceInvadersGame';
import SudokuGame from './components/Game/puzzle/SudokuGame';
import Match3Game from './components/Game/puzzle/Match3Game';
import TetrisGame from './components/Game/puzzle/TetrisGame';
import MemoryMatchGame from './components/Game/puzzle/MemoryMatchGame';
import SolitaireGame from './components/Game/casual/SolitaireGame';
import MathQuizGame from './components/Game/educational/MathQuizGame';
import WordScrambleGame from './components/Game/educational/WordScrambleGame';
import TypingTestGame from './components/Game/educational/TypingTestGame';
import CodingPuzzleGame from './components/Game/educational/CodingPuzzleGame';

// Connect to backend socket
const socket = io(`http://${window.location.hostname}:3001`);

// Games that strictly require online room matchmaking go through Lobby
const ONLINE_ROOM_GAMES = ['LUDO', 'SNAKE', 'TIC_TAC_TOE', 'CONNECT_4'];

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
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);
    localStorage.removeItem('games_user');
  };

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
    if (!ONLINE_ROOM_GAMES.includes(gameId)) {
      setInGame(true);
    }
  };

  const handleLeaveGame = () => {
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);
  };

  if (!user) {
    return <AuthForms onLoginSuccess={handleLoginSuccess} />;
  }

  const isOnlineLobbyGame = selectedGame && ONLINE_ROOM_GAMES.includes(selectedGame);
  const activeGameMeta = GAMES_LIST.find(g => g.id === selectedGame);

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Cyber Top Navigation Bar */}
      <nav className="app-navbar glass-panel">
        <div className="nav-left-section">
          <div className="nav-brand" onClick={handleLeaveGame} style={{ cursor: 'pointer' }}>
            <span className="brand-logo-icon">⚡</span>
            <span className="brand-text">NEON<span className="cyan-text">RIFT</span></span>
          </div>

          {selectedGame && (
            <div className="nav-breadcrumbs">
              <span className="crumb-sep">/</span>
              <span className="crumb-active-game">
                {activeGameMeta?.icon} {activeGameMeta?.title || selectedGame}
              </span>
            </div>
          )}
        </div>

        <div className="nav-right-section">
          {selectedGame && (
            <button 
              className="btn-secondary nav-hub-return-btn"
              onClick={handleLeaveGame}
            >
              ← HUB
            </button>
          )}

          <button 
            className="btn-tertiary nav-pill-btn nav-btn-ranks"
            onClick={() => setShowLeaderboard(true)}
            title="Leaderboards & Ranks"
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-btn-text">RANKS</span>
          </button>
          <button 
            className="btn-tertiary nav-pill-btn nav-btn-achieve"
            onClick={() => setShowAchievements(true)}
            title="Achievements & Badges"
          >
            <span className="nav-icon">✨</span>
            <span className="nav-btn-text">ACHIEVEMENTS</span>
          </button>
          <div className="nav-user-profile-badge" title={`Logged in as ${user.username}`}>
            <span className="user-icon-avatar">👤</span>
            <span className="user-name-label">{user.username}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-primary nav-btn-logout"
            title="Logout"
          >
            <span className="nav-btn-text">LOGOUT</span>
            <span className="nav-btn-icon">🚪</span>
          </button>
        </div>
      </nav>

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
      ) : isOnlineLobbyGame && !inGame ? (
        <Lobby 
          socket={socket} 
          user={user} 
          selectedGame={selectedGame}
          onBack={handleLeaveGame}
          onGameStart={(room) => {
            setActiveRoom(room);
            setInGame(true);
          }} 
        />
      ) : (
        /* Curated Hit Games Router */
        <main className="game-view-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {/* 1. Board & Strategy Classics */}
          {selectedGame === 'CHESS' && (
            <ChessGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'EIGHT_BALL_POOL' && (
            <EightBallPoolGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'UNO' && (
            <UnoGame user={user} onLeave={handleLeaveGame} />
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
          {selectedGame === 'CARROM' && (
            <CarromBoardGame user={user} onLeave={handleLeaveGame} />
          )}

          {/* 2. Addictive Puzzle Hits */}
          {selectedGame === 'WORDLE' && (
            <WordleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'GAME_2048' && (
            <Game2048 user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'MINESWEEPER' && (
            <MinesweeperGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BLOCK_PUZZLE' && (
            <BlockPuzzleGame user={user} onLeave={handleLeaveGame} />
          )}

          {/* 3. Fast-Paced Action & CrazyGames Hits */}
          {selectedGame === 'ROOFTOP_SNIPERS' && (
            <RooftopSnipersGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SLOPE_3D' && (
            <SlopeGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SOCCER_PHYSICS' && (
            <SoccerPhysicsGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'TANK_BATTLE' && (
            <TankBattleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'PONG' && (
            <PongGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'AIR_HOCKEY' && (
            <AirHockeyGame socket={socket} room={activeRoom} user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CYBER_RACER' && (
            <CyberRacerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'FRUIT_SLICER' && (
            <FruitSlicerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'KNIFE_HIT' && (
            <KnifeHitGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SNAKE_GAME' && (
            <SnakeArcadeGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BRICK_BREAKER' && (
            <BrickBreakerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'PIANO_TILES' && (
            <PianoTilesGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BUBBLE_SHOOTER' && (
            <BubbleShooterGame user={user} onLeave={handleLeaveGame} />
          )}

          {/* New Casual, Arcade, Puzzle & Educational Game Routes */}
          {selectedGame === 'FLAPPY_BIRD' && (
            <FlappyBirdGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SPACE_INVADERS' && (
            <SpaceInvadersGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SUDOKU' && (
            <SudokuGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'MATCH_3' && (
            <Match3Game user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'TETRIS' && (
            <TetrisGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'MEMORY_MATCH' && (
            <MemoryMatchGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'SOLITAIRE' && (
            <SolitaireGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'MATH_QUIZ' && (
            <MathQuizGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'WORD_SCRAMBLE' && (
            <WordScrambleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'TYPING_TEST' && (
            <TypingTestGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CODING_PUZZLE' && (
            <CodingPuzzleGame user={user} onLeave={handleLeaveGame} />
          )}
        </main>
      )}
    </div>
  );
}

export default App;
