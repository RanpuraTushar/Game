import React, { useState, useEffect, useRef } from 'react';
import { GAMES_LIST } from '../../../../shared/gameMetadata.js';
import { soundEffects } from '../../utils/SoundEffects';
import './HeroSpotlight.css';

const FEATURED_GAME_IDS = [
  'CYBER_RACER',
  'ROOFTOP_SNIPERS',
  'EIGHT_BALL_POOL',
  'CHESS',
  'SLOPE_3D'
];

const SPOTLIGHT_EXTRAS = {
  CYBER_RACER: {
    tagline: 'HIT ARCADE RACER OF THE MONTH',
    tags: ['⚡ 3D Arcade', '🏎️ Hyperspeed', '🏆 Leaderboard Ready'],
    rating: '4.9 ★★★★★ (3.4K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(176, 38, 255, 0.25) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  ROOFTOP_SNIPERS: {
    tagline: 'TOP RATED 2-PLAYER PARTY DUEL',
    tags: ['🎯 Ragdoll Physics', '👥 2-Player Local', '💥 Intense Knockouts'],
    rating: '4.9 ★★★★★ (4.8K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2) 0%, rgba(255, 170, 0, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  EIGHT_BALL_POOL: {
    tagline: 'REALISTIC BILLIARDS SIMULATOR',
    tags: ['🎱 Physics Engine', '🎯 Fine Cue Spin', '👑 Pro Tournament'],
    rating: '4.8 ★★★★★ (2.9K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(0, 243, 255, 0.15) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  CHESS: {
    tagline: 'STRATEGIC MASTERCLASS',
    tags: ['♟️ Grandmaster AI', '💡 Hint Engine', '👥 Pass & Play'],
    rating: '5.0 ★★★★★ (5.1K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(176, 38, 255, 0.25) 0%, rgba(0, 243, 255, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
  },
  SLOPE_3D: {
    tagline: 'ULTRA REFLEX CHALLENGE',
    tags: ['🚀 Endless 3D Run', '⚡ Gravity Rush', '🔥 Ultra Addictive'],
    rating: '4.8 ★★★★★ (3.1K Reviews)',
    backdropGradient: 'linear-gradient(135deg, rgba(255, 51, 102, 0.25) 0%, rgba(0, 243, 255, 0.2) 50%, rgba(10, 10, 25, 0.95) 100%)'
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
            {activeExtras.rating}
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
              soundEffects.playStart();
              onSelectGame(activeGame.id);
            }}
          >
            <span className="btn-play-icon">▶</span>
            <span className="btn-play-text">PLAY FREE NOW</span>
            <span className="btn-glow-bar" />
          </button>

          {onToggleFavorite && (
            <button
              className={`btn-spotlight-favorite ${isFavorite ? 'active' : ''}`}
              onClick={(e) => onToggleFavorite(activeGame.id, e)}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <span className="fav-star">{isFavorite ? '★' : '☆'}</span>
              <span>{isFavorite ? 'FAVORITED' : 'WISHLIST'}</span>
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
