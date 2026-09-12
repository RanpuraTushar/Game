import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AuthForms from './components/Auth/AuthForms';
import Lobby from './components/Lobby/Lobby';
import GameHub from './components/GameHub/GameHub';
import LeaderboardModal from './components/Leaderboard/LeaderboardModal';
import AchievementsModal from './components/Achievements/AchievementsModal';
import ProfileModal from './components/Profile/ProfileModal';
import CyberBackground from './components/Common/CyberBackground';
import { soundEffects } from './utils/SoundEffects';
import { GAMES_LIST } from '../../shared/gameMetadata.js';
import { recordGamePlay } from './utils/gameActivity';
import GameTheater from './components/Game/GameTheater';
import CyberShopModal from './components/Shop/CyberShopModal';
import DailyQuestsModal from './components/Quests/DailyQuestsModal';
import { 
  getUserEconomy, 
  addCoins, 
  addXP, 
  reportQuestProgress, 
  COSMETICS_CATALOG 
} from './utils/portalEconomy';

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
import WatermelonGame from './components/Game/puzzle/WatermelonGame';

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

// 8 New Arcade, Sports, Action, Rhythm & Puzzle Additions
import CricketBattingGame from './components/Game/action/CricketBattingGame';
import PenaltyShootoutGame from './components/Game/action/PenaltyShootoutGame';
import CircuitRacerGame from './components/Game/action/CircuitRacerGame';
import AdventurePlatformerGame from './components/Game/action/AdventurePlatformerGame';
import BeatRhythmGame from './components/Game/action/BeatRhythmGame';
import TriviaQuizGame from './components/Game/educational/TriviaQuizGame';
import DoodleGuessGame from './components/Game/casual/DoodleGuessGame';
import JigsawPuzzleGame from './components/Game/puzzle/JigsawPuzzleGame';
import CrosswordGame from './components/Game/puzzle/CrosswordGame';

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
  const [isMuted, setIsMuted] = useState(() => soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showQuests, setShowQuests] = useState(false);

  // Portal Economy & Favorites
  const [economy, setEconomy] = useState(() => getUserEconomy(user?.id || 'guest'));
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('arcade_favorites_' + (user?.id || 'guest'));
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleToggleFavorite = (gameId) => {
    const next = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    setFavorites(next);
    localStorage.setItem('arcade_favorites_' + (user?.id || 'guest'), JSON.stringify(next));
    soundEffects.playStar();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleSound = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playClick();
    }
  };

  const handleToggleFullscreen = () => {
    soundEffects.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('games_user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
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
    setEconomy(getUserEconomy(userData?.id || 'guest'));
    try {
      const saved = localStorage.getItem('arcade_favorites_' + (userData?.id || 'guest'));
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch (e) {}
    soundEffects.playTrophy();
  };

  const handleLogout = () => {
    soundEffects.playClick();
    setUser(null);
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);
    localStorage.removeItem('games_user');
    localStorage.removeItem('games_token');
  };

  const handleSelectGame = (gameId) => {
    soundEffects.playLaunch();
    const uid = user?.id || 'guest';
    recordGamePlay(gameId, uid);
    reportQuestProgress('PLAY_ANY', 1, uid);

    const gMeta = GAMES_LIST.find(g => g.id === gameId);
    if (gMeta?.category === 'BOARD' || gMeta?.isMultiplayer) {
      reportQuestProgress('BOARD_PLAY', 1, uid);
    }

    addCoins(20, uid);
    addXP(15, uid);
    setEconomy(getUserEconomy(uid));

    setSelectedGame(gameId);
    if (!ONLINE_ROOM_GAMES.includes(gameId)) {
      setInGame(true);
    }
  };

  const handleLeaveGame = () => {
    soundEffects.playClick();
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);
  };

  if (!user) {
    return (
      <>
        <CyberBackground />
        <AuthForms onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  const isOnlineLobbyGame = selectedGame && ONLINE_ROOM_GAMES.includes(selectedGame);
  const activeGameMeta = GAMES_LIST.find(g => g.id === selectedGame);
  const activeFrameObj = COSMETICS_CATALOG.frames.find(f => f.id === economy.equippedFrame);
  const activeTitleObj = COSMETICS_CATALOG.titles.find(t => t.id === economy.equippedTitle);

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Living Cyber Particle & Constellation Canvas */}
      <CyberBackground />

      {/* Fixed Commercial Cyber Platform Navigation Bar */}
      <nav className="app-navbar glass-panel">
        <div className="nav-left-section">
          <div className="nav-brand" onClick={handleLeaveGame} style={{ cursor: 'pointer' }}>
            <span className="brand-logo-icon">⚡</span>
            <span className="brand-text">NEON<span className="cyan-text">ARCADE</span></span>
            <span className="nav-live-indicator">
              <span className="live-dot-green" /> 1.4K ONLINE
            </span>
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
              ← PORTAL
            </button>
          )}

          {/* Live Economy Coins Pill */}
          <button
            className="nav-economy-pill"
            onClick={() => {
              soundEffects.playClick();
              setShowShop(true);
            }}
            title="Open Cyber Vault & Cosmetics Store (+150 Daily Bonus)"
          >
            <span className="nav-coin-icon">🪙</span>
            <span className="nav-coin-val">{economy.coins.toLocaleString()}</span>
          </button>

          {/* Level Pill */}
          <div className="nav-level-pill" title={`Pilot Level ${economy.level} (${economy.xp} XP)`}>
            <span className="nav-lvl-badge">LVL {economy.level}</span>
          </div>

          {/* Daily Quests Pill */}
          <button
            className="btn-tertiary nav-pill-btn nav-btn-quests"
            onClick={() => {
              soundEffects.playClick();
              setShowQuests(true);
            }}
            title="Daily Missions & Bounties"
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-btn-text">QUESTS</span>
          </button>

          {/* Cyber Shop Pill */}
          <button
            className="btn-tertiary nav-pill-btn nav-btn-shop"
            onClick={() => {
              soundEffects.playClick();
              setShowShop(true);
            }}
            title="Cyber Vault Store & Customization"
          >
            <span className="nav-icon">🛍️</span>
            <span className="nav-btn-text">STORE</span>
          </button>

          {/* Sound Mute/Unmute Toggle */}
          <button
            className="nav-icon-btn nav-audio-btn"
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Arcade Sound' : 'Mute Arcade Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Fullscreen Toggle */}
          <button
            className="nav-icon-btn nav-fullscreen-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (⛶)'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>

          <button
            className="btn-tertiary nav-pill-btn nav-btn-ranks"
            onClick={() => {
              soundEffects.playTrophy();
              setShowLeaderboard(true);
            }}
            title="Leaderboards & Ranks"
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-btn-text">RANKS</span>
          </button>

          <button
            className="btn-tertiary nav-pill-btn nav-btn-achieve"
            onClick={() => {
              soundEffects.playTrophy();
              setShowAchievements(true);
            }}
            title="Achievements & Badges"
          >
            <span className="nav-icon">✨</span>
            <span className="nav-btn-text">BADGES</span>
          </button>

          {/* User Profile Badge with active cosmetic frame & title */}
          <button
            className="nav-user-profile-badge"
            onClick={() => {
              soundEffects.playClick();
              setShowProfile(true);
            }}
            title={`Click to view & edit profile (${user.username})`}
          >
            <span 
              className={`user-icon-avatar ${activeFrameObj?.cssClass || ''}`}
              style={{ borderColor: activeFrameObj?.color || 'transparent' }}
            >
              {user.avatar || '👤'}
            </span>
            <div className="nav-user-details-col">
              <span className="user-name-label">{user.username}</span>
              {activeTitleObj && (
                <span className="user-title-sub" style={{ color: activeTitleObj.badgeColor }}>
                  {activeTitleObj.icon} {activeTitleObj.name}
                </span>
              )}
            </div>
            <span className="nav-edit-hint">EDIT</span>
          </button>

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

      {/* User Profile & Edit Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Cyber Shop Modal */}
      {showShop && (
        <CyberShopModal
          user={user}
          onClose={() => setShowShop(false)}
          onEconomyUpdate={(newEcon) => setEconomy(newEcon)}
        />
      )}

      {/* Daily Quests Modal */}
      {showQuests && (
        <DailyQuestsModal
          user={user}
          onClose={() => setShowQuests(false)}
          onEconomyUpdate={(newEcon) => setEconomy(newEcon)}
        />
      )}

      {/* Main View Router */}
      {!selectedGame ? (
        <GameHub
          user={{ ...user, equippedFrame: economy.equippedFrame, equippedTitle: economy.equippedTitle }}
          economy={economy}
          onSelectGame={handleSelectGame}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenQuests={() => setShowQuests(true)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
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
        /* Curated Hit Games Router inside Poki/CrazyGames Cinema Theater */
        <GameTheater
          gameId={selectedGame}
          user={{ ...user, equippedFrame: economy.equippedFrame, equippedTitle: economy.equippedTitle }}
          onBack={handleLeaveGame}
          onSelectGame={handleSelectGame}
          isFavorite={favorites.includes(selectedGame)}
          onToggleFavorite={handleToggleFavorite}
        >
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
          {selectedGame === 'WATERMELON_MERGE' && (
            <WatermelonGame user={user} onLeave={handleLeaveGame} />
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

          {/* New Expansion Games */}
          {selectedGame === 'CRICKET_CHALLENGE' && (
            <CricketBattingGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'PENALTY_SHOOTOUT' && (
            <PenaltyShootoutGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CIRCUIT_RACER' && (
            <CircuitRacerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'ADVENTURE_PLATFORMER' && (
            <AdventurePlatformerGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'TRIVIA_QUIZ' && (
            <TriviaQuizGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'DOODLE_GUESS' && (
            <DoodleGuessGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'JIGSAW_PUZZLE' && (
            <JigsawPuzzleGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'CROSSWORD_PUZZLE' && (
            <CrosswordGame user={user} onLeave={handleLeaveGame} />
          )}
          {selectedGame === 'BEAT_RHYTHM' && (
            <BeatRhythmGame user={user} onLeave={handleLeaveGame} />
          )}
        </GameTheater>
      )}
    </div>
  );
}

export default App;
