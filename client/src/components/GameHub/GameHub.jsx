import React, { useState, useEffect } from 'react';
import { GAMES_LIST, GAME_CATEGORIES } from '../../../../shared/gameMetadata.js';
import { getGameActivity, getRecentGameIds, getMostPlayedGameIds, formatLastPlayed, getStorageKey } from '../../utils/gameActivity';
import { api } from '../../services/api';
import { soundEffects } from '../../utils/SoundEffects';
import HeroSpotlight from './HeroSpotlight';
import CommunityTicker from '../Common/CommunityTicker';
import './GameHub.css';

const GameHub = ({ 
  user, 
  onSelectGame, 
  onOpenLeaderboard, 
  onOpenAchievements, 
  onOpenProfile,
  onOpenShop,
  onOpenQuests,
  economy,
  favorites: propFavorites,
  onToggleFavorite: propToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [isSpinning, setIsSpinning] = useState(false);
  const [activity, setActivity] = useState({});
  const [recentGameIds, setRecentGameIds] = useState([]);
  const [mostPlayedGameIds, setMostPlayedGameIds] = useState([]);

  // Favorites system
  const [localFavorites, setLocalFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('arcade_favorites_' + (user?.id || 'guest'));
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const favorites = propFavorites || localFavorites;

  const toggleFavorite = (gameId, e) => {
    e?.stopPropagation?.();
    if (propToggleFavorite) {
      propToggleFavorite(gameId);
      return;
    }
    const next = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    setLocalFavorites(next);
    localStorage.setItem('arcade_favorites_' + (user?.id || 'guest'), JSON.stringify(next));
    soundEffects.playStar();
  };

  useEffect(() => {
    const userId = user?.id || 'guest';
    const act = getGameActivity(userId);
    setActivity(act);
    setRecentGameIds(getRecentGameIds(userId, 8));
    setMostPlayedGameIds(getMostPlayedGameIds(userId, 8));

    // Sync high scores from server if user is logged in
    if (user?.id) {
      api.getUserHighScores(user.id).then(res => {
        if (res?.success && res?.highScores) {
          let hasNewHigh = false;
          const currentAct = { ...getGameActivity(userId) };

          Object.entries(res.highScores).forEach(([gKey, sHigh]) => {
            const numHigh = Number(sHigh) || 0;
            const currentHigh = currentAct[gKey]?.highScore || 0;
            if (numHigh > currentHigh) {
              currentAct[gKey] = {
                ...(currentAct[gKey] || { count: 1, lastPlayed: Date.now() }),
                highScore: numHigh
              };
              hasNewHigh = true;
            }
          });

          if (hasNewHigh) {
            localStorage.setItem(getStorageKey(userId), JSON.stringify(currentAct));
            setActivity(currentAct);
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const categories = [
    { id: 'ALL', label: 'ALL GAMES', icon: '🎮' },
    { id: 'FAVORITES', label: '⭐ FAVORITES', icon: '⭐' },
    { id: 'MOST_PLAYED', label: '🔥 MOST PLAYED', icon: '🔥' },
    { id: 'RECENT', label: '⏱️ RECENT', icon: '⏱️' },
    { id: 'BOARD', label: 'BOARD & CLASSICS', icon: '♟️' },
    { id: 'PUZZLE', label: 'PUZZLE & LOGIC', icon: '🧩' },
    { id: 'ACTION', label: 'ACTION & ARCADE', icon: '⚡' },
    { id: 'EDUCATIONAL', label: 'SKILL & EDUCATION', icon: '📚' },
    { id: 'MULTIPLAYER', label: '👥 2-PLAYER / MULTI', icon: '👥' }
  ];

  const filteredGames = GAMES_LIST.filter(game => {
    let matchesCategory = false;
    if (activeCategory === 'ALL') {
      matchesCategory = true;
    } else if (activeCategory === 'FAVORITES') {
      matchesCategory = favorites.includes(game.id);
    } else if (activeCategory === 'MOST_PLAYED') {
      matchesCategory = (activity[game.id]?.count || 0) > 0;
    } else if (activeCategory === 'RECENT') {
      matchesCategory = (activity[game.id]?.lastPlayed || 0) > 0;
    } else if (activeCategory === 'MULTIPLAYER') {
      matchesCategory = game.isMultiplayer === true || (game.maxPlayers && game.maxPlayers > 1);
    } else {
      matchesCategory = game.category === activeCategory;
    }

    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (game.badge && game.badge.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'ALPHA') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'MOST_PLAYED' || activeCategory === 'MOST_PLAYED') {
      const countA = activity[a.id]?.count || 0;
      const countB = activity[b.id]?.count || 0;
      return countB - countA;
    }
    if (sortBy === 'SCORE') {
      const scoreA = activity[a.id]?.highScore || 0;
      const scoreB = activity[b.id]?.highScore || 0;
      return scoreB - scoreA;
    }
    if (sortBy === 'RECENT' || activeCategory === 'RECENT') {
      const timeA = activity[a.id]?.lastPlayed || 0;
      const timeB = activity[b.id]?.lastPlayed || 0;
      return timeB - timeA;
    }
    return 0;
  });

  const getCategoryCount = (catId) => {
    if (catId === 'ALL') return GAMES_LIST.length;
    if (catId === 'FAVORITES') return favorites.length;
    if (catId === 'MOST_PLAYED') {
      return GAMES_LIST.filter(g => (activity[g.id]?.count || 0) > 0).length;
    }
    if (catId === 'RECENT') {
      return GAMES_LIST.filter(g => (activity[g.id]?.lastPlayed || 0) > 0).length;
    }
    if (catId === 'MULTIPLAYER') {
      return GAMES_LIST.filter(g => g.isMultiplayer === true || (g.maxPlayers && g.maxPlayers > 1)).length;
    }
    return GAMES_LIST.filter(g => g.category === catId).length;
  };

  const handleRandomSelect = () => {
    if (isSpinning) return;
    soundEffects.playClick();
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * GAMES_LIST.length);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        setIsSpinning(false);
        onSelectGame(GAMES_LIST[randomIdx].id);
      }
    }, 90);
  };

  // Total session statistics
  const totalPlays = Object.values(activity).reduce((acc, curr) => acc + (curr.count || 0), 0);

  // 3D Card tilt calculation
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <div className="game-hub-wrapper">
      {/* 1. Steam/Poki-style Hero Spotlight Showcase */}
      <HeroSpotlight 
        onSelectGame={onSelectGame} 
        favorites={favorites} 
        onToggleFavorite={toggleFavorite} 
      />

      {/* 2. Live Community Activity Ticker */}
      <CommunityTicker />

      {/* 3. Platform Quick Utility & Stats Bar */}
      <section className="hub-quick-toolbar">
        <div className="quick-toolbar-stats">
          <div className="hub-stat-item">
            <span className="hub-stat-number">{GAMES_LIST.length}</span>
            <span className="hub-stat-label">GAMES</span>
          </div>
          <div className="hub-stat-sep">•</div>
          <div className="hub-stat-item">
            <span className="hub-stat-number">{totalPlays}</span>
            <span className="hub-stat-label">PLAYS</span>
          </div>
          <div className="hub-stat-sep">•</div>
          <div className="hub-stat-item">
            <span className="hub-stat-number">{favorites.length}</span>
            <span className="hub-stat-label">FAVORITES</span>
          </div>
        </div>

        <div className="quick-toolbar-actions">
          {onOpenShop && (
            <button 
              className="btn-quick-nav-pill btn-pill-shop"
              onClick={() => {
                soundEffects.playClick();
                onOpenShop();
              }}
              title="Open Cyber Shop & Avatar Cosmetics"
            >
              <span className="pill-icon">🪙</span>
              <span className="pill-text">CYBER STORE</span>
            </button>
          )}

          {onOpenQuests && (
            <button 
              className="btn-quick-nav-pill btn-pill-quests"
              onClick={() => {
                soundEffects.playClick();
                onOpenQuests();
              }}
              title="View Daily Missions & Bounties"
            >
              <span className="pill-icon">🎯</span>
              <span className="pill-text">DAILY MISSIONS</span>
            </button>
          )}

          <button 
            className={`btn-quick-nav-pill btn-pill-random ${isSpinning ? 'spinning' : ''}`}
            onClick={handleRandomSelect}
            title="Pick a random game to play!"
          >
            <span className="pill-icon">🎲</span>
            <span className="pill-text">
              {isSpinning ? 'SPINNING...' : 'RANDOM GAME'}
            </span>
          </button>
        </div>
      </section>

      {/* Recently Played / Jump Back In Shelf */}
      {recentGameIds.length > 0 && activeCategory === 'ALL' && !searchTerm && (
        <section className="hub-recent-shelf">
          <div className="recent-shelf-header">
            <div className="recent-shelf-title">
              <span className="shelf-badge-icon">⏱️</span>
              <h3>JUMP BACK IN &bull; RECENTLY PLAYED</h3>
            </div>
            <span className="recent-shelf-subtitle">Pick up right where you left off</span>
          </div>

          <div className="recent-shelf-track">
            {recentGameIds.map(id => {
              const g = GAMES_LIST.find(game => game.id === id);
              if (!g) return null;
              const stats = activity[id];
              return (
                <div 
                  key={g.id} 
                  className="recent-mini-card"
                  onClick={() => onSelectGame(g.id)}
                  title={`Launch ${g.title}`}
                  onMouseEnter={() => soundEffects.playHover()}
                >
                  <div className="recent-mini-icon-halo" style={{ '--mini-color': g.color || '#00f3ff' }}>
                    <span className="recent-mini-icon">{g.icon}</span>
                  </div>
                  <div className="recent-mini-info">
                    <span className="recent-mini-title">{g.title}</span>
                    <div className="recent-mini-meta">
                      {stats?.highScore > 0 && (
                        <span className="recent-best-tag" title={`High Score: ${stats.highScore.toLocaleString()}`}>
                          🏆 {stats.highScore.toLocaleString()}
                        </span>
                      )}
                      {stats?.count > 1 && (
                        <span className="recent-count-tag">🔥 {stats.count} plays</span>
                      )}
                      <span className="recent-time-tag">{formatLastPlayed(stats?.lastPlayed)}</span>
                    </div>
                  </div>
                  <button className="recent-play-btn" title={`Play ${g.title}`}>
                    ▶
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter, Sort & Search Bar */}
      <section className="hub-controls-bar">
        <div className="hub-controls-top-row">
          <div className="hub-search-container">
            <span className="search-lens-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search games, mechanics, or tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hub-search-field"
            />
            {searchTerm && (
              <button className="search-reset-btn" onClick={() => setSearchTerm('')} title="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="hub-sort-container">
            <span className="sort-label">Sort:</span>
            <select 
              value={sortBy} 
              onChange={(e) => {
                soundEffects.playClick();
                setSortBy(e.target.value);
              }}
              className="hub-sort-select"
            >
              <option value="DEFAULT">⚡ Featured</option>
              <option value="MOST_PLAYED">🔥 Most Played</option>
              <option value="SCORE">🏆 High Score</option>
              <option value="ALPHA">🔤 Alphabetical (A-Z)</option>
              <option value="RECENT">⏱️ Recently Played</option>
            </select>
          </div>
        </div>

        <div className="hub-category-tabs">
          {categories.map(cat => {
            const count = getCategoryCount(cat.id);
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                className={`category-tab-btn ${isActive ? 'active' : ''} ${cat.id === 'MOST_PLAYED' ? 'tab-highlight-fire' : ''} ${cat.id === 'FAVORITES' ? 'tab-highlight-star' : ''}`}
                onClick={() => {
                  soundEffects.playClick();
                  setActiveCategory(cat.id);
                }}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-label">{cat.label}</span>
                <span className="tab-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Game Cards Grid */}
      <main className="hub-games-grid-section">
        {filteredGames.length === 0 ? (
          <div className="no-games-found">
            <span className="empty-icon">
              {activeCategory === 'FAVORITES' ? '⭐' : activeCategory === 'MOST_PLAYED' || activeCategory === 'RECENT' ? '🎮' : '🕹️'}
            </span>
            <h3>
              {activeCategory === 'FAVORITES'
                ? 'NO FAVORITE GAMES YET'
                : activeCategory === 'MOST_PLAYED' 
                ? 'NO GAMES PLAYED YET' 
                : activeCategory === 'RECENT'
                ? 'NO RECENT GAMES FOUND'
                : 'NO GAMES FOUND'}
            </h3>
            <p>
              {activeCategory === 'FAVORITES'
                ? 'Click the star icon (★) on any game card to bookmark it to your favorites!'
                : activeCategory === 'MOST_PLAYED' || activeCategory === 'RECENT'
                ? 'Start playing any game from the arcade and it will automatically appear here!'
                : 'Try searching for a different keyword or select another category filter.'}
            </p>
            <button className="btn-tertiary" onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}>
              EXPLORE ALL GAMES
            </button>
          </div>
        ) : (
          <div className="games-cards-grid">
            {filteredGames.map((game, index) => {
              const maxP = game.maxPlayers || 1;
              const isMulti = game.isMultiplayer || maxP > 1;
              const stats = activity[game.id];
              const isFav = favorites.includes(game.id);

              return (
                <div
                  key={game.id}
                  className={`game-catalog-card ${stats?.count > 0 ? 'card-has-history' : ''} ${isFav ? 'card-is-favorite' : ''}`}
                  onClick={() => onSelectGame(game.id)}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onMouseEnter={() => soundEffects.playHover()}
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="card-top-row">
                    <div className="card-icon-halo" style={{ '--halo-color': game.color || '#00f3ff' }}>
                      <span className="card-game-icon">{game.icon}</span>
                    </div>

                    <div className="card-badges-wrapper">
                      {/* Favorite Star Button */}
                      <button
                        className={`card-star-btn ${isFav ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(game.id, e)}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        aria-label="Toggle Favorite"
                      >
                        {isFav ? '★' : '☆'}
                      </button>

                      {stats?.highScore > 0 && (
                        <span className="card-highscore-badge" title={`High Score: ${stats.highScore.toLocaleString()}`}>
                          🏆 {stats.highScore.toLocaleString()}
                        </span>
                      )}
                      {stats?.count > 0 && (
                        <span className="card-played-badge" title={`You played this ${stats.count} times`}>
                          🔥 {stats.count}
                        </span>
                      )}
                      {isMulti && (
                        <span className="card-players-badge">
                          {maxP > 2 ? `👑 1-${maxP}P` : '👥 1-2P'}
                        </span>
                      )}
                      {game.badge && (
                        <span className="card-badge-pill" style={{ borderColor: game.color || 'rgba(0,243,255,0.4)' }}>
                          {game.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="card-game-title">{game.title}</h3>
                  <p className="card-game-desc">{game.description}</p>

                  <div className="card-controls-hint">
                    <span className="hint-label">🎮 Controls:</span>
                    <span className="hint-text">{game.controls || 'Tap or click to play'}</span>
                  </div>

                  <div className="card-footer-action">
                    <button className="btn-play-card" style={{ '--btn-accent': game.color || '#00f3ff' }}>
                      <span>{stats?.count > 0 ? 'PLAY AGAIN' : 'PLAY NOW'}</span>
                      <span className="play-arrow">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default GameHub;
