import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SolitaireGame.css';

const SUITS = [
  { id: 'SPADES', symbol: '♠', color: 'black' },
  { id: 'HEARTS', symbol: '♥', color: 'red' },
  { id: 'DIAMONDS', symbol: '♦', color: 'red' },
  { id: 'CLUBS', symbol: '♣', color: 'black' }
];

const VALUES = [
  { rank: 1, label: 'A' },
  { rank: 2, label: '2' },
  { rank: 3, label: '3' },
  { rank: 4, label: '4' },
  { rank: 5, label: '5' },
  { rank: 6, label: '6' },
  { rank: 7, label: '7' },
  { rank: 8, label: '8' },
  { rank: 9, label: '9' },
  { rank: 10, label: '10' },
  { rank: 11, label: 'J' },
  { rank: 12, label: 'Q' },
  { rank: 13, label: 'K' }
];

const SolitaireGame = ({ user, onLeave }) => {
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState([[], [], [], []]);
  const [tableaus, setTableaus] = useState([[], [], [], [], [], [], []]);
  const [selectedCard, setSelectedCard] = useState(null); // { source: 'waste' | 'tableau', colIdx?, cardIdx? }
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Generate and deal standard 52-card Klondike deck
  const dealGame = () => {
    const deck = [];
    SUITS.forEach(s => {
      VALUES.forEach(v => {
        deck.push({
          suit: s.id,
          symbol: s.symbol,
          color: s.color,
          rank: v.rank,
          label: v.label,
          faceUp: false,
          id: `${s.id}-${v.rank}`
        });
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal 7 tableaus
    const newTableaus = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        if (row === col) card.faceUp = true;
        newTableaus[col].push(card);
      }
    }

    setStock(deck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableaus(newTableaus);
    setSelectedCard(null);
    setMoves(0);
    setScore(0);
    setTimer(0);
    setGameWon(false);
    SoundEffects.playMove();
  };

  useEffect(() => {
    dealGame();
  }, []);

  // Timer Tick
  useEffect(() => {
    if (gameWon) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameWon]);

  // Click Stock to draw card into waste
  const handleStockClick = () => {
    if (stock.length > 0) {
      const newStock = [...stock];
      const drawn = newStock.pop();
      drawn.faceUp = true;
      setStock(newStock);
      setWaste(prev => [...prev, drawn]);
      SoundEffects.playClick();
    } else if (waste.length > 0) {
      // Recycle waste back to stock
      const recycled = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      SoundEffects.playMove();
    }
  };

  // Check if a card can be placed on a tableau column
  const canPlaceOnTableau = (card, targetCol) => {
    const colCards = tableaus[targetCol];
    if (colCards.length === 0) {
      return card.rank === 13; // Only Kings can be placed on empty slots
    }
    const topCard = colCards[colCards.length - 1];
    return topCard.faceUp && topCard.color !== card.color && topCard.rank === card.rank + 1;
  };

  // Check if a card can be placed on a foundation pile
  const canPlaceOnFoundation = (card, fIdx) => {
    const pile = foundations[fIdx];
    if (pile.length === 0) {
      return card.rank === 1; // Aces start foundation
    }
    const topCard = pile[pile.length - 1];
    return topCard.suit === card.suit && topCard.rank + 1 === card.rank;
  };

  // Double Click / Tap card to Auto-move to Foundation
  const handleDoubleClickCard = (card, source, colIdx) => {
    if (!card.faceUp) return;

    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, f)) {
        // Move to foundation f
        const newFoundations = foundations.map(arr => [...arr]);
        newFoundations[f].push(card);
        setFoundations(newFoundations);

        if (source === 'waste') {
          setWaste(prev => prev.slice(0, -1));
        } else if (source === 'tableau') {
          const newTableaus = tableaus.map(arr => [...arr]);
          newTableaus[colIdx].pop();
          // Reveal next card
          if (newTableaus[colIdx].length > 0) {
            newTableaus[colIdx][newTableaus[colIdx].length - 1].faceUp = true;
          }
          setTableaus(newTableaus);
        }

        setScore(s => s + 50);
        setMoves(m => m + 1);
        SoundEffects.playCapture();
        checkWin(newFoundations);
        return;
      }
    }
  };

  const handleTableauClick = (colIdx, cardIdx) => {
    const col = tableaus[colIdx];

    // Flip face down top card
    if (col.length > 0 && cardIdx === col.length - 1 && !col[cardIdx].faceUp) {
      const newTableaus = tableaus.map(arr => [...arr]);
      newTableaus[colIdx][cardIdx].faceUp = true;
      setTableaus(newTableaus);
      SoundEffects.playClick();
      return;
    }

    // Move selected card to this tableau
    if (selectedCard) {
      let movingCards = [];

      if (selectedCard.source === 'waste') {
        const topWaste = waste[waste.length - 1];
        if (canPlaceOnTableau(topWaste, colIdx)) {
          const newWaste = waste.slice(0, -1);
          const newTableaus = tableaus.map(arr => [...arr]);
          newTableaus[colIdx].push(topWaste);

          setWaste(newWaste);
          setTableaus(newTableaus);
          setSelectedCard(null);
          setMoves(m => m + 1);
          setScore(s => s + 10);
          SoundEffects.playMove();
        } else {
          setSelectedCard(null);
        }
      } else if (selectedCard.source === 'tableau') {
        const fromCol = selectedCard.colIdx;
        const fromIdx = selectedCard.cardIdx;
        const subStack = tableaus[fromCol].slice(fromIdx);

        if (canPlaceOnTableau(subStack[0], colIdx)) {
          const newTableaus = tableaus.map(arr => [...arr]);
          newTableaus[fromCol] = newTableaus[fromCol].slice(0, fromIdx);
          if (newTableaus[fromCol].length > 0) {
            newTableaus[fromCol][newTableaus[fromCol].length - 1].faceUp = true;
          }
          newTableaus[colIdx].push(...subStack);

          setTableaus(newTableaus);
          setSelectedCard(null);
          setMoves(m => m + 1);
          setScore(s => s + 10);
          SoundEffects.playMove();
        } else {
          setSelectedCard(null);
        }
      }
      return;
    }

    // Select card in tableau
    if (cardIdx !== undefined && col[cardIdx]?.faceUp) {
      setSelectedCard({ source: 'tableau', colIdx, cardIdx });
      SoundEffects.playClick();
    }
  };

  const handleFoundationClick = (fIdx) => {
    if (!selectedCard) return;

    let candidate = null;
    if (selectedCard.source === 'waste') {
      candidate = waste[waste.length - 1];
    } else if (selectedCard.source === 'tableau') {
      const col = tableaus[selectedCard.colIdx];
      if (selectedCard.cardIdx === col.length - 1) {
        candidate = col[col.length - 1];
      }
    }

    if (candidate && canPlaceOnFoundation(candidate, fIdx)) {
      const newFoundations = foundations.map(arr => [...arr]);
      newFoundations[fIdx].push(candidate);
      setFoundations(newFoundations);

      if (selectedCard.source === 'waste') {
        setWaste(prev => prev.slice(0, -1));
      } else {
        const newTableaus = tableaus.map(arr => [...arr]);
        newTableaus[selectedCard.colIdx].pop();
        if (newTableaus[selectedCard.colIdx].length > 0) {
          newTableaus[selectedCard.colIdx][newTableaus[selectedCard.colIdx].length - 1].faceUp = true;
        }
        setTableaus(newTableaus);
      }

      setSelectedCard(null);
      setScore(s => s + 50);
      setMoves(m => m + 1);
      SoundEffects.playCapture();
      checkWin(newFoundations);
    } else {
      setSelectedCard(null);
    }
  };

  const checkWin = (currentFoundations) => {
    const totalCards = currentFoundations.reduce((sum, pile) => sum + pile.length, 0);
    if (totalCards === 52) {
      setGameWon(true);
      SoundEffects.playWin();
      api.submitScore('SOLITAIRE', score + 1000, true, user);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="solitaire-master-container glass-panel">
      <div className="solitaire-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="solitaire-dash-stats">
          <span>SCORE: <strong>{score}</strong></span> &bull;
          <span>MOVES: <strong>{moves}</strong></span> &bull;
          <span>TIME: <strong>{formatTime(timer)}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={dealGame}>↺ RE-DEAL</button>
      </div>

      {/* Top Section: Stock/Waste & Foundations */}
      <div className="solitaire-top-row">
        <div className="stock-waste-group">
          {/* Stock Pile */}
          <div className="card-slot stock-slot" onClick={handleStockClick}>
            {stock.length > 0 ? (
              <div className="card-face card-back">⚡</div>
            ) : (
              <span className="slot-recycle-icon">↺</span>
            )}
          </div>

          {/* Waste Pile */}
          <div
            className="card-slot waste-slot"
            onClick={() => {
              if (waste.length > 0) {
                setSelectedCard({ source: 'waste' });
                SoundEffects.playClick();
              }
            }}
            onDoubleClick={() => {
              if (waste.length > 0) {
                handleDoubleClickCard(waste[waste.length - 1], 'waste');
              }
            }}
          >
            {waste.length > 0 && (
              <div
                className={`card-face face-up ${waste[waste.length - 1].color} ${selectedCard?.source === 'waste' ? 'selected' : ''}`}
              >
                <span className="card-lbl top">{waste[waste.length - 1].label}{waste[waste.length - 1].symbol}</span>
                <span className="card-big-sym">{waste[waste.length - 1].symbol}</span>
                <span className="card-lbl bot">{waste[waste.length - 1].label}{waste[waste.length - 1].symbol}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Foundations */}
        <div className="foundations-group">
          {foundations.map((pile, fIdx) => {
            const top = pile.length > 0 ? pile[pile.length - 1] : null;
            return (
              <div
                key={fIdx}
                className="card-slot foundation-slot"
                onClick={() => handleFoundationClick(fIdx)}
              >
                {top ? (
                  <div className={`card-face face-up ${top.color}`}>
                    <span className="card-lbl top">{top.label}{top.symbol}</span>
                    <span className="card-big-sym">{top.symbol}</span>
                    <span className="card-lbl bot">{top.label}{top.symbol}</span>
                  </div>
                ) : (
                  <span className="foundation-suit-watermark">{['♠', '♥', '♦', '♣'][fIdx]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau Columns */}
      <div className="solitaire-tableaus-row">
        {tableaus.map((col, colIdx) => (
          <div
            key={colIdx}
            className="tableau-column"
            onClick={() => handleTableauClick(colIdx, col.length ? col.length - 1 : undefined)}
          >
            {col.length === 0 ? (
              <div className="card-slot empty-tableau-slot" />
            ) : (
              col.map((card, cardIdx) => {
                const isSelected =
                  selectedCard?.source === 'tableau' &&
                  selectedCard.colIdx === colIdx &&
                  cardIdx >= selectedCard.cardIdx;

                return (
                  <div
                    key={card.id}
                    className={`tableau-card-wrap ${card.faceUp ? 'face-up' : 'face-down'}`}
                    style={{ top: `${cardIdx * 24}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTableauClick(colIdx, cardIdx);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDoubleClickCard(card, 'tableau', colIdx);
                    }}
                  >
                    {card.faceUp ? (
                      <div className={`card-face face-up ${card.color} ${isSelected ? 'selected' : ''}`}>
                        <span className="card-lbl top">{card.label}{card.symbol}</span>
                        <span className="card-big-sym">{card.symbol}</span>
                        <span className="card-lbl bot">{card.label}{card.symbol}</span>
                      </div>
                    ) : (
                      <div className="card-face card-back">⚡</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      {gameWon && (
        <div className="solitaire-victory-modal">
          <h2>👑 SOLITAIRE MASTER! 👑</h2>
          <p>Completed in {moves} moves ({formatTime(timer)})</p>
          <p>Score: <strong>{score}</strong></p>
          <button className="btn-primary" onClick={dealGame}>PLAY NEW GAME</button>
        </div>
      )}

      <p className="solitaire-hint">
        Double click any face-up card to auto-move to Foundation. Build columns in alternating colors and descending order!
      </p>
    </div>
  );
};

export default SolitaireGame;
