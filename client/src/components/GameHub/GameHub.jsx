import React, { useState } from 'react';
import { GAMES_LIST, GAME_CATEGORIES } from '../../../../shared/gameMetadata.js';
import './GameHub.css';

const GameHub = ({ onSelectGame, onOpenLeaderboard, onOpenAchievements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSpinning, setIsSpinning] = useState(false);

  const categories = ['ALL', 'BOARD', 'PUZZLE', 'ACTION'];

  const filteredGames = GAMES_LIST.filter(game => {
    const matchesCategory = activeCategory === 'ALL' || game.category === activeCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (game.badge && game.badge.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (cat) => {
    if (cat === 'ALL') return GAMES_LIST.length;
    return GAMES_LIST.filter(g => g.category === cat).length;
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
            <span>CYBER ARCADE ARENA &bull; {GAMES_LIST.length} HIT GAMES</span>
          </div>
          <h1 className="hero-main-title">
            CYBER <span className="neon-cyan-text">ARCADE</span>
          </h1>
          <p className="hero-description">
            Play the world's most popular casual & arcade hits solo against AI or challenge friends in 1v1 multiplayer.
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
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                className={`category-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span className="cat-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Games 3D Cards Grid */}
      <section className="hub-games-section">
        {filteredGames.length === 0 ? (
          <div className="hub-empty-state glass-panel">
            <span className="empty-state-icon">👾</span>
            <h3 className="empty-state-title">No Games Found</h3>
            <p className="empty-state-desc">No games matched your search query "{searchTerm}".</p>
            <button 
              className="btn-secondary" 
              onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}
              style={{ marginTop: '15px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="hub-cards-grid">
            {filteredGames.map(game => {
              const accent = game.color || '#00f3ff';
              return (
                <div 
                  key={game.id} 
                  className="nexus-game-card glass-panel"
                  onClick={() => onSelectGame(game.id)}
                  style={{ '--theme-color': accent }}
                >
                  <div className="card-top-header">
                    <div 
                      className="card-icon-bubble" 
                      style={{ 
                        background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.1), rgba(0,0,0,0.6))`,
                        borderColor: accent,
                        boxShadow: `0 0 16px ${accent}44`
                      }}
                    >
                      <span className="card-icon-symbol">{game.icon}</span>
                    </div>

                    <div className="card-badges-wrapper">
                      <span className="card-cat-badge">{game.category}</span>
                      {game.badge && (
                        <span 
                          className="card-mode-badge" 
                          style={{ borderColor: accent, color: accent }}
                        >
                          {game.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="game-card-title">{game.title}</h3>
                  <p className="game-card-desc">{game.description}</p>

                  <div className="game-card-footer">
                    <div className="game-controls-info">
                      <span className="controls-icon">🎮</span>
                      <span className="controls-text" title={game.controls}>{game.controls || 'Intuitive Controls'}</span>
                    </div>
                    <button className="card-play-action-btn">
                      PLAY <span className="play-arrow-glyph">&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default GameHub;
