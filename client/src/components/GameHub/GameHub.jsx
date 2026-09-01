import React, { useState } from 'react';
import { GAMES_LIST, GAME_CATEGORIES } from '../../../../shared/gameMetadata.js';
import './GameHub.css';

const GameHub = ({ onSelectGame, onOpenLeaderboard, onOpenAchievements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSpinning, setIsSpinning] = useState(false);

  const categories = [
    { id: 'ALL', label: 'ALL GAMES', icon: '🎮' },
    { id: 'BOARD', label: 'BOARD & CLASSICS', icon: '♟️' },
    { id: 'PUZZLE', label: 'PUZZLE & LOGIC', icon: '🧩' },
    { id: 'ACTION', label: 'ACTION & ARCADE', icon: '⚡' },
    { id: 'MULTIPLAYER', label: '👥 2-PLAYER / MULTI', icon: '👥' }
  ];

  const filteredGames = GAMES_LIST.filter(game => {
    let matchesCategory = false;
    if (activeCategory === 'ALL') {
      matchesCategory = true;
    } else if (activeCategory === 'MULTIPLAYER') {
      matchesCategory = game.isMultiplayer === true || (game.maxPlayers && game.maxPlayers > 1);
    } else {
      matchesCategory = game.category === activeCategory;
    }

    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (game.badge && game.badge.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (catId) => {
    if (catId === 'ALL') return GAMES_LIST.length;
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
                className={`category-tab-btn ${isActive ? 'active' : ''}`}
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
            <span className="empty-icon">🕹️</span>
            <h3>NO GAMES FOUND</h3>
            <p>Try searching for a different keyword or select another category filter.</p>
            <button className="btn-tertiary" onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}>
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="games-cards-grid">
            {filteredGames.map((game, index) => {
              const maxP = game.maxPlayers || 1;
              const isMulti = game.isMultiplayer || maxP > 1;

              return (
                <div
                  key={game.id}
                  className="game-catalog-card"
                  onClick={() => onSelectGame(game.id)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="card-top-row">
                    <div className="card-icon-halo" style={{ '--halo-color': game.color || '#00f3ff' }}>
                      <span className="card-game-icon">{game.icon}</span>
                    </div>

                    <div className="card-badges-wrapper">
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
                      <span>PLAY NOW</span>
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
