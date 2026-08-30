import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessPiece } from './ChessPieces';
import { getBestChessMove } from './chessEngine';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './ChessGame.css';

const BOARD_THEMES = {
  CYBER: { id: 'CYBER', name: 'Cyber Neon', light: '#1a1f38', dark: '#0b0e1a', highlight: 'rgba(0, 243, 255, 0.4)' },
  WOOD: { id: 'WOOD', name: 'Classic Wood', light: '#f0d9b5', dark: '#b58863', highlight: 'rgba(241, 196, 15, 0.5)' },
  EMERALD: { id: 'EMERALD', name: 'Emerald Club', light: '#eaefd3', dark: '#759656', highlight: 'rgba(46, 204, 113, 0.5)' }
};

const DIFFICULTY_LEVELS = [
  { id: 'EASY', label: 'Novice (Level 1)', icon: '🌱' },
  { id: 'MEDIUM', label: 'Club Player (Level 2)', icon: '⚔️' },
  { id: 'HARD', label: 'Grandmaster (Level 3)', icon: '👑' }
];

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const ChessGame = ({ socket, room, user, onLeave }) => {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  
  // Settings & Modes
  const isMultiplayer = room && !room.isSinglePlayer;
  const [gameMode, setGameMode] = useState(isMultiplayer ? 'MULTIPLAYER' : 'VS_AI');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [boardTheme, setBoardTheme] = useState('CYBER');
  const [flipped, setFlipped] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [gameOverInfo, setGameOverInfo] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const moveHistoryEndRef = useRef(null);

  // Sync multiplayer socket events
  useEffect(() => {
    if (!room || !isMultiplayer || !socket) return;

    const handleRoomUpdated = (updatedRoom) => {
      if (updatedRoom.fen && updatedRoom.fen !== chess.fen()) {
        try {
          chess.load(updatedRoom.fen);
          setFen(chess.fen());
          if (updatedRoom.lastMove) setLastMove(updatedRoom.lastMove);
          SoundEffects.playTokenMove();
          checkGameEnd();
        } catch (e) {
          console.error('[Chess Socket Error]', e);
        }
      }
    };

    socket.on('roomUpdated', handleRoomUpdated);
    return () => { socket.off('roomUpdated', handleRoomUpdated); };
  }, [room, socket, isMultiplayer, chess]);

  // Auto scroll history
  useEffect(() => {
    moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fen]);

  // Determine active turn and check states
  const turn = chess.turn(); // 'w' or 'b'
  const isCheck = chess.inCheck();
  const boardMatrix = useMemo(() => chess.board(), [fen]);

  // Compute captured pieces & score
  const { whiteCaptured, blackCaptured, materialAdvantage } = useMemo(() => {
    const history = chess.history({ verbose: true });
    const whiteCaps = [];
    const blackCaps = [];
    let wScore = 0;
    let bScore = 0;

    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };

    history.forEach(m => {
      if (m.captured) {
        if (m.color === 'w') {
          blackCaps.push(m.captured); // White captured Black's piece
          wScore += pieceValues[m.captured] || 0;
        } else {
          whiteCaps.push(m.captured); // Black captured White's piece
          bScore += pieceValues[m.captured] || 0;
        }
      }
    });

    return {
      whiteCaptured: blackCaps, // Pieces lost by black (held by white)
      blackCaptured: whiteCaps,
      materialAdvantage: wScore - bScore
    };
  }, [fen]);

  // Check Game Over Condition
  const checkGameEnd = () => {
    if (chess.isGameOver()) {
      let result = '';
      let sub = '';

      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'Black (Dark Pieces)' : 'White (Light Pieces)';
        result = `${winner} Wins by Checkmate!`;
        sub = 'Decisive Grandmaster Victory!';
        SoundEffects.playWin();

        // Unlock Achievement
        if (user && user.id) {
          api.unlockAchievement('CHESS_GRANDMASTER_WIN').then(res => {
            if (res?.success) setUnlockedBanner('🏆 Unlocked: Grandmaster Checkmate!');
          });
        }
      } else if (chess.isDraw()) {
        result = 'Match Ended in a Draw!';
        if (chess.isStalemate()) sub = 'Stalemate - No legal moves available.';
        else if (chess.isThreefoldRepetition()) sub = 'Draw by Threefold Repetition.';
        else if (chess.isInsufficientMaterial()) sub = 'Draw by Insufficient Material.';
        else sub = 'Draw by 50-Move Rule.';
        SoundEffects.playTokenMove();
      }

      setGameOverInfo({ title: result, subtitle: sub });
    }
  };

  // Perform Move Locally
  const executeMove = (from, to, promotion = 'q') => {
    try {
      const move = chess.move({ from, to, promotion });
      if (!move) return false;

      setFen(chess.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);
      setValidMoves([]);
      setHintMove(null);

      // Play Sound
      if (move.captured) {
        SoundEffects.playCapture ? SoundEffects.playCapture() : SoundEffects.playDiceRoll();
      } else {
        SoundEffects.playTokenMove();
      }

      // Check socket sync for multiplayer
      if (isMultiplayer && socket && room) {
        socket.emit('makeChessMove', {
          roomId: room.id,
          fen: chess.fen(),
          lastMove: { from, to }
        });
      }

      checkGameEnd();

      // Trigger AI turn if vs AI mode
      if (gameMode === 'VS_AI' && !chess.isGameOver() && chess.turn() === 'b') {
        triggerAiTurn();
      }

      return true;
    } catch (e) {
      return false;
    }
  };

  // Smart AI Execution
  const triggerAiTurn = () => {
    setIsBotThinking(true);
    const delay = difficulty === 'HARD' ? 600 : 400;

    setTimeout(() => {
      try {
        const bestMove = getBestChessMove(chess, difficulty);
        if (bestMove) {
          chess.move(bestMove);
          setFen(chess.fen());
          setLastMove({ from: bestMove.from, to: bestMove.to });

          if (bestMove.captured) {
            SoundEffects.playCapture ? SoundEffects.playCapture() : SoundEffects.playDiceRoll();
          } else {
            SoundEffects.playTokenMove();
          }

          checkGameEnd();
        }
      } catch (err) {
        console.error('[AI Move Error]', err);
      } finally {
        setIsBotThinking(false);
      }
    }, delay);
  };

  // Square Click Handler
  const handleSquareClick = (square) => {
    if (gameOverInfo || isBotThinking) return;

    // In VS AI mode, player only moves White
    if (gameMode === 'VS_AI' && chess.turn() !== 'w') return;

    const piece = chess.get(square);

    // 1. If currently selected square, check if clicked square is a valid move
    if (selectedSquare) {
      const isTargetValid = validMoves.some(m => m.to === square);

      if (isTargetValid) {
        // Check for Pawn Promotion (White reaches rank 8, Black reaches rank 1)
        const selectedPiece = chess.get(selectedSquare);
        const isPromotion = selectedPiece && selectedPiece.type === 'p' && 
          ((selectedPiece.color === 'w' && square.endsWith('8')) || 
           (selectedPiece.color === 'b' && square.endsWith('1')));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        executeMove(selectedSquare, square);
        return;
      }
    }

    // 2. Select piece if belongs to current turn player
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Complete Promotion Choice
  const handleSelectPromotion = (promoPiece) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, promoPiece);
    setPendingPromotion(null);
  };

  // AI Hint Generator
  const handleRequestHint = () => {
    if (chess.isGameOver() || isBotThinking) return;
    const bestMove = getBestChessMove(chess, 'HARD');
    if (bestMove) {
      setHintMove({ from: bestMove.from, to: bestMove.to });
      SoundEffects.playTokenMove();
    }
  };

  // Undo Move (Single player)
  const handleUndoMove = () => {
    if (isMultiplayer || isBotThinking) return;
    chess.undo(); // Undo AI move
    if (gameMode === 'VS_AI' && chess.turn() === 'b') {
      chess.undo(); // Undo Player move
    }
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setHintMove(null);
    setGameOverInfo(null);
  };

  // Restart / Reset Game
  const handleResetGame = () => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setHintMove(null);
    setGameOverInfo(null);
    setIsBotThinking(false);
  };

  // Get Formatted Move History Pairs
  const historyList = useMemo(() => {
    const rawHistory = chess.history();
    const pairs = [];
    for (let i = 0; i < rawHistory.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: rawHistory[i],
        black: rawHistory[i + 1] || ''
      });
    }
    return pairs;
  }, [fen]);

  // Determine active board layout order
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="chess-nexus-container">
      {/* Unlocked Banner */}
      {unlockedBanner && (
        <div className="achievement-popup-banner">
          <span>{unlockedBanner}</span>
          <button onClick={() => setUnlockedBanner(null)}>✕</button>
        </div>
      )}

      {/* Promotion Modal */}
      {pendingPromotion && (
        <div className="chess-modal-overlay">
          <div className="promotion-modal glass-panel">
            <h3 className="promotion-title">Pawn Promotion</h3>
            <p className="promotion-desc">Choose a promotion piece to empower your pawn:</p>
            <div className="promotion-options">
              {[
                { type: 'q', label: 'Queen' },
                { type: 'r', label: 'Rook' },
                { type: 'b', label: 'Bishop' },
                { type: 'n', label: 'Knight' }
              ].map(opt => (
                <button
                  key={opt.type}
                  className="promotion-btn"
                  onClick={() => handleSelectPromotion(opt.type)}
                >
                  <ChessPiece type={opt.type} color={chess.turn()} className="promo-svg" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverInfo && (
        <div className="chess-modal-overlay">
          <div className="game-over-modal glass-panel">
            <div className="game-over-icon">🏆</div>
            <h2 className="game-over-title">{gameOverInfo.title}</h2>
            <p className="game-over-desc">{gameOverInfo.subtitle}</p>
            <div className="game-over-actions">
              <button className="btn-primary" onClick={handleResetGame}>
                <span>🔄</span> PLAY AGAIN
              </button>
              <button className="btn-secondary" onClick={onLeave}>
                <span>🏠</span> BACK TO HUB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="chess-top-bar glass-panel">
        <div className="chess-brand">
          <span className="chess-title-icon">♟️</span>
          <div>
            <h2 className="chess-main-heading">GRANDMASTER CHESS</h2>
            <div className="chess-status-tag">
              <span className={`status-dot ${turn === 'w' ? 'dot-white' : 'dot-black'}`}></span>
              <span>{turn === 'w' ? "White's Turn (Light)" : "Black's Turn (Dark)"}</span>
              {isCheck && <span className="check-alert-pill">⚠️ CHECK!</span>}
              {isBotThinking && <span className="bot-thinking-pill">🤖 AI Calculating...</span>}
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="chess-header-controls">
          {gameMode === 'VS_AI' && (
            <div className="difficulty-selector">
              {DIFFICULTY_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  className={`diff-pill ${difficulty === lvl.id ? 'active' : ''}`}
                  onClick={() => setDifficulty(lvl.id)}
                  title={`Set AI Level: ${lvl.label}`}
                >
                  <span>{lvl.icon}</span> {lvl.id}
                </button>
              ))}
            </div>
          )}

          <button className="btn-icon-control" onClick={() => setFlipped(!flipped)} title="Flip Board Perspective">
            🔄 Flip
          </button>
          <button className="btn-icon-control" onClick={onLeave} title="Exit to Hub">
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Main Playing Arena Layout */}
      <div className="chess-arena-layout">
        {/* Left Side: Chess Board Canvas */}
        <div className="chess-board-wrapper">
          {/* Top Player Status (Black) */}
          <div className="player-hud-card hud-top glass-panel">
            <div className="hud-player-info">
              <span className="hud-avatar">🤖</span>
              <div>
                <strong className="hud-name">{gameMode === 'VS_AI' ? `Cyber AI (${difficulty})` : 'Player 2 (Black)'}</strong>
                <div className="captured-tray">
                  {blackCaptured.map((p, i) => (
                    <ChessPiece key={i} type={p} color="w" className="tray-piece" />
                  ))}
                  {materialAdvantage < 0 && (
                    <span className="score-adv-badge">+{Math.abs(materialAdvantage)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="hud-side-badge badge-black">DARK PIECES</div>
          </div>

          {/* Master 8x8 Chessboard */}
          <div className={`master-chessboard theme-${boardTheme.toLowerCase()}`}>
            {displayRanks.map((rank, rIdx) => (
              <div key={rank} className="board-rank-row">
                {displayFiles.map((file, fIdx) => {
                  const square = `${file}${rank}`;
                  const isLightSquare = (rIdx + fIdx) % 2 === 0;
                  const piece = chess.get(square);
                  
                  const isSelected = selectedSquare === square;
                  const isValidTarget = validMoves.find(m => m.to === square);
                  const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
                  const isHintSquare = hintMove && (hintMove.from === square || hintMove.to === square);
                  const isKingInCheck = isCheck && piece && piece.type === 'k' && piece.color === turn;

                  return (
                    <div
                      key={square}
                      className={`chess-square ${isLightSquare ? 'square-light' : 'square-dark'} 
                        ${isSelected ? 'square-selected' : ''} 
                        ${isLastMoveSquare ? 'square-last-move' : ''} 
                        ${isHintSquare ? 'square-hint' : ''} 
                        ${isKingInCheck ? 'square-in-check' : ''}`}
                      onClick={() => handleSquareClick(square)}
                    >
                      {/* Coordinate Labels */}
                      {fIdx === 0 && <span className="coord-rank">{rank}</span>}
                      {rIdx === 7 && <span className="coord-file">{file}</span>}

                      {/* Valid Move Highlights */}
                      {isValidTarget && (
                        <div className={`valid-move-indicator ${isValidTarget.captured ? 'indicator-capture' : 'indicator-dot'}`} />
                      )}

                      {/* Chess Piece Vector */}
                      {piece && (
                        <div className={`piece-box ${isSelected ? 'selected-bounce' : ''}`}>
                          <ChessPiece type={piece.type} color={piece.color} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Player Status (White) */}
          <div className="player-hud-card hud-bottom glass-panel">
            <div className="hud-player-info">
              <span className="hud-avatar">👤</span>
              <div>
                <strong className="hud-name">{user?.username || 'You (White)'}</strong>
                <div className="captured-tray">
                  {whiteCaptured.map((p, i) => (
                    <ChessPiece key={i} type={p} color="b" className="tray-piece" />
                  ))}
                  {materialAdvantage > 0 && (
                    <span className="score-adv-badge">+{materialAdvantage}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="hud-side-badge badge-white">LIGHT PIECES</div>
          </div>
        </div>

        {/* Right Side: Game Controls, Move Notation, & Tools */}
        <div className="chess-side-panel">
          {/* Mode Selector */}
          <div className="panel-box glass-panel">
            <span className="panel-box-label">GAME MODE</span>
            <div className="mode-toggle-group">
              <button
                className={`mode-tab-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
                onClick={() => { setGameMode('VS_AI'); handleResetGame(); }}
              >
                <span>🤖</span> vs AI Bot
              </button>
              <button
                className={`mode-tab-btn ${gameMode === 'PASS_AND_PLAY' ? 'active' : ''}`}
                onClick={() => { setGameMode('PASS_AND_PLAY'); handleResetGame(); }}
              >
                <span>👥</span> Pass & Play
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="panel-box glass-panel">
            <span className="panel-box-label">BOARD THEME</span>
            <div className="theme-toggle-group">
              {Object.values(BOARD_THEMES).map(t => (
                <button
                  key={t.id}
                  className={`theme-btn ${boardTheme === t.id ? 'active' : ''}`}
                  onClick={() => setBoardTheme(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Move History */}
          <div className="panel-box glass-panel history-panel">
            <div className="history-header">
              <span className="panel-box-label">MOVE NOTATION</span>
              <span className="history-count">{chess.history().length} Moves</span>
            </div>
            <div className="history-scroll-list">
              {historyList.length === 0 ? (
                <div className="history-empty">Game begins. Move a pawn or knight!</div>
              ) : (
                historyList.map(pair => (
                  <div key={pair.num} className="history-row">
                    <span className="history-num">{pair.num}.</span>
                    <span className="history-move white-move">{pair.white}</span>
                    <span className="history-move black-move">{pair.black}</span>
                  </div>
                ))
              )}
              <div ref={moveHistoryEndRef} />
            </div>
          </div>

          {/* Tactical Action Buttons */}
          <div className="panel-box glass-panel action-buttons-panel">
            <button className="tactical-btn btn-hint" onClick={handleRequestHint} title="Engine suggests the best move">
              <span>💡</span> Get Move Hint
            </button>
            <button className="tactical-btn btn-undo" onClick={handleUndoMove} disabled={isMultiplayer || chess.history().length === 0} title="Undo your last move">
              <span>↩️</span> Undo Move
            </button>
            <button className="tactical-btn btn-restart" onClick={handleResetGame} title="Restart new match">
              <span>🔄</span> Restart Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
