import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CarromBoardGame.css';

const BOARD_SIZE = 640;
const FRAME_THICKNESS = 48;
const PLAY_AREA_MIN = FRAME_THICKNESS;
const PLAY_AREA_MAX = BOARD_SIZE - FRAME_THICKNESS;

const COIN_RADIUS = 13.5;
const STRIKER_RADIUS = 19.5;
const POCKET_RADIUS = 26;
const POCKET_POSITIONS = [
  { x: PLAY_AREA_MIN + 18, y: PLAY_AREA_MIN + 18 },
  { x: PLAY_AREA_MAX - 18, y: PLAY_AREA_MIN + 18 },
  { x: PLAY_AREA_MIN + 18, y: PLAY_AREA_MAX - 18 },
  { x: PLAY_AREA_MAX - 18, y: PLAY_AREA_MAX - 18 }
];

const BASELINE_P1_Y = PLAY_AREA_MAX - 55;
const BASELINE_P2_Y = PLAY_AREA_MIN + 55;
const BASELINE_MIN_X = PLAY_AREA_MIN + 85;
const BASELINE_MAX_X = PLAY_AREA_MAX - 85;

const FRICTION = 0.985;
const RESTITUTION = 0.92; // Bounciness
const COIN_MASS = 1.0;
const STRIKER_MASS = 2.8;

const CarromBoardGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  
  // Game Setup & Modes
  const [gameMode, setGameMode] = useState('VS_AI'); // 'VS_AI', 'TWO_PLAYER', 'PRACTICE'
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM'); // 'EASY', 'MEDIUM', 'HARD'
  const [gameState, setGameState] = useState('PLAYING'); // 'PLAYING', 'GAMEOVER'
  
  // Players & Scores
  const [currentTurn, setCurrentTurn] = useState('P1'); // 'P1' (White) or 'P2' (Black / AI)
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [queenStatus, setQueenStatus] = useState('BOARD'); // 'BOARD', 'POCKETED_P1', 'POCKETED_P2', 'COVERED_P1', 'COVERED_P2'
  const [consecutivePocket, setConsecutivePocket] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Striker Controls
  const [strikerX, setStrikerX] = useState((BASELINE_MIN_X + BASELINE_MAX_X) / 2);
  const [isDraggingAim, setIsDraggingAim] = useState(false);
  const [aimVector, setAimVector] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0); // 0 to 100
  const [isSimulating, setIsSimulating] = useState(false);
  const [turnMessage, setTurnMessage] = useState('Place striker on baseline & pull back to shoot');

  // Internal physics objects
  const physicsRef = useRef({
    striker: null,
    coins: [],
    pocketedThisShot: [],
    strikerPocketed: false,
    queenPocketedThisShot: null,
    shotActive: false,
    turnOwner: 'P1'
  });

  // Initialize Game
  useEffect(() => {
    resetGame();
  }, [gameMode]);

  const initCoins = () => {
    const coins = [];
    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;

    // 1. Center Queen (Red)
    coins.push({
      id: 'queen',
      type: 'QUEEN',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: COIN_MASS,
      color: '#ff0033',
      ringColor: '#ffd600',
      active: true
    });

    // 2. Inner Ring (6 coins: alternating White & Black)
    const innerDist = COIN_RADIUS * 2 + 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const type = i % 2 === 0 ? 'WHITE' : 'BLACK';
      coins.push({
        id: `inner_${i}`,
        type,
        x: cx + Math.cos(angle) * innerDist,
        y: cy + Math.sin(angle) * innerDist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: COIN_MASS,
        color: type === 'WHITE' ? '#f0f3f8' : '#2b2b2b',
        ringColor: type === 'WHITE' ? '#00f3ff' : '#666',
        active: true
      });
    }

    // 3. Outer Ring (12 coins: alternating White & Black)
    const outerDist = innerDist * 1.88;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 + Math.PI / 12;
      const type = (i % 2 === 0) ? 'BLACK' : 'WHITE';
      coins.push({
        id: `outer_${i}`,
        type,
        x: cx + Math.cos(angle) * outerDist,
        y: cy + Math.sin(angle) * outerDist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: COIN_MASS,
        color: type === 'WHITE' ? '#f0f3f8' : '#2b2b2b',
        ringColor: type === 'WHITE' ? '#00f3ff' : '#666',
        active: true
      });
    }

    return coins;
  };

  const resetGame = () => {
    const freshCoins = initCoins();
    const defaultStrikerX = (BASELINE_MIN_X + BASELINE_MAX_X) / 2;
    const defaultStrikerY = BASELINE_P1_Y;

    physicsRef.current = {
      striker: {
        x: defaultStrikerX,
        y: defaultStrikerY,
        vx: 0,
        vy: 0,
        radius: STRIKER_RADIUS,
        mass: STRIKER_MASS,
        active: true
      },
      coins: freshCoins,
      pocketedThisShot: [],
      strikerPocketed: false,
      queenPocketedThisShot: null,
      shotActive: false,
      turnOwner: 'P1'
    };

    setStrikerX(defaultStrikerX);
    setCurrentTurn('P1');
    setScoreP1(0);
    setScoreP2(0);
    setQueenStatus('BOARD');
    setConsecutivePocket(false);
    setIsSimulating(false);
    setWinner(null);
    setGameState('PLAYING');
    setTurnMessage("Player 1's Turn (White Coins)");
  };

  // Main 60FPS Physics Simulation Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndDraw = () => {
      const state = physicsRef.current;

      // 1. Update Physics if active
      if (state.shotActive) {
        let anyMoving = false;

        // Striker Movement
        const s = state.striker;
        if (s && s.active) {
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= FRICTION;
          s.vy *= FRICTION;

          if (Math.abs(s.vx) < 0.05 && Math.abs(s.vy) < 0.05) {
            s.vx = 0;
            s.vy = 0;
          } else {
            anyMoving = true;
          }

          // Striker Wall Collisions
          handleWallCollision(s);

          // Striker Pocket Collision (Foul!)
          if (checkPocket(s)) {
            s.active = false;
            state.strikerPocketed = true;
            try { SoundEffects.playLoss(); } catch (e) {}
          }
        }

        // Coins Movement & Collisions
        for (let i = 0; i < state.coins.length; i++) {
          const c = state.coins[i];
          if (!c.active) continue;

          c.x += c.vx;
          c.y += c.vy;
          c.vx *= FRICTION;
          c.vy *= FRICTION;

          if (Math.abs(c.vx) < 0.05 && Math.abs(c.vy) < 0.05) {
            c.vx = 0;
            c.vy = 0;
          } else {
            anyMoving = true;
          }

          // Coin Wall Collisions
          handleWallCollision(c);

          // Coin Pocket Collision
          if (checkPocket(c)) {
            c.active = false;
            state.pocketedThisShot.push(c);
            try { SoundEffects.playSafe(); } catch (e) {}
          }
        }

        // --- Striker to Coin Collisions ---
        if (s && s.active) {
          for (let i = 0; i < state.coins.length; i++) {
            const c = state.coins[i];
            if (!c.active) continue;
            if (checkCircleCollision(s, c)) {
              resolveCircleCollision(s, c);
              try { SoundEffects.playClick(); } catch (e) {}
            }
          }
        }

        // --- Coin to Coin Collisions ---
        for (let i = 0; i < state.coins.length; i++) {
          for (let j = i + 1; j < state.coins.length; j++) {
            const c1 = state.coins[i];
            const c2 = state.coins[j];
            if (!c1.active || !c2.active) continue;
            if (checkCircleCollision(c1, c2)) {
              resolveCircleCollision(c1, c2);
              try { SoundEffects.playTokenStep(); } catch (e) {}
            }
          }
        }

        // 2. Check if all bodies have stopped moving
        if (!anyMoving) {
          state.shotActive = false;
          setIsSimulating(false);
          processTurnEnd();
        }
      }

      // 3. Render Canvas
      renderBoard(ctx, state);

      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animId);
  }, [strikerX, currentTurn, aimVector, power, isDraggingAim, isSimulating]);

  // Handle Wall Collisions
  const handleWallCollision = (obj) => {
    const min = PLAY_AREA_MIN + obj.radius;
    const max = PLAY_AREA_MAX - obj.radius;

    if (obj.x < min) {
      obj.x = min;
      obj.vx = -obj.vx * RESTITUTION;
    } else if (obj.x > max) {
      obj.x = max;
      obj.vx = -obj.vx * RESTITUTION;
    }

    if (obj.y < min) {
      obj.y = min;
      obj.vy = -obj.vy * RESTITUTION;
    } else if (obj.y > max) {
      obj.y = max;
      obj.vy = -obj.vy * RESTITUTION;
    }
  };

  // Check if falling in pocket
  const checkPocket = (obj) => {
    for (let p of POCKET_POSITIONS) {
      const dx = obj.x - p.x;
      const dy = obj.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < POCKET_RADIUS - 2) {
        return true;
      }
    }
    return false;
  };

  // 2D Circle Collision Resolution with Mass
  const checkCircleCollision = (c1, c2) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.hypot(dx, dy);
    return dist < c1.radius + c2.radius;
  };

  const resolveCircleCollision = (c1, c2) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.hypot(dx, dy) || 0.001;

    // Normal unit vector
    const nx = dx / dist;
    const ny = dy / dist;

    // Separate overlapping circles
    const overlap = 0.5 * (c1.radius + c2.radius - dist);
    c1.x -= overlap * nx;
    c1.y -= overlap * ny;
    c2.x += overlap * nx;
    c2.y += overlap * ny;

    // Velocity projection
    const kx = c1.vx - c2.vx;
    const ky = c1.vy - c2.vy;
    const p = 2 * (nx * kx + ny * ky) / (c1.mass + c2.mass);

    c1.vx -= p * c2.mass * nx * RESTITUTION;
    c1.vy -= p * c2.mass * ny * RESTITUTION;
    c2.vx += p * c1.mass * nx * RESTITUTION;
    c2.vy += p * c1.mass * ny * RESTITUTION;
  };

  // Process Turn End Rules (Queen Covering, Fouls, Scoring)
  const processTurnEnd = () => {
    const state = physicsRef.current;
    const p = state.turnOwner;
    const targetType = p === 'P1' ? 'WHITE' : 'BLACK';
    const opponentType = p === 'P1' ? 'BLACK' : 'WHITE';

    let extraTurn = false;
    let turnMsg = '';

    // 1. Check Striker Pocketed (FOUL Penalty)
    if (state.strikerPocketed) {
      turnMsg = `${p === 'P1' ? 'Player 1' : 'Player 2'} Striker in pocket! FOUL (-1 Penalty)`;
      if (p === 'P1') setScoreP1(s => Math.max(0, s - 10));
      else setScoreP2(s => Math.max(0, s - 10));

      // Return one pocketed coin to center if available
      const lastScored = state.coins.find(c => !c.active && c.type === targetType);
      if (lastScored) {
        lastScored.active = true;
        lastScored.x = BOARD_SIZE / 2;
        lastScored.y = BOARD_SIZE / 2;
        lastScored.vx = 0;
        lastScored.vy = 0;
      }
    }

    // 2. Process Pocketed Coins
    const targetCoinsPocketed = state.pocketedThisShot.filter(c => c.type === targetType);
    const opponentCoinsPocketed = state.pocketedThisShot.filter(c => c.type === opponentType);
    const queenPocketed = state.pocketedThisShot.some(c => c.type === 'QUEEN');

    // Own coins scored
    if (targetCoinsPocketed.length > 0) {
      const pts = targetCoinsPocketed.length * 10;
      if (p === 'P1') setScoreP1(s => s + pts);
      else setScoreP2(s => s + pts);
      extraTurn = true;
      turnMsg = `+${pts} Points scored! Extra Shot awarded.`;
    }

    // Opponent coin accidentally pocketed
    if (opponentCoinsPocketed.length > 0) {
      const pts = opponentCoinsPocketed.length * 10;
      if (p === 'P1') setScoreP2(s => s + pts);
      else setScoreP1(s => s + pts);
      turnMsg += ` Opponent gets ${pts} pts.`;
    }

    // Queen Logic
    if (queenPocketed) {
      if (p === 'P1') {
        setQueenStatus('POCKETED_P1');
        turnMsg = 'Queen pocketed! You must COVER the Queen with another coin!';
      } else {
        setQueenStatus('POCKETED_P2');
        turnMsg = 'Player 2 pocketed Queen! Must cover Queen.';
      }
      extraTurn = true;
    } else if (queenStatus === 'POCKETED_P1') {
      if (targetCoinsPocketed.length > 0) {
        setQueenStatus('COVERED_P1');
        setScoreP1(s => s + 30);
        turnMsg = 'QUEEN COVERED! +30 Bonus Points!';
        try { SoundEffects.playWin(); } catch (e) {}
      } else {
        // Return Queen to Center
        setQueenStatus('BOARD');
        const queen = state.coins.find(c => c.type === 'QUEEN');
        if (queen) {
          queen.active = true;
          queen.x = BOARD_SIZE / 2;
          queen.y = BOARD_SIZE / 2;
          queen.vx = 0;
          queen.vy = 0;
        }
        turnMsg = 'Queen NOT covered! Returned to center circle.';
      }
    } else if (queenStatus === 'POCKETED_P2') {
      if (opponentCoinsPocketed.length > 0) {
        setQueenStatus('COVERED_P2');
        setScoreP2(s => s + 30);
        turnMsg = 'Player 2 COVERED the Queen! +30 Points.';
      } else {
        setQueenStatus('BOARD');
        const queen = state.coins.find(c => c.type === 'QUEEN');
        if (queen) {
          queen.active = true;
          queen.x = BOARD_SIZE / 2;
          queen.y = BOARD_SIZE / 2;
        }
      }
    }

    // 3. Check Victory (All White or Black coins cleared)
    const whiteLeft = state.coins.filter(c => c.active && c.type === 'WHITE').length;
    const blackLeft = state.coins.filter(c => c.active && c.type === 'BLACK').length;

    if (whiteLeft === 0 || blackLeft === 0) {
      const p1Wins = whiteLeft === 0;
      setWinner(p1Wins ? 'PLAYER 1 (WHITE)' : 'PLAYER 2 (BLACK)');
      setGameState('GAMEOVER');
      try {
        if (p1Wins) SoundEffects.playWin();
        else SoundEffects.playLoss();
      } catch (e) {}

      // Submit Score to Leaderboard
      if (user?.id) {
        api.submitScore('CARROM', p1Wins ? scoreP1 + 100 : scoreP1, p1Wins, user).then(res => {
          if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        });
      }
      return;
    }

    // 4. Switch Turns if no extra turn
    let nextTurn = p;
    if (!extraTurn || state.strikerPocketed) {
      nextTurn = p === 'P1' ? 'P2' : 'P1';
    }

    setCurrentTurn(nextTurn);
    state.turnOwner = nextTurn;
    state.pocketedThisShot = [];
    state.strikerPocketed = false;

    // Reset Striker to Next Turn Player's baseline
    const nextY = nextTurn === 'P1' ? BASELINE_P1_Y : BASELINE_P2_Y;
    const defaultX = (BASELINE_MIN_X + BASELINE_MAX_X) / 2;
    state.striker = {
      x: defaultX,
      y: nextY,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: STRIKER_MASS,
      active: true
    };
    setStrikerX(defaultX);
    setTurnMessage(turnMsg || `${nextTurn === 'P1' ? 'Player 1' : 'Player 2'}'s Turn`);

    // If AI Turn, trigger Bot
    if (gameMode === 'VS_AI' && nextTurn === 'P2') {
      triggerAiShot();
    }
  };

  // Smart AI Shot Calculation
  const triggerAiShot = () => {
    setTimeout(() => {
      const state = physicsRef.current;
      const availableCoins = state.coins.filter(c => c.active && (c.type === 'BLACK' || c.type === 'QUEEN'));
      if (availableCoins.length === 0) return;

      // Choose target coin closest to a pocket
      let bestTarget = availableCoins[0];
      let bestPocket = POCKET_POSITIONS[0];
      let minDistance = Infinity;

      availableCoins.forEach(coin => {
        POCKET_POSITIONS.forEach(pocket => {
          const d = Math.hypot(coin.x - pocket.x, coin.y - pocket.y);
          if (d < minDistance) {
            minDistance = d;
            bestTarget = coin;
            bestPocket = pocket;
          }
        });
      });

      // Position striker on baseline opposite to coin
      const newStrikerX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, bestTarget.x + (Math.random() - 0.5) * 40));
      setStrikerX(newStrikerX);
      state.striker.x = newStrikerX;
      state.striker.y = BASELINE_P2_Y;

      // Aim vector with slight difficulty inaccuracy
      const accuracyError = aiDifficulty === 'HARD' ? 0.02 : aiDifficulty === 'MEDIUM' ? 0.08 : 0.18;
      const targetDx = bestTarget.x - newStrikerX + (Math.random() - 0.5) * 50 * accuracyError;
      const targetDy = bestTarget.y - BASELINE_P2_Y + (Math.random() - 0.5) * 50 * accuracyError;
      const len = Math.hypot(targetDx, targetDy) || 1;

      const aiPower = aiDifficulty === 'HARD' ? 18 : 14;
      state.striker.vx = (targetDx / len) * aiPower;
      state.striker.vy = (targetDy / len) * aiPower;
      state.shotActive = true;
      setIsSimulating(true);
      try { SoundEffects.playDiceRoll(); } catch (e) {}
    }, 900);
  };

  // Player Striker Controls (Drag & Release Aim)
  const handleCanvasMouseDown = (e) => {
    if (isSimulating || (gameMode === 'VS_AI' && currentTurn === 'P2')) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (BOARD_SIZE / rect.width);
    const clickY = (e.clientY - rect.top) * (BOARD_SIZE / rect.height);

    const s = physicsRef.current.striker;
    if (!s) return;

    // Check if clicked near striker
    const dist = Math.hypot(clickX - s.x, clickY - s.y);
    if (dist < 45) {
      setIsDraggingAim(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingAim) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (BOARD_SIZE / rect.width);
    const mouseY = (e.clientY - rect.top) * (BOARD_SIZE / rect.height);

    const s = physicsRef.current.striker;
    if (!s) return;

    // Slingshot vector (drag opposite to shot direction)
    const dx = s.x - mouseX;
    const dy = s.y - mouseY;
    const rawPower = Math.min(130, Math.hypot(dx, dy));
    const powerPct = Math.round((rawPower / 130) * 100);

    setAimVector({ x: dx, y: dy });
    setPower(powerPct);
  };

  const handleCanvasMouseUp = () => {
    if (!isDraggingAim) return;
    setIsDraggingAim(false);

    if (power > 5) {
      const s = physicsRef.current.striker;
      const speedScale = 0.22;
      s.vx = aimVector.x * speedScale;
      s.vy = aimVector.y * speedScale;

      physicsRef.current.shotActive = true;
      setIsSimulating(true);
      setPower(0);
      setAimVector({ x: 0, y: 0 });
      try { SoundEffects.playDiceRoll(); } catch (e) {}
    }
  };

  const handleBaselinePositionChange = (e) => {
    if (isSimulating) return;
    const newX = parseFloat(e.target.value);
    setStrikerX(newX);
    if (physicsRef.current.striker) {
      physicsRef.current.striker.x = newX;
    }
  };

  // --- RENDERING CANVAS (Authentic Rosewood Carrom Board) ---
  const renderBoard = (ctx, state) => {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // 1. Dark Rosewood Outer Frame
    const frameGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
    frameGrad.addColorStop(0, '#2b170c');
    frameGrad.addColorStop(0.5, '#422415');
    frameGrad.addColorStop(1, '#1b0d06');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Frame Shadow & Bevel
    ctx.strokeStyle = '#5a351f';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, BOARD_SIZE - 4, BOARD_SIZE - 4);

    // 2. Birch Wood Playing Surface with Smooth Sheen
    const boardGrad = ctx.createRadialGradient(BOARD_SIZE / 2, BOARD_SIZE / 2, 50, BOARD_SIZE / 2, BOARD_SIZE / 2, 380);
    boardGrad.addColorStop(0, '#eed8ae');
    boardGrad.addColorStop(0.7, '#e4ca99');
    boardGrad.addColorStop(1, '#d8bc85');
    ctx.fillStyle = boardGrad;
    ctx.fillRect(PLAY_AREA_MIN, PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN);

    // Playing Area Inner Border Line
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 2;
    ctx.strokeRect(PLAY_AREA_MIN, PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN);

    // 3. Official Carrom Markings
    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;

    // Center Circle (Inner & Outer)
    ctx.strokeStyle = '#b01e23';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#b01e23';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Center Decorative Floral Rays
    ctx.strokeStyle = '#2b1b11';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 16, cy + Math.sin(angle) * 16);
      ctx.lineTo(cx + Math.cos(angle) * 40, cy + Math.sin(angle) * 40);
      ctx.stroke();
    }

    // Baselines & Red Baseline Circles (4 Sides)
    const drawBaseline = (y, isHorizontal) => {
      ctx.strokeStyle = '#2b1b11';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (isHorizontal) {
        ctx.moveTo(BASELINE_MIN_X, y - 6);
        ctx.lineTo(BASELINE_MAX_X, y - 6);
        ctx.moveTo(BASELINE_MIN_X, y + 6);
        ctx.lineTo(BASELINE_MAX_X, y + 6);
      } else {
        ctx.moveTo(y - 6, BASELINE_MIN_X);
        ctx.lineTo(y - 6, BASELINE_MAX_X);
        ctx.moveTo(y + 6, BASELINE_MIN_X);
        ctx.lineTo(y + 6, BASELINE_MAX_X);
      }
      ctx.stroke();

      // Red Foul Circles at baseline ends
      const ends = [BASELINE_MIN_X, BASELINE_MAX_X];
      ends.forEach(endX => {
        ctx.fillStyle = '#b01e23';
        ctx.beginPath();
        if (isHorizontal) ctx.arc(endX, y, 9, 0, Math.PI * 2);
        else ctx.arc(y, endX, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2b1b11';
        ctx.stroke();
      });
    };

    drawBaseline(BASELINE_P1_Y, true); // Bottom
    drawBaseline(BASELINE_P2_Y, true); // Top
    drawBaseline(BASELINE_P1_Y, false); // Right
    drawBaseline(BASELINE_P2_Y, false); // Left

    // Corner Diagonal Arrows pointing to pockets
    POCKET_POSITIONS.forEach(p => {
      const angle = Math.atan2(cy - p.y, cx - p.x);
      ctx.strokeStyle = '#b01e23';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(angle) * 38, p.y + Math.sin(angle) * 38);
      ctx.lineTo(p.x + Math.cos(angle) * 95, p.y + Math.sin(angle) * 95);
      ctx.stroke();
    });

    // 4. 4 Deep Corner Pockets with Mesh Netting
    POCKET_POSITIONS.forEach(p => {
      // Outer shadow
      ctx.fillStyle = '#110a06';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Inner Net Hole
      ctx.fillStyle = '#050201';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS - 4, 0, Math.PI * 2);
      ctx.fill();

      // Net ring edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 5. Draw Carrom Coins
    state.coins.forEach(c => {
      if (!c.active) return;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      // Coin base body
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Coin Grooves & Polish
      ctx.strokeStyle = c.type === 'WHITE' ? '#c4cbd6' : c.type === 'QUEEN' ? '#ffd600' : '#444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius - 3, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot on coin
      ctx.fillStyle = c.type === 'QUEEN' ? '#ffd600' : c.type === 'WHITE' ? '#b01e23' : '#888';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Draw Striker
    const s = state.striker;
    if (s && s.active) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 243, 255, 0.6)';
      ctx.shadowBlur = 12;

      // Striker Acrylic Ivory/Glass Body
      const strikerGrad = ctx.createRadialGradient(s.x - 4, s.y - 4, 2, s.x, s.y, s.radius);
      strikerGrad.addColorStop(0, '#ffffff');
      strikerGrad.addColorStop(0.6, '#e0f7fa');
      strikerGrad.addColorStop(1, '#00bcd4');
      ctx.fillStyle = strikerGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outer Glow Ring
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Design Ring
      ctx.strokeStyle = '#006064';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius - 5, 0, Math.PI * 2);
      ctx.stroke();

      // Center Gem
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Aim Guide & Trajectory Line
      if (isDraggingAim && power > 0) {
        ctx.save();
        const aimLen = Math.hypot(aimVector.x, aimVector.y) || 1;
        const normAimX = aimVector.x / aimLen;
        const normAimY = aimVector.y / aimLen;

        // Dotted forward aim trajectory
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + normAimX * (power * 2.2), s.y + normAimY * (power * 2.2));
        ctx.stroke();
        ctx.setLineDash([]);

        // Pullback slingshot line
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - aimVector.x, s.y - aimVector.y);
        ctx.stroke();

        // Target Reticle Circle at trajectory tip
        const tipX = s.x + normAimX * (power * 2.2);
        const tipY = s.y + normAimY * (power * 2.2);
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const whiteRemaining = physicsRef.current.coins.filter(c => c.active && c.type === 'WHITE').length;
  const blackRemaining = physicsRef.current.coins.filter(c => c.active && c.type === 'BLACK').length;

  return (
    <div className="carrom-game-container">
      {/* Top Header HUD */}
      <div className="carrom-nav-bar glass-panel">
        <button className="btn-tertiary" onClick={onLeave}>
          ← EXIT TO HUB
        </button>

        <div className="carrom-score-display">
          <div className={`score-card ${currentTurn === 'P1' ? 'active-turn-p1' : ''}`}>
            <span className="p-label">⚪ PLAYER 1 (WHITE)</span>
            <span className="p-pts">{scoreP1} PTS</span>
            <small className="p-left">{whiteRemaining} COINS LEFT</small>
          </div>

          <div className="match-vs-divider">VS</div>

          <div className={`score-card ${currentTurn === 'P2' ? 'active-turn-p2' : ''}`}>
            <span className="p-label">⚫ {gameMode === 'VS_AI' ? `AI BOT (${aiDifficulty})` : 'PLAYER 2 (BLACK)'}</span>
            <span className="p-pts">{scoreP2} PTS</span>
            <small className="p-left">{blackRemaining} COINS LEFT</small>
          </div>
        </div>

        <div className="carrom-quick-controls">
          <button className="btn-secondary" onClick={resetGame}>
            🔄 RESET
          </button>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-banner glass-panel">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="carrom-stage-layout">
        {/* Left Side: Canvas Carrom Board */}
        <div className="carrom-board-wrapper glass-panel">
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            className="carrom-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            }}
            onTouchEnd={handleCanvasMouseUp}
          />

          {/* Baseline Slider Positioner */}
          {!isSimulating && currentTurn === 'P1' && (
            <div className="striker-slider-box">
              <span className="slider-label">🎯 SLIDE STRIKER POSITION:</span>
              <input
                type="range"
                min={BASELINE_MIN_X}
                max={BASELINE_MAX_X}
                value={strikerX}
                onChange={handleBaselinePositionChange}
                className="baseline-range-input"
              />
            </div>
          )}

          {/* Game Status Banner */}
          <div className="turn-indicator-bar">
            <span className="indicator-text">{turnMessage}</span>
            {power > 0 && <span className="power-indicator">POWER: {power}%</span>}
          </div>
        </div>

        {/* Right Side: Game Settings & Rules Panel */}
        <div className="carrom-info-sidebar glass-panel">
          <h3 className="sidebar-title">🎱 CARROM MASTERS</h3>

          {/* Queen Status Tile */}
          <div className="queen-status-tile">
            <span className="queen-badge">👑 QUEEN (RED): 30 PTS</span>
            <strong style={{ color: queenStatus.includes('COVERED') ? '#00f3ff' : '#ff0055' }}>
              {queenStatus === 'BOARD' ? 'ON BOARD' :
               queenStatus === 'POCKETED_P1' ? 'P1 MUST COVER QUEEN!' :
               queenStatus === 'POCKETED_P2' ? 'P2 MUST COVER QUEEN!' : 'COVERED & SECURED!'}
            </strong>
          </div>

          {/* Mode Selector */}
          <div className="sidebar-section">
            <label className="section-label">GAME MODE</label>
            <div className="mode-toggle-group">
              <button 
                className={`mode-tab ${gameMode === 'VS_AI' ? 'active' : ''}`}
                onClick={() => setGameMode('VS_AI')}
              >
                🤖 VS AI BOT
              </button>
              <button 
                className={`mode-tab ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
                onClick={() => setGameMode('TWO_PLAYER')}
              >
                👥 2-PLAYER
              </button>
            </div>
          </div>

          {/* AI Difficulty */}
          {gameMode === 'VS_AI' && (
            <div className="sidebar-section">
              <label className="section-label">AI BOT DIFFICULTY</label>
              <div className="diff-btn-group">
                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                  <button
                    key={d}
                    className={`diff-btn ${aiDifficulty === d ? 'active' : ''}`}
                    onClick={() => setAiDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls & Rules Guide */}
          <div className="carrom-rules-box">
            <h4>🎮 HOW TO PLAY (ASLI CARROM):</h4>
            <ul>
              <li><strong>1. Position Striker:</strong> Drag the slider below the board to place your striker on the baseline.</li>
              <li><strong>2. Aim & Power:</strong> Drag backward from the striker to set angle & shot power, then release to shoot!</li>
              <li><strong>3. Scoring:</strong> White Coins = 10 pts, Black Coins = 10 pts.</li>
              <li><strong>4. Queen Rule:</strong> Pocketing the Red Queen (+30 pts) requires covering it with another coin on the same or next shot.</li>
              <li><strong>5. Foul:</strong> Sinking the Striker into a pocket gives -10 pts foul penalty.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <div className="carrom-gameover-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="gameover-modal-card glass-panel">
            <h2 className="neon-text" style={{ fontSize: '2.4rem', color: '#00f3ff' }}>🏆 MATCH FINISHED!</h2>
            <h3 style={{ color: '#ffd600', fontSize: '1.5rem', margin: '10px 0' }}>{winner} WINS!</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>
              Final Score: Player 1 (<strong>{scoreP1} pts</strong>) vs Player 2 (<strong>{scoreP2} pts</strong>)
            </p>
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }} onClick={resetGame}>
              PLAY AGAIN 🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarromBoardGame;
