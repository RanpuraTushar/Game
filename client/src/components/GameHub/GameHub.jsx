import React, { useState, useEffect } from 'react';
import { GAMES_LIST, GAME_CATEGORIES } from '../../../../shared/gameMetadata.js';
import { getGameActivity, getRecentGameIds, getMostPlayedGameIds, formatLastPlayed, getStorageKey } from '../../utils/gameActivity';
import { api } from '../../services/api';
import './GameHub.css';

const GameHub = ({ user, onSelectGame, onOpenLeaderboard, onOpenAchievements, onOpenProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSpinning, setIsSpinning] = useState(false);
  const [activity, setActivity] = useState({});
  const [recentGameIds, setRecentGameIds] = useState([]);
  const [mostPlayedGameIds, setMostPlayedGameIds] = useState([]);

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
    if (activeCategory === 'MOST_PLAYED') {
      const countA = activity[a.id]?.count || 0;
      const countB = activity[b.id]?.count || 0;
      return countB - countA;
    }
    if (activeCategory === 'RECENT') {
      const timeA = activity[a.id]?.lastPlayed || 0;
      const timeB = activity[b.id]?.lastPlayed || 0;
      return timeB - timeA;
    }
    return 0;
  });

  const getCategoryCount = (catId) => {
    if (catId === 'ALL') return GAMES_LIST.length;
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

  return (
    <div className="game-hub-wrapper">
      {/* Hero Banner Section */}
      <section className="hub-hero-banner">
        <div className="hero-content">
          <div className="hero-badge-pill">
            <span className="sparkle-icon">✨</span>
            <span>CYBER ARCADE ARENA &bull; {GAMES_LIST.length} HIT GAMES READY</span>
          </div>
          <h1 className="hero-main-title">
            CYBER <span className="neon-cyan-text">ARCADE</span>
          </h1>
          <p className="hero-description">
            Play your favorite hit arcade, puzzle, and board classics solo vs Smart AI or challenge friends in 2-Player Pass & Play and online multiplayer duels!
          </p>
        </div>

        <div className="hero-quick-actions">
          <button 
            className="btn-user-profile-quick"
            onClick={onOpenProfile}
            title="View and edit player profile, username & avatar"
          >
            <span className="hero-avatar-icon">{user?.avatar || '👤'}</span>
            <div className="hero-user-info">
              <span className="hero-user-name">{user?.username || 'Pilot'}</span>
              <span className="hero-user-edit-tag">✏️ EDIT PROFILE</span>
            </div>
          </button>

          <button 
            className={`btn-random-roulette ${isSpinning ? 'spinning' : ''}`}
            onClick={handleRandomSelect}
            title="Pick a random game to play!"
          >
            <span className="roulette-dice-icon">🎲</span>
            <span className="roulette-btn-text">
              {isSpinning ? 'SPINNING ROULETTE...' : 'RANDOM GAME'}
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

      {/* Filter & Search Bar */}
      <section className="hub-controls-bar">
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

        <div className="hub-category-tabs">
          {categories.map(cat => {
            const count = getCategoryCount(cat.id);
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                className={`category-tab-btn ${isActive ? 'active' : ''} ${cat.id === 'MOST_PLAYED' ? 'tab-highlight-fire' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
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
              {activeCategory === 'MOST_PLAYED' || activeCategory === 'RECENT' ? '🎮' : '🕹️'}
            </span>
            <h3>
              {activeCategory === 'MOST_PLAYED' 
                ? 'NO GAMES PLAYED YET' 
                : activeCategory === 'RECENT'
                ? 'NO RECENT GAMES FOUND'
                : 'NO GAMES FOUND'}
            </h3>
            <p>
              {activeCategory === 'MOST_PLAYED' || activeCategory === 'RECENT'
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

              return (
                <div
                  key={game.id}
                  className={`game-catalog-card ${stats?.count > 0 ? 'card-has-history' : ''}`}
                  onClick={() => onSelectGame(game.id)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="card-top-row">
                    <div className="card-icon-halo" style={{ '--halo-color': game.color || '#00f3ff' }}>
                      <span className="card-game-icon">{game.icon}</span>
                    </div>

                    <div className="card-badges-wrapper">
                      {stats?.highScore > 0 && (
                        <span className="card-highscore-badge" title={`High Score: ${stats.highScore.toLocaleString()}`}>
                          🏆 BEST: {stats.highScore.toLocaleString()}
                        </span>
                      )}
                      {stats?.count > 0 && (
                        <span className="card-played-badge" title={`You played this ${stats.count} times`}>
                          🔥 {stats.count} {stats.count === 1 ? 'play' : 'plays'}
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
