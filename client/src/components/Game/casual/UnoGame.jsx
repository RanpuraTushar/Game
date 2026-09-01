import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './UnoGame.css';

const COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const COLOR_HEX = {
  RED: '#ff1744',
  BLUE: '#00b0ff',
  GREEN: '#00e676',
  YELLOW: '#ffd600',
  WILD: '#e040fb'
};

const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'SKIP', 'REVERSE', 'DRAW2'];

const UnoGame = ({ user, onLeave }) => {
  const [gameMode, setGameMode] = useState('FOUR_PLAYER'); // 'FOUR_PLAYER' (You vs 3 Bots) or 'TWO_PLAYER' (Pass & Play)
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [p1Hand, setP1Hand] = useState([]);
  const [bot1Hand, setBot1Hand] = useState([]); // Left Bot
  const [bot2Hand, setBot2Hand] = useState([]); // Top Bot (or P2 in 2P mode)
  const [bot3Hand, setBot3Hand] = useState([]); // Right Bot
  const [turnIndex, setTurnIndex] = useState(0); // 0: P1, 1: Bot1/P2, 2: Bot2, 3: Bot3
  const [direction, setDirection] = useState(1); // 1: Clockwise, -1: Counter-Clockwise
  const [currentColor, setCurrentColor] = useState('RED');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [calledUno, setCalledUno] = useState({});
  const [turnMessage, setTurnMessage] = useState('Your Turn! Match color or number');
  const [passScreen, setPassScreen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, [gameMode]);

  const generateFullDeck = () => {
    const full = [];
    let cid = 1;

    COLORS.forEach(c => {
      VALUES.forEach(v => {
        full.push({ id: cid++, color: c, value: v });
        if (v !== '0') full.push({ id: cid++, color: c, value: v });
      });
    });

    // 4 Wild + 4 Wild Draw 4
    for (let i = 0; i < 4; i++) {
      full.push({ id: cid++, color: 'WILD', value: 'WILD' });
      full.push({ id: cid++, color: 'WILD', value: 'WILD_DRAW4' });
    }

    // Shuffle 3 times
    for (let s = 0; s < 3; s++) {
      for (let i = full.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [full[i], full[j]] = [full[j], full[i]];
      }
    }

    return full;
  };

  const startNewGame = () => {
    const sDeck = generateFullDeck();
    const p1 = sDeck.splice(0, 7);
    const b1 = sDeck.splice(0, 7);
    const b2 = sDeck.splice(0, 7);
    const b3 = sDeck.splice(0, 7);

    // Initial discard card
    let first = sDeck.pop();
    while (first.value === 'WILD_DRAW4') {
      sDeck.unshift(first);
      first = sDeck.pop();
    }

    setDeck(sDeck);
    setP1Hand(p1);
    setBot1Hand(b1);
    setBot2Hand(b2);
    setBot3Hand(b3);
    setDiscardPile([{ ...first, rotation: (Math.random() - 0.5) * 16 }]);
    setCurrentColor(first.color === 'WILD' ? 'RED' : first.color);
    setTurnIndex(0);
    setDirection(1);
    setShowColorPicker(false);
    setPendingWildCard(null);
    setCalledUno({});
    setPassScreen(false);
    setGameOver(false);
    setWinner(null);
    setTurnMessage('Your Turn! Match color or number');
  };

  const topCard = discardPile[discardPile.length - 1] || null;

  const isCardPlayable = (card) => {
    if (!topCard) return true;
    if (card.color === 'WILD') return true;
    if (card.color === currentColor) return true;
    if (card.value === topCard.value) return true;
    return false;
  };

  const getPlayerName = (idx) => {
    if (idx === 0) return 'Player 1';
    if (gameMode === 'TWO_PLAYER') return 'Player 2';
    if (idx === 1) return 'Nova Bot (Left)';
    if (idx === 2) return 'Apex Bot (Top)';
    return 'Viper Bot (Right)';
  };

  const handleCardClick = (card, playerIdx) => {
    if (gameOver || showColorPicker) return;
    if (playerIdx !== turnIndex) return;

    if (!isCardPlayable(card)) {
      SoundEffects.playLoss();
      return;
    }

    if (card.color === 'WILD') {
      setPendingWildCard({ card, playerIdx });
      setShowColorPicker(true);
      return;
    }

    playCard(card, playerIdx, card.color);
  };

  const playCard = (card, playerIdx, chosenColor) => {
    SoundEffects.playTokenStep();

    // Remove from active hand
    let remainingHandSize = 0;
    if (playerIdx === 0) {
      setP1Hand(prev => {
        const next = prev.filter(c => c.id !== card.id);
        remainingHandSize = next.length;
        return next;
      });
    } else if (playerIdx === 1) {
      setBot1Hand(prev => {
        const next = prev.filter(c => c.id !== card.id);
        remainingHandSize = next.length;
        return next;
      });
    } else if (playerIdx === 2) {
      setBot2Hand(prev => {
        const next = prev.filter(c => c.id !== card.id);
        remainingHandSize = next.length;
        return next;
      });
    } else {
      setBot3Hand(prev => {
        const next = prev.filter(c => c.id !== card.id);
        remainingHandSize = next.length;
        return next;
      });
    }

    const newDiscard = [...discardPile, { ...card, rotation: (Math.random() - 0.5) * 18 }];
    setDiscardPile(newDiscard);
    setCurrentColor(chosenColor);

    // Check Victory
    if (remainingHandSize === 0) {
      triggerWin(playerIdx === 0 ? 'PLAYER 1' : getPlayerName(playerIdx).toUpperCase());
      return;
    }

    // Process Action Cards (Skip, Reverse, Draw2, WildDraw4)
    const numPlayers = gameMode === 'TWO_PLAYER' ? 2 : 4;
    let nextIdx = (playerIdx + direction + numPlayers) % numPlayers;
    let newDir = direction;
    let msg = `${getPlayerName(nextIdx)}'s Turn`;

    if (card.value === 'REVERSE') {
      newDir = direction * -1;
      setDirection(newDir);
      if (numPlayers === 2) nextIdx = playerIdx; // 1v1 reverse acts like skip
      else nextIdx = (playerIdx + newDir + numPlayers) % numPlayers;
      msg = `🔄 Reverse! Direction changed. ${getPlayerName(nextIdx)}'s Turn.`;
    } else if (card.value === 'SKIP') {
      nextIdx = (nextIdx + newDir + numPlayers) % numPlayers;
      msg = `🚫 Skip! ${getPlayerName(playerIdx)} skipped ${getPlayerName((playerIdx + newDir + numPlayers) % numPlayers)}!`;
    } else if (card.value === 'DRAW2') {
      drawCardsForPlayer(nextIdx, 2);
      msg = `➕2️⃣ ${getPlayerName(nextIdx)} draws 2 and loses turn!`;
      nextIdx = (nextIdx + newDir + numPlayers) % numPlayers;
    } else if (card.value === 'WILD_DRAW4') {
      drawCardsForPlayer(nextIdx, 4);
      msg = `🌈+4️⃣ ${getPlayerName(nextIdx)} draws 4! Color set to ${chosenColor}.`;
      nextIdx = (nextIdx + newDir + numPlayers) % numPlayers;
    }

    setTurnIndex(nextIdx);
    setTurnMessage(msg);

    // Prompt Pass Device for 2P local mode or trigger Bot turn
    if (gameMode === 'TWO_PLAYER' && nextIdx !== 0) {
      setPassScreen(true);
    } else if (nextIdx !== 0) {
      setTimeout(() => executeBotTurn(nextIdx, chosenColor), 950);
    }
  };

  const drawCardsForPlayer = (targetIdx, count) => {
    const sDeck = [...deck];
    if (sDeck.length < count) sDeck.push(...generateFullDeck());
    const drawn = sDeck.splice(0, count);
    setDeck(sDeck);
    SoundEffects.playSafe();

    if (targetIdx === 0) setP1Hand(h => [...h, ...drawn]);
    else if (targetIdx === 1) setBot1Hand(h => [...h, ...drawn]);
    else if (targetIdx === 2) setBot2Hand(h => [...h, ...drawn]);
    else setBot3Hand(h => [...h, ...drawn]);
  };

  const handleDrawCard = () => {
    if (gameOver || showColorPicker) return;
    if (turnIndex !== 0 && gameMode === 'FOUR_PLAYER') return;

    const sDeck = [...deck];
    if (sDeck.length === 0) sDeck.push(...generateFullDeck());
    const drawn = sDeck.pop();
    setDeck(sDeck);
    SoundEffects.playClick();

    if (turnIndex === 0) setP1Hand(h => [...h, drawn]);
    else setBot2Hand(h => [...h, drawn]);

    const numPlayers = gameMode === 'TWO_PLAYER' ? 2 : 4;
    const nextIdx = (turnIndex + direction + numPlayers) % numPlayers;
    setTurnIndex(nextIdx);
    setTurnMessage(`${getPlayerName(nextIdx)}'s Turn`);

    if (gameMode === 'TWO_PLAYER') {
      setPassScreen(true);
    } else if (nextIdx !== 0) {
      setTimeout(() => executeBotTurn(nextIdx, currentColor), 950);
    }
  };

  const executeBotTurn = (botIdx, activeCol) => {
    if (gameOver) return;

    let botHand = botIdx === 1 ? bot1Hand : botIdx === 2 ? bot2Hand : bot3Hand;
    const playable = botHand.filter(c => isCardPlayable(c));

    if (playable.length > 0) {
      const chosen = playable[Math.floor(Math.random() * playable.length)];
      const nextCol = chosen.color === 'WILD' ? COLORS[Math.floor(Math.random() * 4)] : chosen.color;
      playCard(chosen, botIdx, nextCol);
    } else {
      // Draw card
      const sDeck = [...deck];
      if (sDeck.length === 0) sDeck.push(...generateFullDeck());
      const drawn = sDeck.pop();
      setDeck(sDeck);

      if (botIdx === 1) setBot1Hand(h => [...h, drawn]);
      else if (botIdx === 2) setBot2Hand(h => [...h, drawn]);
      else setBot3Hand(h => [...h, drawn]);

      SoundEffects.playClick();

      const numPlayers = gameMode === 'TWO_PLAYER' ? 2 : 4;
      const nextIdx = (botIdx + direction + numPlayers) % numPlayers;
      setTurnIndex(nextIdx);
      setTurnMessage(`${getPlayerName(botIdx)} drew a card. ${getPlayerName(nextIdx)}'s Turn.`);

      if (nextIdx !== 0) {
        setTimeout(() => executeBotTurn(nextIdx, currentColor), 950);
      }
    }
  };

  const handleColorSelect = (color) => {
    if (!pendingWildCard) return;
    const { card, playerIdx } = pendingWildCard;
    setShowColorPicker(false);
    setPendingWildCard(null);
    playCard(card, playerIdx, color);
  };

  const handleCallUno = () => {
    SoundEffects.playWin();
    setCalledUno(prev => ({ ...prev, [turnIndex]: true }));
  };

  const triggerWin = async (winnerName) => {
    setGameOver(true);
    setWinner(winnerName);
    SoundEffects.playWin();
    const isP1Win = winnerName === 'PLAYER 1';
    const res = await api.submitScore('UNO', 650, isP1Win, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  return (
    <div className="uno-container glass-panel">
      {/* Top Header */}
      <div className="uno-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'FOUR_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('FOUR_PLAYER')}
          >
            👥 4-PLAYER TABLE (VS 3 BOTS)
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER PASS & PLAY
          </button>
        </div>

        <button className="btn-tertiary" onClick={startNewGame}>↺ RE-DEAL</button>
      </div>

      {/* Turn & Color Dashboard */}
      <div className="uno-status-bar">
        <div className="current-color-badge" style={{ backgroundColor: COLOR_HEX[currentColor] || '#ff1744' }}>
          COLOR: <strong>{currentColor}</strong>
        </div>

        <div className="uno-turn-text" style={{ color: turnIndex === 0 ? '#00f3ff' : '#ff007f' }}>
          {direction === 1 ? '🔄 ↷ ' : '🔄 ↶ '} {turnMessage}
        </div>

        <div className="cards-counter">
          <span>P1: {p1Hand.length}</span> &bull; 
          {gameMode === 'FOUR_PLAYER' ? (
            <span> B1: {bot1Hand.length} | B2: {bot2Hand.length} | B3: {bot3Hand.length}</span>
          ) : (
            <span> P2: {bot2Hand.length}</span>
          )}
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 4-Player Table Layout */}
      <div className="uno-arena-table">
        {/* Top Player / Bot 2 */}
        <div className={`table-seat top ${turnIndex === 2 || (gameMode === 'TWO_PLAYER' && turnIndex === 1) ? 'active-turn' : ''}`}>
          <span className="seat-label">{gameMode === 'TWO_PLAYER' ? 'PLAYER 2' : 'APEX BOT'} ({bot2Hand.length})</span>
          <div className="seat-cards-fan">
            {bot2Hand.slice(0, 10).map((_, i) => (
              <div key={i} className="uno-mini-card-back" />
            ))}
          </div>
        </div>

        {/* Left Bot 1 (4P Mode) */}
        {gameMode === 'FOUR_PLAYER' && (
          <div className={`table-seat left ${turnIndex === 1 ? 'active-turn' : ''}`}>
            <span className="seat-label">NOVA BOT ({bot1Hand.length})</span>
            <div className="seat-cards-fan vertical">
              {bot1Hand.slice(0, 8).map((_, i) => (
                <div key={i} className="uno-mini-card-back" />
              ))}
            </div>
          </div>
        )}

        {/* Center Table (Draw Deck & Realistic Discard Pile) */}
        <div className="uno-center-felt">
          {/* Draw Pile */}
          <div className="uno-deck-stack" onClick={handleDrawCard} title="Click to Draw a Card">
            <div className="uno-card deck-card">
              <div className="uno-logo-oval">UNO</div>
            </div>
            <span className="deck-tag">DRAW ({deck.length})</span>
          </div>

          {/* Top Discard Card */}
          {topCard && (
            <div className="uno-discard-stack">
              <div
                className="uno-card discard-card"
                style={{
                  backgroundColor: COLOR_HEX[topCard.color] || COLOR_HEX[currentColor],
                  transform: `rotate(${topCard.rotation || 0}deg)`,
                  boxShadow: `0 0 25px ${COLOR_HEX[currentColor]}`
                }}
              >
                <span className="c-corner top-l">{topCard.value}</span>
                <div className="c-center-oval">
                  {topCard.value === 'SKIP' ? '🚫' :
                   topCard.value === 'REVERSE' ? '🔄' :
                   topCard.value === 'DRAW2' ? '+2' :
                   topCard.value === 'WILD_DRAW4' ? '+4' :
                   topCard.value === 'WILD' ? '🌈' : topCard.value}
                </div>
                <span className="c-corner bot-r">{topCard.value}</span>
              </div>
              <span className="deck-tag">DISCARD</span>
            </div>
          )}

          {/* UNO Button Callout */}
          {p1Hand.length === 2 && turnIndex === 0 && (
            <button className="uno-shout-banner-btn" onClick={handleCallUno}>
              🔥 CALL UNO!
            </button>
          )}
        </div>

        {/* Right Bot 3 (4P Mode) */}
        {gameMode === 'FOUR_PLAYER' && (
          <div className={`table-seat right ${turnIndex === 3 ? 'active-turn' : ''}`}>
            <span className="seat-label">VIPER BOT ({bot3Hand.length})</span>
            <div className="seat-cards-fan vertical">
              {bot3Hand.slice(0, 8).map((_, i) => (
                <div key={i} className="uno-mini-card-back" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wild Color Selection Wheel Modal */}
      {showColorPicker && (
        <div className="wild-wheel-overlay">
          <h3 className="neon-text">SELECT NEXT COLOR</h3>
          <div className="wild-wheel-grid">
            {COLORS.map(c => (
              <button
                key={c}
                className="color-quad-btn"
                style={{ backgroundColor: COLOR_HEX[c] }}
                onClick={() => handleColorSelect(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pass Device Shield Screen (2-Player Mode) */}
      {passScreen && (
        <div className="pass-shield-overlay">
          <h2 className="neon-text" style={{ color: '#00f3ff' }}>
            PASS DEVICE TO {turnIndex === 0 ? 'PLAYER 1' : 'PLAYER 2'}
          </h2>
          <p style={{ color: '#ccc', margin: '15px 0' }}>Keep your cards secret!</p>
          <button className="btn-primary" onClick={() => setPassScreen(false)}>
            I AM READY →
          </button>
        </div>
      )}

      {/* Player Hand (Realistic Fan Deck with Hover Lift) */}
      <div className="player-hand-section">
        <span className="hand-owner-lbl">
          {turnIndex === 0 ? 'YOUR CARDS (PLAYER 1)' : gameMode === 'TWO_PLAYER' ? 'PLAYER 2 CARDS' : 'YOUR CARDS'}
        </span>
        <div className="player-cards-fan">
          {(turnIndex === 0 || gameMode === 'FOUR_PLAYER' ? p1Hand : bot2Hand).map((card, idx, arr) => {
            const playable = isCardPlayable(card);
            const mid = (arr.length - 1) / 2;
            const rot = (idx - mid) * 3.5;
            const yOffset = Math.abs(idx - mid) * 4;

            return (
              <div
                key={card.id}
                className={`uno-card hand-card ${playable ? 'playable' : 'disabled'}`}
                style={{
                  backgroundColor: COLOR_HEX[card.color] || '#e040fb',
                  transform: `rotate(${rot}deg) translateY(${yOffset}px)`,
                  boxShadow: playable ? `0 0 16px ${COLOR_HEX[card.color] || '#e040fb'}` : 'none'
                }}
                onClick={() => handleCardClick(card, turnIndex === 0 ? 0 : 1)}
              >
                <span className="c-corner top-l">{card.value}</span>
                <div className="c-center-oval">
                  {card.value === 'SKIP' ? '🚫' :
                   card.value === 'REVERSE' ? '🔄' :
                   card.value === 'DRAW2' ? '+2' :
                   card.value === 'WILD_DRAW4' ? '+4' :
                   card.value === 'WILD' ? '🌈' : card.value}
                </div>
                <span className="c-corner bot-r">{card.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="uno-hint">
        💡 Match color or number to play. Tap the <strong>DRAW PILE</strong> if you have no playable card!
      </p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} WON THE UNO MATCH!
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnoGame;
