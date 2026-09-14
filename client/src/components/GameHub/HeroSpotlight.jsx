import React, { useState, useEffect, useRef } from 'react';
import { GAMES_LIST } from '../../../../shared/gameMetadata.js';
import { soundEffects } from '../../utils/SoundEffects';
import { getGameAverageRating } from '../../utils/portalEconomy';
import './HeroSpotlight.css';

const FEATURED_GAME_IDS = [
  'TIC_TAC_TOE',
  'CHESS',
  'EIGHT_BALL_POOL',
  'LUDO',
  'SNAKE'
];

const SPOTLIGHT_EXTRAS = {
  TIC_TAC_TOE: {
    tagline: 'CYBER NEON 1v1 DUEL',
    tags: ['❌⭕ Neon Grid', '🤖 Smart AI Bot', '⚡ Fast Blitz'],
    rating: '4.8 ★★★★★ (3.9K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.2) 0%, rgba(255, 0, 127, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  CHESS: {
    tagline: 'STRATEGIC MASTERCLASS',
    tags: ['♟️ Grandmaster AI', '💡 Hint Engine', '👥 Pass & Play'],
    rating: '5.0 ★★★★★ (5.1K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(176, 38, 255, 0.25) 0%, rgba(0, 243, 255, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  EIGHT_BALL_POOL: {
    tagline: 'REALISTIC BILLIARDS SIMULATOR',
    tags: ['🎱 Physics Engine', '🎯 Fine Cue Spin', '👑 Pro Tournament'],
    rating: '4.9 ★★★★★ (4.8K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(0, 243, 255, 0.15) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  LUDO: {
    tagline: 'ROYAL 3D BOARD KINGDOM',
    tags: ['🎲 3D Dice Physics', '👑 1-4 Players', '⚔️ Battle Arena'],
    rating: '4.9 ★★★★★ (6.2K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 0, 127, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  SNAKE: {
    tagline: 'CLASSIC SNAKES & LADDERS 3D',
    tags: ['🐍 Serpentine Board', '🪜 Ladder Climbs', '🎲 1-4P Board Race'],
    rating: '4.8 ★★★★★ (3.5K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  UNO: {
    tagline: 'FAST-PACED CYBER CARD BATTLE',
    tags: ['🃏 Action Wilds', '🤖 Smart AI Bots', '🔥 4-Player Table'],
    rating: '4.9 ★★★★★ (4.3K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2) 0%, rgba(255, 170, 0, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  }
};

const HeroSpotlight = ({ onSelectGame, favorites = [], onToggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const featuredGames = FEATURED_GAME_IDS
    .map(id => GAMES_LIST.find(g => g.id === id))
    .filter(Boolean);

  const activeGame = featuredGames[currentIndex] || featuredGames[0];
  const activeExtras = SPOTLIGHT_EXTRAS[activeGame?.id] || {
    tagline: 'FEATURED ARCADE HIT',
    tags: ['🎮 Popular', '⚡ Instant Play'],
    rating: '4.9 ★★★★★ (2.1K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(10, 10, 25, 0.95))'
  };

  const liveRating = activeGame ? getGameAverageRating(activeGame.id) : null;
  const displayRating = liveRating && liveRating.total > 0
    ? `${liveRating.average} ★★★★★ (${liveRating.total} Reviews)`
    : activeExtras.rating;

  const isFavorite = activeGame ? favorites.includes(activeGame.id) : false;

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredGames.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, featuredGames.length]);

  const handleSelectSlide = (idx) => {
    soundEffects.playClick();
    setCurrentIndex(idx);
  };

  if (!activeGame) return null;

  return (
    <section 
      className="hero-spotlight-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Background Glow */}
      <div 
        className="spotlight-backdrop-glow"
        style={{ background: activeExtras.backdropGradient }}
      />

      {/* Main Spotlight Banner Showcase */}
      <div className="spotlight-main-stage">
        <div className="spotlight-header-meta">
          <span className="spotlight-tagline-badge">
            <span className="badge-flame">🔥</span> {activeExtras.tagline}
          </span>
          <span className="spotlight-rating-pill">
            {displayRating}
          </span>
        </div>

        <div className="spotlight-content-core">
          <div className="spotlight-icon-wrap" style={{ '--halo-color': activeGame.color || '#00f3ff' }}>
            <span className="spotlight-big-icon">{activeGame.icon}</span>
          </div>

          <div className="spotlight-info-col">
            <h1 className="spotlight-title">{activeGame.title}</h1>
            <p className="spotlight-description">{activeGame.description}</p>

            <div className="spotlight-tags-row">
              {activeExtras.tags.map((tag, i) => (
                <span key={i} className="spotlight-tag-pill">{tag}</span>
              ))}
              {activeGame.badge && (
                <span className="spotlight-tag-pill special-tag">{activeGame.badge}</span>
              )}
            </div>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="spotlight-actions-row">
          <button
            className="btn-spotlight-play"
            onClick={() => {
              try {
                if (typeof soundEffects.playStart === 'function') {
                  soundEffects.playStart();
                } else if (typeof soundEffects.playLaunch === 'function') {
                  soundEffects.playLaunch();
                } else {
                  soundEffects.playClick?.();
                }
              } catch (e) {}
              onSelectGame(activeGame.id);
            }}
          >
            <span className="btn-play-icon">▶</span>
            <span className="btn-play-text">PLAY FREE NOW</span>
          </button>

          {onToggleFavorite && (
            <button
              className={`btn-spotlight-favorite ${isFavorite ? 'active' : ''}`}
              onClick={(e) => onToggleFavorite(activeGame.id, e)}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <span className="fav-star">{isFavorite ? '★' : '☆'}</span>
              <span className="fav-label">{isFavorite ? 'FAVORITED' : 'WISHLIST'}</span>
            </button>
          )}

          <div className="spotlight-controls-hint">
            <span className="controls-icon">🎮</span>
            <span className="controls-text">{activeGame.controls}</span>
          </div>
        </div>
      </div>

      {/* Steam-Style Sidebar Carousel Navigation */}
      <div className="spotlight-side-nav">
        <div className="side-nav-title">
          <span>FEATURED SPOTLIGHT</span>
          <span className="side-nav-hint">{isPaused ? '⏸ PAUSED' : 'AUTO-ADVANCING'}</span>
        </div>

        <div className="side-nav-list">
          {featuredGames.map((game, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={game.id}
                className={`side-nav-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectSlide(idx)}
                onMouseEnter={() => soundEffects.playHover()}
                role="button"
                tabIndex={0}
                aria-label={`Select ${game.title}`}
              >
                <span className="side-card-icon">{game.icon}</span>
                <div className="side-card-meta">
                  <span className="side-card-title">{game.title}</span>
                  <span className="side-card-cat">{game.category}</span>
                </div>
                {/* Active progress timer bar */}
                {isActive && (
                  <div className="side-card-progress-bar">
                    <div 
                      className={`side-card-progress-fill ${isPaused ? 'paused' : ''}`} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSpotlight;
