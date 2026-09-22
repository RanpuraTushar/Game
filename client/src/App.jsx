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
import CyberRadio from './components/Audio/CyberRadio';
import LuckySpinModal, { isLuckySpinReady } from './components/Shop/LuckySpinModal';
import { useGamepad } from './utils/useGamepad';
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

// Connect to backend socket via Nginx reverse proxy
const socket = io();

// Games that strictly require online room matchmaking go through Lobby
const ONLINE_ROOM_GAMES = ['LUDO', 'SNAKE', 'TIC_TAC_TOE', 'CONNECT_4'];

const THEMES = [
  {
    id: 'royal-gold',
    name: 'Royal Gold & Onyx',
    tag: 'DEFAULT • LUXURY VIP',
    icon: '👑',
    dots: ['#fbbf24', '#f59e0b', '#070709']
  },
  {
    id: 'clean-dark',
    name: 'Normal Clean Dark',
    tag: 'PRO GAMING',
    icon: '🎮',
    dots: ['#38bdf8', '#818cf8', '#0b0f17']
  },
  {
    id: 'midnight-stealth',
    name: 'Midnight Stealth',
    tag: 'PRO-ESPORTS',
    icon: '🌑',
    dots: ['#00f59b', '#00d2ff', '#0e131f']
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    tag: 'SYNTHWAVE',
    icon: '⚡',
    dots: ['#00f3ff', '#ff007f', '#0e0e1b']
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    tag: 'GALAXY',
    icon: '🌌',
    dots: ['#a855f7', '#ec4899', '#0f1026']
  },
  {
    id: 'obsidian-crimson',
    name: 'Obsidian Crimson',
    tag: 'ROG GAMER',
    icon: '🔥',
    dots: ['#ff1e46', '#ff6b00', '#131318']
  }
];

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [inGame, setInGame] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMuted, setIsMuted] = useState(() => soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Theme Management (Royal Luxury Gold & Onyx by default)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nr_arcade_theme');
    // If not set or previously on legacy defaults, default to royal-gold
    if (!saved || saved === 'midnight-stealth' || saved === 'clean-dark') {
      return 'royal-gold';
    }
    return saved;
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nr_arcade_theme', theme);
  }, [theme]);

  // Click outside to close theme popover
  useEffect(() => {
    const handleDocClick = (e) => {
      if (showThemeMenu && !e.target.closest('.theme-dropdown-wrap')) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [showThemeMenu]);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showLuckySpin, setShowLuckySpin] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [swipeBackToast, setSwipeBackToast] = useState(false);

  // Global Gamepad controller listener & HUD toast
  const { controllerName, toastMessage: gamepadToast } = useGamepad();

  // PWA Desktop App install trigger listener
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    soundEffects.playStar();
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

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
      document.documentElement.requestFullscreen?.().catch(() => { });
    } else {
      document.exitFullscreen?.().catch(() => { });
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
    } catch (e) { }
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

  const handleSelectGame = (gameId, replaceHistory = false) => {
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

    // Sync with browser history for Trackpad swipe-to-back, Browser Back button & shortcuts
    const targetHash = `#game-${gameId.toLowerCase()}`;
    if (window.location.hash !== targetHash) {
      if (replaceHistory) {
        window.history.replaceState({ inGame: true, gameId }, '', targetHash);
      } else {
        window.history.pushState({ inGame: true, gameId }, '', targetHash);
      }
    }
  };

  const handleLeaveGame = (fromHistory = false) => {
    soundEffects.playClick();
    setSelectedGame(null);
    setInGame(false);
    setActiveRoom(null);

    // Keep browser history stack synchronized when leaving via UI button or gesture
    if (!fromHistory && window.location.hash.startsWith('#game-')) {
      if (window.history.state?.inGame) {
        window.history.back();
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  // Browser History & Popstate navigation (Trackpad swipe back, browser back button, Alt+Left)
  useEffect(() => {
    const handlePopState = () => {
      // Close open modals first on back step
      if (showThemeMenu) { setShowThemeMenu(false); return; }
      if (showLeaderboard) { setShowLeaderboard(false); return; }
      if (showAchievements) { setShowAchievements(false); return; }
      if (showProfile) { setShowProfile(false); return; }
      if (showShop) { setShowShop(false); return; }
      if (showQuests) { setShowQuests(false); return; }
      if (showLuckySpin) { setShowLuckySpin(false); return; }

      const hash = window.location.hash;
      if (hash.startsWith('#game-')) {
        const gameIdFromHash = hash.replace('#game-', '').toUpperCase();
        const found = GAMES_LIST.find(g => g.id.toLowerCase() === gameIdFromHash.toLowerCase());
        if (found && selectedGame !== found.id) {
          handleSelectGame(found.id, true);
        }
      } else {
        if (selectedGame) {
          setSwipeBackToast(true);
          setTimeout(() => setSwipeBackToast(false), 1800);
          handleLeaveGame(true);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedGame, showThemeMenu, showLeaderboard, showAchievements, showProfile, showShop, showQuests, showLuckySpin]);

  // Handle direct hash navigation on reload / link sharing
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#game-') && user && !selectedGame) {
      const gameIdFromHash = hash.replace('#game-', '').toUpperCase();
      const found = GAMES_LIST.find(g => g.id.toLowerCase() === gameIdFromHash.toLowerCase());
      if (found) {
        handleSelectGame(found.id, true);
      }
    }
  }, [user]);

  // Trackpad 2-finger horizontal swipe & Touch edge-swipe navigation
  useEffect(() => {
    if (!selectedGame) return;

    let accumulatedDeltaX = 0;
    let resetTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleWheel = (e) => {
      // Detect 2-finger horizontal swipe on laptop trackpad (swiping left-to-right to go back)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.4) {
        accumulatedDeltaX += e.deltaX;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          accumulatedDeltaX = 0;
        }, 260);

        // Negative deltaX is standard left-to-right swipe (Swipe Back)
        if (accumulatedDeltaX < -85) {
          accumulatedDeltaX = 0;
          setSwipeBackToast(true);
          setTimeout(() => setSwipeBackToast(false), 1800);
          handleLeaveGame();
        }
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartX > 0 && touchStartX < 50 && e.touches.length === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = Math.abs(currentY - touchStartY);

        if (diffX > 75 && diffY < 50) {
          touchStartX = 0;
          setSwipeBackToast(true);
          setTimeout(() => setSwipeBackToast(false), 1800);
          handleLeaveGame();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(resetTimer);
    };
  }, [selectedGame]);

  // Global Escape (Esc) key listener to step back out of game or modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'Escape') {
        if (showThemeMenu) { setShowThemeMenu(false); return; }
        if (showLeaderboard) { setShowLeaderboard(false); return; }
        if (showAchievements) { setShowAchievements(false); return; }
        if (showProfile) { setShowProfile(false); return; }
        if (showShop) { setShowShop(false); return; }
        if (showQuests) { setShowQuests(false); return; }
        if (showLuckySpin) { setShowLuckySpin(false); return; }

        if (selectedGame) {
          e.preventDefault();
          setSwipeBackToast(true);
          setTimeout(() => setSwipeBackToast(false), 1800);
          handleLeaveGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame, showThemeMenu, showLeaderboard, showAchievements, showProfile, showShop, showQuests, showLuckySpin]);

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
    <div className={`App ${selectedGame ? 'in-game-active' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Living Cyber Particle & Constellation Canvas */}
      <CyberBackground />

      {/* Fixed Commercial Cyber Platform Navigation Bar */}
      <nav className="app-navbar glass-panel">
        <div className="nav-left-section">
          <div className="nav-brand" onClick={handleLeaveGame} style={{ cursor: 'pointer' }}>
            <span className="brand-logo-icon">{theme === 'royal-gold' ? '👑' : '⚡'}</span>
            <span className="brand-text">ROYAL<span className="cyan-text">NEXUS</span></span>
            <span className="nav-live-indicator nav-desktop-only">
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
              className="btn-secondary nav-hub-return-btn nav-desktop-only"
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
          <div className="nav-level-pill nav-desktop-only" title={`Pilot Level ${economy.level} (${economy.xp} XP)`}>
            <span className="nav-lvl-badge">LVL {economy.level}</span>
          </div>

          {/* Daily Quests Pill */}
          <button
            className="btn-tertiary nav-pill-btn nav-btn-quests nav-desktop-only"
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
            className="btn-tertiary nav-pill-btn nav-btn-shop nav-desktop-only"
            onClick={() => {
              soundEffects.playClick();
              setShowShop(true);
            }}
            title="Cyber Vault Store & Customization"
          >
            <span className="nav-icon">🛍️</span>
            <span className="nav-btn-text">STORE</span>
          </button>

          {/* Daily Lucky Spin Wheel Button */}
          <button
            className={`btn-tertiary nav-pill-btn nav-btn-spin nav-desktop-only ${isLuckySpinReady(user?.id) ? 'spin-ready-pulse' : ''}`}
            onClick={() => {
              soundEffects.playClick();
              setShowLuckySpin(true);
            }}
            title="Daily Lucky Cyber Spin Wheel (+XP & Coins)"
          >
            <span className="nav-icon">🎡</span>
            <span className="nav-btn-text">LUCKY SPIN</span>
            {isLuckySpinReady(user?.id) && <span className="spin-ready-dot" />}
          </button>

          {/* Desktop PWA App 1-Click Install Button */}
          {installPrompt && (
            <button
              className="btn-primary nav-pill-btn nav-btn-install nav-desktop-only"
              onClick={handleInstallApp}
              title="Install Neon Arcade Desktop App (PWA)"
            >
              <span className="nav-icon">💻</span>
              <span className="nav-btn-text">INSTALL APP</span>
            </button>
          )}

          {/* Cyber Radio Synthwave Player */}
          <div className="nav-desktop-only">
            <CyberRadio />
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <button
            className="nav-icon-btn nav-audio-btn nav-desktop-only"
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Arcade Sound' : 'Mute Arcade Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Fullscreen Toggle */}
          <button
            className="nav-icon-btn nav-fullscreen-btn nav-desktop-only"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (⛶)'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>

          {/* 1-Click Theme Switcher Popover */}
          <div className="theme-dropdown-wrap nav-desktop-only">
            <button
              className="nav-icon-btn nav-theme-btn"
              onClick={() => {
                soundEffects.playClick();
                setShowThemeMenu(prev => !prev);
              }}
              title={`Switch Arcade Theme (Current: ${THEMES.find(t => t.id === theme)?.name || 'Theme'})`}
              aria-label="Arcade Theme Selector"
            >
              🎨
            </button>
            {showThemeMenu && (
              <div className="theme-selector-popover">
                <div className="theme-popover-header">
                  <span>ARCADE THEMES</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>1-CLICK SWITCH</span>
                </div>
                {THEMES.map(t => (
                  <div
                    key={t.id}
                    className={`theme-option-item ${theme === t.id ? 'active' : ''}`}
                    onClick={() => {
                      soundEffects.playClick();
                      setTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                  >
                    <div className="theme-item-left">
                      <span>{t.icon}</span>
                      <span className="theme-item-name">{t.name}</span>
                    </div>
                    <div className="theme-color-chips">
                      {t.dots.map((color, idx) => (
                        <span
                          key={idx}
                          className="theme-dot"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn-tertiary nav-pill-btn nav-btn-ranks nav-desktop-only"
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
            className="btn-tertiary nav-pill-btn nav-btn-achieve nav-desktop-only"
            onClick={() => {
              soundEffects.playTrophy();
              setShowAchievements(true);
            }}
            title="Achievements & Badges"
          >
            <span className="nav-icon">✨</span>
            <span className="nav-btn-text">BADGES</span>
          </button>

          {/* User Profile Badge with active cosmetic frame & level pip */}
          <button
            className="nav-user-profile-badge"
            onClick={() => {
              soundEffects.playClick();
              setShowProfile(true);
            }}
            title={`Click to view & edit profile (${user.username})`}
            aria-label="Profile"
          >
            <div className="nav-profile-avatar-wrap">
              <span
                className={`user-icon-avatar ${activeFrameObj?.cssClass || ''}`}
                style={{ borderColor: activeFrameObj?.color || 'transparent' }}
              >
                {user.avatar || '👤'}
              </span>
              <span className="nav-profile-level-badge">{economy.level}</span>
            </div>
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
            className="btn-primary nav-btn-logout nav-desktop-only"
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

      {/* Lucky Spin Wheel Modal */}
      {showLuckySpin && (
        <LuckySpinModal
          user={user}
          onClose={() => setShowLuckySpin(false)}
          onReward={(reward, updatedEcon) => {
            if (updatedEcon) setEconomy(updatedEcon);
          }}
        />
      )}

      {/* Gamepad / Controller HUD Toast Notification */}
      {gamepadToast && (
        <div className="gamepad-hud-toast">
          <span className="gamepad-toast-icon">🎮</span>
          <span className="gamepad-toast-text">{gamepadToast}</span>
        </div>
      )}

      {/* Trackpad Swipe Back / Esc Gesture HUD Toast */}
      {swipeBackToast && (
        <div className="gesture-back-toast">
          <span className="gesture-back-icon">←</span>
          <span>Returning to Arcade Portal...</span>
        </div>
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
