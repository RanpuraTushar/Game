import React, { useState, useEffect } from 'react';
import { GAMES_LIST } from '../../../../shared/gameMetadata.js';
import { 
  getGameReviews, 
  addGameReview, 
  getGameVotes, 
  voteGame, 
  addCoins 
} from '../../utils/portalEconomy';
import { soundEffects } from '../../utils/SoundEffects';
import './GameTheater.css';

const GameTheater = ({ 
  gameId, 
  user, 
  onBack, 
  onSelectGame,
  isFavorite = false,
  onToggleFavorite,
  children 
}) => {
  const [lightsOff, setLightsOff] = useState(false);
  const [votes, setVotes] = useState({ up: 142, down: 6, userVote: null });
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showControlsGuide, setShowControlsGuide] = useState(false);

  const game = GAMES_LIST.find(g => g.id === gameId);

  useEffect(() => {
    if (!gameId) return;
    setVotes(getGameVotes(gameId, user?.id));
    setReviews(getGameReviews(gameId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gameId, user]);

  const handleVote = (type) => {
    soundEffects.playClick();
    const updated = voteGame(gameId, type, user?.id);
    setVotes({ ...updated });
  };

  const handleShare = () => {
    soundEffects.playStar();
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    soundEffects.playTrophy();
    setIsSubmitting(true);

    const added = addGameReview(gameId, {
      username: user?.username || 'Pilot',
      avatar: user?.avatar || '👤',
      rating: newRating,
      comment: newComment
    });

    if (added) {
      setReviews([added, ...reviews]);
      setNewComment('');
      // Reward user with 25 coins for reviewing!
      addCoins(25, user?.id);
    }
    setIsSubmitting(false);
  };

  const relatedGames = GAMES_LIST
    .filter(g => g.id !== gameId && (g.category === game?.category || g.isMultiplayer))
    .slice(0, 6);

  if (!game) return <div className="game-theater-container">{children}</div>;

  return (
    <div className={`game-theater-container ${lightsOff ? 'theater-mode-dimmed' : ''}`}>
      {/* Top Header / Breadcrumb Navigation */}
      <div className="theater-top-bar">
        <button className="theater-back-btn" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span>ALL GAMES</span>
        </button>

        <div className="theater-breadcrumbs">
          <span className="crumb-cat">{game.category}</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-title">{game.icon} {game.title}</span>
        </div>

        <div className="theater-top-actions">
          <button 
            className={`btn-theater-light ${lightsOff ? 'active' : ''}`}
            onClick={() => setLightsOff(!lightsOff)}
            title="Toggle Theater Ambient Lighting"
          >
            {lightsOff ? '💡 LIGHTS ON' : '🎬 CINEMA MODE'}
          </button>
        </div>
      </div>

      {/* Main Game Cinema Arena */}
      <div className="theater-screen-wrapper">
        <div className="theater-screen-frame" style={{ '--glow-color': game.color || '#00f3ff' }}>
          {children}
        </div>
      </div>

      {/* Under-Game Utility & Interaction Toolbar */}
      <div className="theater-toolbar">
        <div className="toolbar-left">
          <div className="theater-game-identity">
            <span className="theater-game-icon">{game.icon}</span>
            <div>
              <h1 className="theater-game-title">{game.title}</h1>
              <span className="theater-dev-badge">⚡ Neon Arcade Official • Free to Play</span>
            </div>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Upvote / Downvote */}
          <div className="vote-btn-group">
            <button 
              className={`btn-vote ${votes.userVote === 'up' ? 'voted-up' : ''}`}
              onClick={() => handleVote('up')}
              title="Like this game"
            >
              👍 <span>{votes.up}</span>
            </button>
            <button 
              className={`btn-vote ${votes.userVote === 'down' ? 'voted-down' : ''}`}
              onClick={() => handleVote('down')}
              title="Dislike"
            >
              👎 <span>{votes.down}</span>
            </button>
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button 
              className={`btn-theater-action ${isFavorite ? 'active' : ''}`}
              onClick={(e) => onToggleFavorite(game.id, e)}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <span className="star-icon">{isFavorite ? '★' : '☆'}</span>
              <span>{isFavorite ? 'FAVORITED' : 'FAVORITE'}</span>
            </button>
          )}

          {/* Share Link */}
          <button 
            className="btn-theater-action"
            onClick={handleShare}
            title="Copy Game Link"
          >
            <span>🔗</span>
            <span>{copiedToast ? 'COPIED!' : 'SHARE'}</span>
          </button>

          {/* Controls Help */}
          <button 
            className={`btn-theater-action ${showControlsGuide ? 'active' : ''}`}
            onClick={() => setShowControlsGuide(!showControlsGuide)}
            title="View keyboard and mouse controls"
          >
            <span>🎮</span>
            <span>CONTROLS</span>
          </button>
        </div>
      </div>

      {/* Controls Quick Guide Drawer */}
      {showControlsGuide && (
        <div className="theater-controls-drawer">
          <div className="controls-drawer-header">
            <h4>🎮 HOW TO PLAY & CONTROLS</h4>
            <button className="btn-close-drawer" onClick={() => setShowControlsGuide(false)}>✕</button>
          </div>
          <p className="controls-drawer-text">{game.controls || 'Use mouse or tap to interact.'}</p>
        </div>
      )}

      {/* Below-Fold Content: Game Info, Related Games, Community Reviews */}
      <div className="theater-details-layout">
        {/* Left Column: Description & Community Reviews */}
        <div className="theater-main-details">
          {/* Description Card */}
          <section className="theater-desc-card">
            <h3 className="section-heading">ABOUT {game.title.toUpperCase()}</h3>
            <p className="game-full-desc">{game.description}</p>
            <div className="game-spec-grid">
              <div className="spec-item">
                <span className="spec-label">CATEGORY</span>
                <span className="spec-value">{game.category}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">PLAYERS</span>
                <span className="spec-value">{game.maxPlayers > 1 ? `1-${game.maxPlayers} Players` : 'Single Player'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">MULTIPLAYER</span>
                <span className="spec-value">{game.isMultiplayer ? 'Yes (Local / AI / Online)' : 'Single Player Solo'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">PLATFORM</span>
                <span className="spec-value">Web Browser & Mobile</span>
              </div>
            </div>
          </section>

          {/* Community Reviews & Ratings Section */}
          <section className="theater-reviews-section">
            <div className="reviews-section-header">
              <h3 className="section-heading">COMMUNITY REVIEWS & RATINGS</h3>
              {(() => {
                const totalScore = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
                const avgScore = reviews.length > 0 ? (totalScore / reviews.length).toFixed(1) : '5.0';
                return (
                  <span className="reviews-count-badge">★ {avgScore} ({reviews.length} reviews)</span>
                );
              })()}
            </div>

            {/* Leave a review form */}
            <form className="review-composer-form" onSubmit={handleSubmitReview}>
              <div className="composer-header">
                <span className="composer-avatar">{user?.avatar || '👤'}</span>
                <div className="star-rating-selector">
                  <span className="rating-label">YOUR RATING:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star-select-btn ${star <= newRating ? 'filled' : ''}`}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="composer-input-row">
                <input
                  type="text"
                  placeholder="Write your review, feedback, or tip for other players..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="review-input-field"
                  maxLength={250}
                />
                <button 
                  type="submit" 
                  className="btn-submit-review"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  POST REVIEW (+25 🪙)
                </button>
              </div>
            </form>

            {/* List of Reviews */}
            <div className="reviews-list">
              {reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="review-user-row">
                    <span className="rev-avatar">{rev.avatar || '👤'}</span>
                    <div className="rev-meta">
                      <span className="rev-username">{rev.username}</span>
                      <span className="rev-time">{rev.time}</span>
                    </div>
                    <div className="rev-stars">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <p className="rev-comment">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: "More Games Like This" Sidebar */}
        <aside className="theater-sidebar-related">
          <div className="related-shelf-header">
            <h4>MORE GAMES YOU'LL LOVE</h4>
            <span className="related-cat-tag">{game.category}</span>
          </div>

          <div className="related-games-list">
            {relatedGames.map(rel => (
              <div
                key={rel.id}
                className="related-game-card"
                onClick={() => onSelectGame(rel.id)}
                onMouseEnter={() => soundEffects.playHover()}
                title={`Play ${rel.title}`}
              >
                <div className="rel-icon-frame" style={{ '--rel-color': rel.color || '#00f3ff' }}>
                  <span className="rel-icon">{rel.icon}</span>
                </div>
                <div className="rel-info">
                  <span className="rel-title">{rel.title}</span>
                  <span className="rel-badge">{rel.badge || rel.category}</span>
                </div>
                <button className="rel-play-arrow">▶</button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GameTheater;
