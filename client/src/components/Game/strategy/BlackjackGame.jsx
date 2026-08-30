import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BlackjackGame.css';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const BlackjackGame = ({ user, onLeave }) => {
  const [chips, setChips] = useState(500);
  const [currentBet, setCurrentBet] = useState(25);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('BETTING'); // 'BETTING', 'PLAYING', 'DEALER_TURN', 'FINISHED'
  const [gameMessage, setGameMessage] = useState('');
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    initDeck();
  }, []);

  const initDeck = () => {
    const newDeck = [];
    SUITS.forEach(suit => {
      VALUES.forEach(val => {
        let numVal = parseInt(val);
        if (['J', 'Q', 'K'].includes(val)) numVal = 10;
        if (val === 'A') numVal = 11;
        newDeck.push({ suit, val, numVal, isRed: ['♥', '♦'].includes(suit) });
      });
    });

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    setDeck(newDeck);
    return newDeck;
  };

  const calculateHandValue = (hand) => {
    let sum = 0;
    let aceCount = 0;
    hand.forEach(c => {
      sum += c.numVal;
      if (c.val === 'A') aceCount++;
    });

    while (sum > 21 && aceCount > 0) {
      sum -= 10;
      aceCount--;
    }
    return sum;
  };

  const handleDeal = () => {
    if (chips < currentBet) return;
    setChips(c => c - currentBet);

    let currentDeck = [...deck];
    if (currentDeck.length < 15) {
      currentDeck = initDeck();
    }

    const p1 = currentDeck.pop();
    const d1 = currentDeck.pop();
    const p2 = currentDeck.pop();
    const d2 = currentDeck.pop();

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setDeck(currentDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('PLAYING');
    setGameMessage('');
    SoundEffects.playClick();

    // Check Natural Blackjack
    const pVal = calculateHandValue(pHand);
    if (pVal === 21) {
      handleStand(pHand, dHand, currentDeck, true);
    }
  };

  const handleHit = () => {
    if (gameState !== 'PLAYING') return;

    const currentDeck = [...deck];
    const newCard = currentDeck.pop();
    const newPHand = [...playerHand, newCard];

    setDeck(currentDeck);
    setPlayerHand(newPHand);
    SoundEffects.playTokenStep();

    const val = calculateHandValue(newPHand);
    if (val > 21) {
      // Bust
      setGameState('FINISHED');
      setGameMessage('BUST! OVER 21');
      SoundEffects.playLoss();
    } else if (val === 21) {
      handleStand(newPHand, dealerHand, currentDeck, false);
    }
  };

  const handleDoubleDown = () => {
    if (gameState !== 'PLAYING' || chips < currentBet) return;

    setChips(c => c - currentBet);
    const doubledBet = currentBet * 2;

    const currentDeck = [...deck];
    const newCard = currentDeck.pop();
    const newPHand = [...playerHand, newCard];

    setDeck(currentDeck);
    setPlayerHand(newPHand);
    SoundEffects.playSafe();

    const val = calculateHandValue(newPHand);
    if (val > 21) {
      setGameState('FINISHED');
      setGameMessage('BUST! OVER 21');
      SoundEffects.playLoss();
    } else {
      handleStand(newPHand, dealerHand, currentDeck, false, doubledBet);
    }
  };

  const handleStand = (pHand = playerHand, dHand = dealerHand, currDeck = deck, isNatural = false, betAmount = currentBet) => {
    setGameState('DEALER_TURN');
    let workingDeck = [...currDeck];
    let workingDHand = [...dHand];
    let dVal = calculateHandValue(workingDHand);

    // Dealer hits until >= 17
    while (dVal < 17) {
      const card = workingDeck.pop();
      workingDHand.push(card);
      dVal = calculateHandValue(workingDHand);
    }

    setDeck(workingDeck);
    setDealerHand(workingDHand);
    setGameState('FINISHED');

    const pVal = calculateHandValue(pHand);

    // Determine Winner
    if (isNatural && dVal !== 21) {
      // Blackjack Payout 3:2
      const winPayout = Math.floor(betAmount * 2.5);
      setChips(c => c + winPayout);
      setGameMessage('BLACKJACK! PAYS 3:2');
      SoundEffects.playWin();
      awardScore(winPayout);
    } else if (dVal > 21) {
      const winPayout = betAmount * 2;
      setChips(c => c + winPayout);
      setGameMessage('DEALER BUST! YOU WIN');
      SoundEffects.playWin();
      awardScore(winPayout);
    } else if (pVal > dVal) {
      const winPayout = betAmount * 2;
      setChips(c => c + winPayout);
      setGameMessage('YOU WIN!');
      SoundEffects.playWin();
      awardScore(winPayout);
    } else if (pVal < dVal) {
      setGameMessage('DEALER WINS');
      SoundEffects.playLoss();
    } else {
      setChips(c => c + betAmount);
      setGameMessage('PUSH (TIE)');
      SoundEffects.playTokenStep();
    }
  };

  const awardScore = async (amount) => {
    const res = await api.submitScore('BLACKJACK', amount, true, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const pScore = calculateHandValue(playerHand);
  const dScore = gameState === 'PLAYING' ? dealerHand[0]?.numVal || 0 : calculateHandValue(dealerHand);

  return (
    <div className="blackjack-container glass-panel">
      <div className="bj-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="bj-chips-box">
          BANKROLL: <strong style={{ color: '#00ff66' }}>{chips} 🪙</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Cyber Table Felt */}
      <div className="bj-table">
        {/* Dealer Section */}
        <div className="hand-section">
          <div className="hand-label">
            DEALER {gameState !== 'BETTING' && `(${gameState === 'PLAYING' ? `${dealerHand[0]?.val} + ?` : dScore})`}
          </div>
          <div className="cards-row">
            {dealerHand.map((c, idx) => {
              const isHidden = idx === 1 && gameState === 'PLAYING';
              return (
                <div key={idx} className={`bj-card ${isHidden ? 'card-back' : c.isRed ? 'red-card' : 'black-card'}`}>
                  {!isHidden ? (
                    <>
                      <span className="card-val">{c.val}</span>
                      <span className="card-suit">{c.suit}</span>
                    </>
                  ) : '🌌'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Game Status Message */}
        {gameMessage && <div className="bj-game-message neon-text">{gameMessage}</div>}

        {/* Player Section */}
        <div className="hand-section">
          <div className="cards-row">
            {playerHand.map((c, idx) => (
              <div key={idx} className={`bj-card ${c.isRed ? 'red-card' : 'black-card'}`}>
                <span className="card-val">{c.val}</span>
                <span className="card-suit">{c.suit}</span>
              </div>
            ))}
          </div>
          <div className="hand-label">
            YOU {gameState !== 'BETTING' && `(${pScore})`}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="bj-controls-bar">
        {gameState === 'BETTING' || gameState === 'FINISHED' ? (
          <div className="betting-controls">
            <div className="chip-buttons">
              {[10, 25, 50, 100].map(amt => (
                <button
                  key={amt}
                  className={`chip-btn ${currentBet === amt ? 'active' : ''}`}
                  onClick={() => setCurrentBet(amt)}
                >
                  {amt} 🪙
                </button>
              ))}
            </div>
            <button className="btn-primary deal-btn" onClick={handleDeal} disabled={chips < currentBet}>
              DEAL ({currentBet} 🪙)
            </button>
          </div>
        ) : (
          <div className="playing-controls">
            <button className="btn-primary action-btn" onClick={handleHit}>HIT</button>
            <button className="btn-secondary action-btn" onClick={() => handleStand()}>STAND</button>
            <button className="btn-tertiary action-btn" onClick={handleDoubleDown} disabled={chips < currentBet || playerHand.length > 2}>
              DOUBLE DOWN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackjackGame;
