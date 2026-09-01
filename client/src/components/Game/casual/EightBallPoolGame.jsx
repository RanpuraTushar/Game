import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './EightBallPoolGame.css';

const TABLE_WIDTH = 840;
const TABLE_HEIGHT = 440;
const RAIL_SIZE = 42;
const PLAY_X = RAIL_SIZE;
const PLAY_Y = RAIL_SIZE;
const PLAY_W = TABLE_WIDTH - RAIL_SIZE * 2;
const PLAY_H = TABLE_HEIGHT - RAIL_SIZE * 2;
const BALL_RADIUS = 12;
const POCKET_RADIUS = 24;

// 6 Real Tournament Pockets with angled throat entry
const POCKETS = [
  { x: PLAY_X + 4, y: PLAY_Y + 4, id: 'TL' },
  { x: TABLE_WIDTH / 2, y: PLAY_Y - 2, id: 'TC' },
  { x: PLAY_X + PLAY_W - 4, y: PLAY_Y + 4, id: 'TR' },
  { x: PLAY_X + 4, y: PLAY_Y + PLAY_H - 4, id: 'BL' },
  { x: TABLE_WIDTH / 2, y: PLAY_Y + PLAY_H + 2, id: 'BC' },
  { x: PLAY_X + PLAY_W - 4, y: PLAY_Y + PLAY_H - 4, id: 'BR' }
];

const BALL_DEFINITIONS = {
  1: { color: '#ffd600', type: 'SOLID', num: 1, name: '1 Yellow' },
  2: { color: '#0055ff', type: 'SOLID', num: 2, name: '2 Blue' },
  3: { color: '#ee1122', type: 'SOLID', num: 3, name: '3 Red' },
  4: { color: '#8800cc', type: 'SOLID', num: 4, name: '4 Purple' },
  5: { color: '#ff7700', type: 'SOLID', num: 5, name: '5 Orange' },
  6: { color: '#00aa33', type: 'SOLID', num: 6, name: '6 Green' },
  7: { color: '#770011', type: 'SOLID', num: 7, name: '7 Maroon' },
  8: { color: '#111111', type: 'EIGHT', num: 8, name: '8 Black' },
  9: { color: '#ffd600', type: 'STRIPE', num: 9, name: '9 Yellow Stripe' },
  10: { color: '#0055ff', type: 'STRIPE', num: 10, name: '10 Blue Stripe' },
  11: { color: '#ee1122', type: 'STRIPE', num: 11, name: '11 Red Stripe' },
  12: { color: '#8800cc', type: 'STRIPE', num: 12, name: '12 Purple Stripe' },
  13: { color: '#ff7700', type: 'STRIPE', num: 13, name: '13 Orange Stripe' },
  14: { color: '#00aa33', type: 'STRIPE', num: 14, name: '14 Green Stripe' },
  15: { color: '#770011', type: 'STRIPE', num: 15, name: '15 Maroon Stripe' }
};

const EightBallPoolGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const powerGaugeRef = useRef(null);

  const [gameMode, setGameMode] = useState('VS_AI'); // 'VS_AI', 'TWO_PLAYER', 'PRACTICE'
  const [feltTheme, setFeltTheme] = useState('TOURNAMENT_GREEN'); // 'TOURNAMENT_GREEN', 'ROYAL_BLUE', 'CYBER_DARK'
  const [turn, setTurn] = useState('P1');
  const [p1Type, setP1Type] = useState(null); // 'SOLID' or 'STRIPE'
  const [p2Type, setP2Type] = useState(null);
  const [p1Potted, setP1Potted] = useState([]);
  const [p2Potted, setP2Potted] = useState([]);
  const [power, setPower] = useState(50);
  const [aimAngle, setAimAngle] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [isDraggingPower, setIsDraggingPower] = useState(false);
  const [ballInHand, setBallInHand] = useState(false);
  const [spinOffset, setSpinOffset] = useState({ x: 0, y: 0 }); // Cue spin (topspin, backspin)
  const [turnMessage, setTurnMessage] = useState('Player 1: Break the rack!');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    cueBall: { x: 240, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, rollAngle: 0, active: true, scale: 1 },
    balls: [],
    particles: [],
    pocketedThisTurn: [],
    firstBallHit: null,
    shotPowerVisual: 0,
    mousePos: { x: 0, y: 0 },
    active: true
  });

  useEffect(() => {
    resetRack();
  }, [gameMode]);

  const resetRack = () => {
    const s = stateRef.current;
    s.cueBall = { x: 240, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, rollAngle: 0, active: true, scale: 1 };
    s.particles = [];
    s.pocketedThisTurn = [];
    s.firstBallHit = null;
    s.shotPowerVisual = 0;

    // Official Tournament Triangle Rack Placement
    const rackStartX = 580;
    const rackStartY = TABLE_HEIGHT / 2;
    const r = BALL_RADIUS;
    const balls = [];
    
    // Official 8-ball triangle rack order
    const rackPattern = [
      1,
      9, 2,
      3, 8, 10,
      11, 4, 12, 5,
      13, 6, 14, 7, 15
    ];

    let bIdx = 0;
    for (let col = 0; col < 5; col++) {
      const colX = rackStartX + col * (r * 1.732);
      const startY = rackStartY - col * r;
      for (let row = 0; row <= col; row++) {
        const num = rackPattern[bIdx];
        const def = BALL_DEFINITIONS[num];
        balls.push({
          id: num,
          num,
          x: colX + (Math.random() - 0.5) * 0.4,
          y: startY + row * (r * 2) + (Math.random() - 0.5) * 0.4,
          vx: 0,
          vy: 0,
          rollAngle: Math.random() * Math.PI * 2,
          color: def.color,
          type: def.type,
          name: def.name,
          active: true,
          scale: 1
        });
        bIdx++;
      }
    }

    s.balls = balls;
    setTurn('P1');
    setP1Type(null);
    setP2Type(null);
    setP1Potted([]);
    setP2Potted([]);
    setIsShooting(false);
    setBallInHand(false);
    setGameOver(false);
    setWinner(null);
    setTurnMessage('Player 1: Break the rack!');
  };

  // Main 60FPS Physics Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const loop = () => {
      updatePhysics();
      render(ctx);
      if (stateRef.current.active) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [aimAngle, power, isShooting, turn, p1Type, p2Type, gameOver, feltTheme, ballInHand, spinOffset]);

  const updatePhysics = () => {
    const s = stateRef.current;
    let anyMoving = false;
    const friction = 0.988;
    const minX = PLAY_X + BALL_RADIUS;
    const maxX = PLAY_X + PLAY_W - BALL_RADIUS;
    const minY = PLAY_Y + BALL_RADIUS;
    const maxY = PLAY_Y + PLAY_H - BALL_RADIUS;

    const allBalls = [s.cueBall, ...s.balls.filter(b => b.active)];

    // 1. Move, Rolling Angle & Cushion Bounces
    allBalls.forEach(b => {
      if (!b.active) return;
      const speed = Math.hypot(b.vx, b.vy);

      if (speed > 0.04) {
        anyMoving = true;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= friction;
        b.vy *= friction;
        b.rollAngle += speed * 0.12; // 3D rolling visual rotation

        // Cushion Bounces (Elastic Rubber Rails)
        if (b.x < minX) { b.x = minX; b.vx = -b.vx * 0.94; SoundEffects.playClick(); }
        if (b.x > maxX) { b.x = maxX; b.vx = -b.vx * 0.94; SoundEffects.playClick(); }
        if (b.y < minY) { b.y = minY; b.vy = -b.vy * 0.94; SoundEffects.playClick(); }
        if (b.y > maxY) { b.y = maxY; b.vy = -b.vy * 0.94; SoundEffects.playClick(); }

        // Check 6 Pockets with smooth gravity suction
        POCKETS.forEach(p => {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < POCKET_RADIUS + 4) {
            // Suction pull towards center of pocket hole
            b.vx += (p.x - b.x) * 0.15;
            b.vy += (p.y - b.y) * 0.15;
            b.scale = Math.max(0.4, b.scale - 0.05);

            if (dist < POCKET_RADIUS * 0.6) {
              b.active = false;
              b.vx = 0;
              b.vy = 0;
              b.scale = 1;
              SoundEffects.playSafe();
              s.pocketedThisTurn.push(b);

              // Pocket sparks
              for (let i = 0; i < 18; i++) {
                s.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: b.color || '#ffffff',
                  life: 22
                });
              }
            }
          }
        });
      } else {
        b.vx = 0;
        b.vy = 0;
      }
    });

    // 2. Realistic Elastic Ball-to-Ball Collisions
    for (let i = 0; i < allBalls.length; i++) {
      for (let j = i + 1; j < allBalls.length; j++) {
        const b1 = allBalls[i];
        const b2 = allBalls[j];
        if (!b1.active || !b2.active) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = BALL_RADIUS * 2;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;

          // Resolve overlap
          const overlap = minDist - dist;
          b1.x -= nx * (overlap * 0.5);
          b1.y -= ny * (overlap * 0.5);
          b2.x += nx * (overlap * 0.5);
          b2.y += ny * (overlap * 0.5);

          // Momentum & Kinetic energy exchange
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const impulse = 2 * (nx * kx + ny * ky) / 2;

          b1.vx -= impulse * nx * 0.97;
          b1.vy -= impulse * ny * 0.97;
          b2.vx += impulse * nx * 0.97;
          b2.vy += impulse * ny * 0.97;

          if (b1 === s.cueBall && !s.firstBallHit) s.firstBallHit = b2;
          else if (b2 === s.cueBall && !s.firstBallHit) s.firstBallHit = b1;

          SoundEffects.playTokenStep();
        }
      }
    }

    // 3. Particles
    s.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
    });
    s.particles = s.particles.filter(pt => pt.life > 0);

    // 4. Shot Ended Resolution
    if (isShooting && !anyMoving) {
      setIsShooting(false);
      handleTurnEnd();
    }
  };

  const handleTurnEnd = async () => {
    const s = stateRef.current;
    const pocketed = [...s.pocketedThisTurn];
    s.pocketedThisTurn = [];

    const cueScratch = !s.cueBall.active;
    const eightBallPotted = pocketed.some(b => b.num === 8);

    // Scratch handling: Ball in Hand
    if (cueScratch) {
      s.cueBall.active = true;
      s.cueBall.x = 240;
      s.cueBall.y = TABLE_HEIGHT / 2;
      s.cueBall.vx = 0;
      s.cueBall.vy = 0;
      s.cueBall.scale = 1;
      setBallInHand(true);
      SoundEffects.playLoss();
    }

    // 8-Ball Win or Loss check
    if (eightBallPotted) {
      const myType = turn === 'P1' ? p1Type : p2Type;
      const myRemaining = s.balls.filter(b => b.active && b.type === myType).length;

      if (myRemaining === 0 && !cueScratch) {
        triggerWin(turn === 'P1' ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2'));
      } else {
        // Early 8-ball pot or scratch on 8-ball = loss!
        triggerWin(turn === 'P1' ? (gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2') : 'PLAYER 1');
      }
      return;
    }

    // Solids / Stripes assignment
    let keepTurn = false;
    const regularPotted = pocketed.filter(b => b.num !== 8 && b !== s.cueBall);

    if (regularPotted.length > 0 && !p1Type && !cueScratch) {
      const firstType = regularPotted[0].type;
      const oppType = firstType === 'SOLID' ? 'STRIPE' : 'SOLID';
      if (turn === 'P1') {
        setP1Type(firstType);
        setP2Type(oppType);
      } else {
        setP2Type(firstType);
        setP1Type(oppType);
      }
      keepTurn = true;
    } else if (regularPotted.length > 0 && !cueScratch) {
      const myType = turn === 'P1' ? p1Type : p2Type;
      const pottedMyBall = regularPotted.some(b => b.type === myType);
      if (pottedMyBall) keepTurn = true;
    }

    // Update potted trays
    setP1Potted(s.balls.filter(b => !b.active && b.type === p1Type));
    setP2Potted(s.balls.filter(b => !b.active && b.type === p2Type));

    if (!keepTurn || cueScratch) {
      const nextTurn = turn === 'P1' ? 'P2' : 'P1';
      setTurn(nextTurn);
      const nextName = nextTurn === 'P1' ? 'Player 1' : (gameMode === 'VS_AI' ? 'AI Bot' : 'Player 2');
      setTurnMessage(cueScratch ? `Scratch! ${nextName} has Ball in Hand` : `${nextName}'s Turn`);

      if (gameMode === 'VS_AI' && nextTurn === 'P2' && !gameOver) {
        setTimeout(() => triggerAiShot(), 950);
      }
    } else {
      const curName = turn === 'P1' ? 'Player 1' : (gameMode === 'VS_AI' ? 'AI Bot' : 'Player 2');
      setTurnMessage(`Ball potted! ${curName} shoots again.`);
    }
  };

  const triggerAiShot = () => {
    const s = stateRef.current;
    if (!s.cueBall.active || gameOver) return;

    const myType = p2Type;
    let candidates = s.balls.filter(b => b.active && (myType ? b.type === myType : b.type !== 'EIGHT'));
    if (candidates.length === 0) candidates = s.balls.filter(b => b.active);

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (!target) return;

    const dx = target.x - s.cueBall.x;
    const dy = target.y - s.cueBall.y;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.05;

    setAimAngle(angle);
    executeStrike(angle, 55 + Math.random() * 35);
  };

  const executeStrike = (angle, shotPower) => {
    const s = stateRef.current;
    if (isShooting || !s.cueBall.active || gameOver) return;

    const vel = (shotPower / 100) * 18;
    s.cueBall.vx = Math.cos(angle) * vel;
    s.cueBall.vy = Math.sin(angle) * vel;

    // Apply spin
    s.cueBall.vx += spinOffset.x * 1.5;
    s.cueBall.vy += spinOffset.y * 1.5;
    s.firstBallHit = null;

    setIsShooting(true);
    setBallInHand(false);
    SoundEffects.playClick();
  };

  const triggerWin = async (winnerName) => {
    setGameOver(true);
    setWinner(winnerName);
    SoundEffects.playWin();
    const res = await api.submitScore('EIGHT_BALL_POOL', 650, winnerName === 'PLAYER 1', user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // Canvas Mouse Controls (Aiming & Ball Placement)
  const handleCanvasMouseMove = (e) => {
    if (isShooting || (gameMode === 'VS_AI' && turn === 'P2') || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    stateRef.current.mousePos = { x: mouseX, y: mouseY };

    if (ballInHand) {
      stateRef.current.cueBall.x = Math.max(PLAY_X + BALL_RADIUS + 2, Math.min(280, mouseX));
      stateRef.current.cueBall.y = Math.max(PLAY_Y + BALL_RADIUS + 2, Math.min(PLAY_Y + PLAY_H - BALL_RADIUS - 2, mouseY));
      return;
    }

    const cue = stateRef.current.cueBall;
    const angle = Math.atan2(mouseY - cue.y, mouseX - cue.x);
    setAimAngle(angle);
  };

  const handleCanvasMouseDown = () => {
    if (ballInHand) {
      setBallInHand(false);
      SoundEffects.playClick();
    }
  };

  // Miniclip Left-Side Vertical Power Gauge Drag
  const handlePowerDrag = (e) => {
    if (isShooting || gameOver) return;
    const gauge = powerGaugeRef.current;
    if (!gauge) return;
    const rect = gauge.getBoundingClientRect();
    const relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const p = Math.round((relY / rect.height) * 100);
    setPower(Math.max(10, p));
  };

  // --- RENDER HYPER-REALISTIC BILLIARD TABLE ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    const s = stateRef.current;

    // 1. Rich Mahogany Wood Outer Rails & Polish Glare
    const woodGrad = ctx.createLinearGradient(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    woodGrad.addColorStop(0, '#2a1208');
    woodGrad.addColorStop(0.3, '#4e2311');
    woodGrad.addColorStop(0.7, '#38170b');
    woodGrad.addColorStop(1, '#1b0903');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 24);
    ctx.fill();

    // Metallic Brass Corner Caps
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, TABLE_WIDTH - 8, TABLE_HEIGHT - 8, 22);
    ctx.stroke();

    // 18 Pearl Diamond Inlays
    ctx.fillStyle = '#f8f9fa';
    // Top & Bottom Diamonds (6 each)
    for (let i = 1; i <= 6; i++) {
      const dx = PLAY_X + PLAY_W * (i / 7);
      drawDiamond(ctx, dx, RAIL_SIZE / 2);
      drawDiamond(ctx, dx, TABLE_HEIGHT - RAIL_SIZE / 2);
    }
    // Left & Right Diamonds (3 each)
    for (let i = 1; i <= 3; i++) {
      const dy = PLAY_Y + PLAY_H * (i / 4);
      drawDiamond(ctx, RAIL_SIZE / 2, dy);
      drawDiamond(ctx, TABLE_WIDTH - RAIL_SIZE / 2, dy);
    }

    // 2. Realistic Felt Cloth with Ambient Shadows
    const themes = {
      TOURNAMENT_GREEN: { c1: '#0d5c2e', c2: '#063b1c', cushion: '#094422' },
      ROYAL_BLUE: { c1: '#0d47a1', c2: '#082a66', cushion: '#0a3580' },
      CYBER_DARK: { c1: '#111827', c2: '#05070d', cushion: '#0b0f19' }
    };
    const th = themes[feltTheme] || themes.TOURNAMENT_GREEN;

    // Felt Radial Gradient (Spotlight from above)
    const feltGrad = ctx.createRadialGradient(
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 40,
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, TABLE_WIDTH * 0.55
    );
    feltGrad.addColorStop(0, th.c1);
    feltGrad.addColorStop(1, th.c2);
    ctx.fillStyle = feltGrad;
    ctx.fillRect(PLAY_X, PLAY_Y, PLAY_W, PLAY_H);

    // Beveled Rubber Cushions with Corner Throat Angles
    ctx.fillStyle = th.cushion;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 3;
    // Top & Bottom Cushion Bars
    ctx.fillRect(PLAY_X + POCKET_RADIUS, PLAY_Y - 4, (PLAY_W / 2) - POCKET_RADIUS * 1.5, 6);
    ctx.fillRect(TABLE_WIDTH / 2 + POCKET_RADIUS * 0.5, PLAY_Y - 4, (PLAY_W / 2) - POCKET_RADIUS * 1.5, 6);
    ctx.fillRect(PLAY_X + POCKET_RADIUS, PLAY_Y + PLAY_H - 2, (PLAY_W / 2) - POCKET_RADIUS * 1.5, 6);
    ctx.fillRect(TABLE_WIDTH / 2 + POCKET_RADIUS * 0.5, PLAY_Y + PLAY_H - 2, (PLAY_W / 2) - POCKET_RADIUS * 1.5, 6);

    // Headstring Line & Spot
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(240, PLAY_Y);
    ctx.lineTo(240, PLAY_Y + PLAY_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Headstring Center Spot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(240, TABLE_HEIGHT / 2, 2.5, 0, Math.PI * 2);
    ctx.arc(580, TABLE_HEIGHT / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6 Real Leather Pocket Cups with Brass Rim Flanges
    POCKETS.forEach(p => {
      // Brass rim ring
      ctx.fillStyle = '#c59b27';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS + 3, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark drop hole with leather cup shadow
      ctx.fillStyle = '#050508';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Authentic Miniclip 2-Part Trajectory Sight Line
    if (!isShooting && s.cueBall.active && !gameOver && (gameMode !== 'VS_AI' || turn === 'P1')) {
      const cue = s.cueBall;
      let closestBall = null;
      let minRayDist = 700;

      s.balls.forEach(b => {
        if (!b.active) return;
        const dx = b.x - cue.x;
        const dy = b.y - cue.y;
        const proj = dx * Math.cos(aimAngle) + dy * Math.sin(aimAngle);
        if (proj > 0) {
          const perpDist = Math.abs(-dx * Math.sin(aimAngle) + dy * Math.cos(aimAngle));
          if (perpDist < BALL_RADIUS * 2 && proj < minRayDist) {
            minRayDist = proj;
            closestBall = b;
          }
        }
      });

      // Dotted Primary Raycast
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + Math.cos(aimAngle) * minRayDist, cue.y + Math.sin(aimAngle) * minRayDist);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ghost Ball Outline & Target Deflection Line
      if (closestBall) {
        const hitX = cue.x + Math.cos(aimAngle) * minRayDist;
        const hitY = cue.y + Math.sin(aimAngle) * minRayDist;

        // Ghost Ball Circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hitX, hitY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary Target Ball Path
        const targetDeflect = Math.atan2(closestBall.y - hitY, closestBall.x - hitX);
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(closestBall.x, closestBall.y);
        ctx.lineTo(closestBall.x + Math.cos(targetDeflect) * 90, closestBall.y + Math.sin(targetDeflect) * 90);
        ctx.stroke();

        // Cue Ball Tangent Deflection Line (90 degrees)
        const cueDeflect = targetDeflect + (Math.sin(aimAngle - targetDeflect) > 0 ? -Math.PI / 2 : Math.PI / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hitX, hitY);
        ctx.lineTo(hitX + Math.cos(cueDeflect) * 45, hitY + Math.sin(cueDeflect) * 45);
        ctx.stroke();
      }

      // 5. Realistic Wooden Cue Stick with Tapered Shaft & Chalk Tip
      const pullDist = 24 + (power / 100) * 45;
      const cueTipX = cue.x - Math.cos(aimAngle) * pullDist;
      const cueTipY = cue.y - Math.sin(aimAngle) * pullDist;
      const cueButtX = cueTipX - Math.cos(aimAngle) * 220;
      const cueButtY = cueTipY - Math.sin(aimAngle) * 220;

      // Wooden Shaft with Taper
      const cueGrad = ctx.createLinearGradient(cueTipX, cueTipY, cueButtX, cueButtY);
      cueGrad.addColorStop(0, '#e8c39e');
      cueGrad.addColorStop(0.5, '#c68b59');
      cueGrad.addColorStop(1, '#2b1e16');

      ctx.strokeStyle = cueGrad;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cueTipX, cueTipY);
      ctx.lineTo(cueButtX, cueButtY);
      ctx.stroke();

      // Grip Inlay Wrap
      const gripX = cueTipX - Math.cos(aimAngle) * 120;
      const gripY = cueTipY - Math.sin(aimAngle) * 120;
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.moveTo(gripX, gripY);
      ctx.lineTo(cueButtX, cueButtY);
      ctx.stroke();

      // Brass Ferrule & Blue Chalk Tip
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.arc(cueTipX, cueTipY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. 3D Spherical Object Balls
    s.balls.forEach(b => {
      if (!b.active) return;
      draw3DSphereBall(ctx, b.x, b.y, b.color, b.type, b.num, b.rollAngle, b.scale);
    });

    // 7. Glossy Ivory Cue Ball
    if (s.cueBall.active) {
      draw3DSphereBall(ctx, s.cueBall.x, s.cueBall.y, '#ffffff', 'CUE', null, s.cueBall.rollAngle, s.cueBall.scale);
    }
  };

  const drawDiamond = (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 3.5);
    ctx.lineTo(x + 3.5, y);
    ctx.lineTo(x, y + 3.5);
    ctx.lineTo(x - 3.5, y);
    ctx.closePath();
    ctx.fill();
  };

  /**
   * 3D Spherical Billiard Ball Renderer
   * Spherical specular highlights, ambient felt shadow,
   * crisp numbered circle, and striped bands!
   */
  const draw3DSphereBall = (ctx, x, y, color, type, num, rollAngle, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const r = BALL_RADIUS;

    // 1. Ambient Drop Shadow on Felt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 3, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base 3D Sphere Surface
    const sphereGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1.5, 0, 0, r);
    sphereGrad.addColorStop(0, '#ffffff'); // Specular highlight
    sphereGrad.addColorStop(0.25, type === 'STRIPE' ? '#ffffff' : color);
    sphereGrad.addColorStop(0.85, type === 'STRIPE' ? '#e2e8f0' : color);
    sphereGrad.addColorStop(1, '#050505'); // Shadow perimeter

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Striped Ball Colored Band
    if (type === 'STRIPE') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.32, Math.PI * 0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.68, Math.PI * 1.32);
      ctx.fill();
    }

    // 4. White Center Circle with Number
    if (num) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Ball Number
      ctx.fillStyle = '#0a0a0f';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0.5);
    }

    // 5. Cue Ball Red Aiming Dots
    if (type === 'CUE') {
      ctx.fillStyle = '#ee1122';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <div className="pool-master-arena glass-panel">
      {/* Top Header */}
      <div className="pool-top-nav">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => setGameMode('VS_AI')}
          >
            🤖 VS AI BOT
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER PASS & PLAY
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'PRACTICE' ? 'active' : ''}`}
            onClick={() => setGameMode('PRACTICE')}
          >
            🎯 SOLO PRACTICE
          </button>
        </div>

        {/* Felt Cloth Selector */}
        <div className="felt-theme-selector">
          <button 
            className={`felt-btn green ${feltTheme === 'TOURNAMENT_GREEN' ? 'active' : ''}`}
            onClick={() => setFeltTheme('TOURNAMENT_GREEN')}
            title="Tournament Emerald"
          />
          <button 
            className={`felt-btn blue ${feltTheme === 'ROYAL_BLUE' ? 'active' : ''}`}
            onClick={() => setFeltTheme('ROYAL_BLUE')}
            title="Royal Blue"
          />
          <button 
            className={`felt-btn dark ${feltTheme === 'CYBER_DARK' ? 'active' : ''}`}
            onClick={() => setFeltTheme('CYBER_DARK')}
            title="Cyber Midnight"
          />
        </div>

        <button className="btn-tertiary" onClick={resetRack}>↺ RE-RACK</button>
      </div>

      {/* Realistic Scoreboard Banner */}
      <div className="pool-pro-scoreboard">
        {/* Player 1 Card */}
        <div className={`pro-player-card p1 ${turn === 'P1' ? 'active-turn' : ''}`}>
          <div className="p-avatar-wrap">
            <span className="p-avatar">👤</span>
            <div>
              <h4 className="p-name">PLAYER 1</h4>
              <span className="p-suit" style={{ color: '#00f3ff' }}>{p1Type || 'OPEN TABLE'}</span>
            </div>
          </div>
          <div className="p-potted-balls">
            {p1Potted.map(b => (
              <div key={b.id} className="mini-hud-ball" style={{ backgroundColor: b.color }}>
                {b.num}
              </div>
            ))}
          </div>
        </div>

        {/* Center Live Announcer */}
        <div className="pro-match-announcer">
          <span className="match-turn-msg" style={{ color: turn === 'P1' ? '#00f3ff' : '#ff007f' }}>
            {turnMessage}
          </span>
          {ballInHand && (
            <span className="hand-callout">🎱 BALL IN HAND &bull; CLICK TABLE TO PLACE CUE BALL</span>
          )}
        </div>

        {/* Player 2 / AI Card */}
        <div className={`pro-player-card p2 ${turn === 'P2' ? 'active-turn' : ''}`}>
          <div className="p-avatar-wrap">
            <span className="p-avatar">{gameMode === 'VS_AI' ? '🤖' : '👤'}</span>
            <div>
              <h4 className="p-name">{gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2'}</h4>
              <span className="p-suit" style={{ color: '#ff007f' }}>{p2Type || 'OPEN TABLE'}</span>
            </div>
          </div>
          <div className="p-potted-balls">
            {p2Potted.map(b => (
              <div key={b.id} className="mini-hud-ball" style={{ backgroundColor: b.color }}>
                {b.num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Main Table & Miniclip Vertical Power Bar Layout */}
      <div className="pool-stage-layout">
        {/* Left-Side Miniclip Vertical Pull-Down Power Gauge */}
        <div className="miniclip-power-column">
          <span className="power-tag">POWER</span>
          <div
            ref={powerGaugeRef}
            className="vertical-power-track"
            onMouseMove={(e) => { if (e.buttons === 1) handlePowerDrag(e); }}
            onMouseDown={handlePowerDrag}
          >
            <div className="vertical-power-fill" style={{ height: `${power}%` }} />
            <div className="vertical-cue-slider" style={{ top: `${power}%` }}>
              <div className="slider-grip-line" />
            </div>
          </div>
          <span className="power-num-lbl">{power}%</span>
        </div>

        {/* 2D Canvas Table Area */}
        <div className="pool-table-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            className="pool-pro-canvas"
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
          />
        </div>
      </div>

      {/* Bottom Action Strike Bar & Spin Selector */}
      <div className="pool-bottom-actions">
        <div className="cue-spin-selector">
          <span className="spin-lbl">CUE BALL SPIN</span>
          <div
            className="spin-ball-widget"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const sx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
              const sy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
              setSpinOffset({ x: sx, y: sy });
            }}
          >
            <div
              className="spin-dot-indicator"
              style={{
                left: `${(spinOffset.x + 1) * 50}%`,
                top: `${(spinOffset.y + 1) * 50}%`
              }}
            />
          </div>
        </div>

        <button
          className="btn-primary strike-pro-btn"
          onClick={() => executeStrike(aimAngle, power)}
          disabled={isShooting || gameOver || (gameMode === 'VS_AI' && turn === 'P2')}
        >
          🎱 STRIKE CUE BALL ({power}%)
        </button>
      </div>

      <p className="pool-pro-hint">
        💡 Move mouse around table to aim Miniclip trajectory line. Drag vertical power gauge on left and click <strong>STRIKE</strong>!
      </p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} VICTORY!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            {winner === 'PLAYER 1' ? 'Pocketed the 8-Ball masterfully!' : '8-Ball pocketed.'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={resetRack}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EightBallPoolGame;
