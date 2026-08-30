import React, { useState } from 'react';
import './AuthForms.css';

const AuthForms = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { username: username.trim(), password } 
      : { username: username.trim(), email: email.trim(), password };

    try {
      const response = await fetch(`http://${window.location.hostname}:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Store JWT token & user session
      localStorage.setItem('games_token', data.token);
      localStorage.setItem('games_user', JSON.stringify(data));
      
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Connection error. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlay = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const guestName = `Player_${randomNum}`;
    setUsername(guestName);
    setPassword('player123');
    if (!isLogin) {
      setEmail(`player_${randomNum}@cyberarcade.com`);
    }
  };

  return (
    <div className="cyber-auth-wrapper">
      {/* Background Animated Ambient Lights */}
      <div className="auth-ambient-glow auth-glow-1"></div>
      <div className="auth-ambient-glow auth-glow-2"></div>
      <div className="auth-ambient-glow auth-glow-3"></div>

      <div className="cyber-auth-card">
        {/* Left Side: Arcade Hero Banner */}
        <div className="auth-hero-panel">
          <div className="hero-top-badge">
            <span className="hero-status-dot"></span>
            <span>CYBER ARCADE • 12 GAMES READY</span>
          </div>

          <div className="hero-brand-section">
            <div className="hero-logo-icon">🎮</div>
            <h1 className="hero-title">
              CYBER <span className="hero-title-highlight">ARCADE</span>
            </h1>
            <p className="hero-subtitle">
              Your ultimate online arcade station. Play 12+ retro and multiplayer hit games, challenge friends in real-time, and reach the top ranks!
            </p>
          </div>

          <div className="hero-feature-pills">
            <div className="feature-pill">
              <span className="pill-icon">⚔️</span>
              <div className="pill-content">
                <strong>Real-Time 1v1 Multiplayer</strong>
                <small>Ludo, Snake, Pong, Tic-Tac-Toe & Connect 4</small>
              </div>
            </div>
            <div className="feature-pill">
              <span className="pill-icon">🕹️</span>
              <div className="pill-content">
                <strong>Classic & Puzzle Hits</strong>
                <small>Wordle, 2048, Brick Breaker, Piano Tiles</small>
              </div>
            </div>
            <div className="feature-pill">
              <span className="pill-icon">🏆</span>
              <div className="pill-content">
                <strong>Global Leaderboards</strong>
                <small>Track high scores and compete for #1 rank</small>
              </div>
            </div>
          </div>

          <div className="hero-footer-status">
            <div className="live-stat">
              <span className="stat-num">12</span>
              <span className="stat-label">Hit Games</span>
            </div>
            <div className="stat-divider"></div>
            <div className="live-stat">
              <span className="stat-num">Free</span>
              <span className="stat-label">Instant Play</span>
            </div>
            <div className="stat-divider"></div>
            <div className="live-stat">
              <span className="stat-num">Live</span>
              <span className="stat-label">Multiplayer</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Auth Form */}
        <div className="auth-form-panel">
          {/* Top Bar Indicator */}
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="terminal-tag">CYBER ARCADE • AUTHENTICATION</div>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tab-switch">
            <button 
              type="button"
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              <span>🔑</span> LOGIN
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              <span>✨</span> CREATE ACCOUNT
            </button>
          </div>

          {/* Form Heading */}
          <div className="form-heading-area">
            <h2 className="form-main-title">
              {isLogin ? 'Welcome Back!' : 'Create New Account'}
            </h2>
            <p className="form-desc">
              {isLogin 
                ? 'Enter your username and password to start playing.' 
                : 'Sign up in seconds to play games and save your high scores.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="auth-error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="auth-form-fields">
            {/* Username Input */}
            <div className="input-group">
              <label className="input-label">
                <span>👤</span> USERNAME
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. AlexGamer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="cyber-form-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email Input (Register Only) */}
            {!isLogin && (
              <div className="input-group">
                <label className="input-label">
                  <span>✉️</span> EMAIL ADDRESS
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="cyber-form-input"
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password Input with Show/Hide Toggle */}
            <div className="input-group">
              <label className="input-label">
                <span>🔒</span> PASSWORD
              </label>
              <div className="input-wrapper password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="cyber-form-input"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions-area">
              <button 
                type="submit" 
                className="cyber-submit-btn"
                disabled={loading}
              >
                <span className="btn-glow-layer"></span>
                <span className="btn-text">
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      LOGGING IN...
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'LOGIN NOW' : 'CREATE ACCOUNT'}</span>
                      <span className="btn-arrow">➔</span>
                    </>
                  )}
                </span>
              </button>

              {/* Quick Guest Play Fill */}
              <button
                type="button"
                className="quick-pilot-btn"
                onClick={handleQuickPlay}
                title="Fill a random username & password for instant play"
              >
                <span>🎲</span> Quick Guest Fill
              </button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="auth-bottom-switch">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button 
              type="button" 
              className="switch-link-btn"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? "Create account" : "Login here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForms;
