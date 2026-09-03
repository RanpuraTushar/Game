import React, { useState, useEffect, useRef, useCallback } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './UnoGame.css';

// --- OFFICIAL UNO CONSTANTS & COLOR SYSTEM ---
const COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

const COLOR_CONFIG = {
  RED: { hex: '#ff1744', name: 'RED', glow: 'rgba(255, 23, 68, 0.6)' },
  BLUE: { hex: '#00b0ff', name: 'BLUE', glow: 'rgba(0, 176, 255, 0.6)' },
  GREEN: { hex: '#00e676', name: 'GREEN', glow: 'rgba(0, 230, 118, 0.6)' },
  YELLOW: { hex: '#ffd600', name: 'YELLOW', glow: 'rgba(255, 214, 0, 0.6)' },
  WILD: { hex: '#e040fb', name: 'WILD', glow: 'rgba(224, 64, 251, 0.6)' }
};

// Web Audio Synthesizer for Authentic UNO Soundscapes
class UnoAudioSynth {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCardSlide() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playCardSnap(isSpecial = false) {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isSpecial ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isSpecial ? 680 : 540, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  playReverse() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.14);
      osc.frequency.linearRampToValueAtTime(350, now + 0.28);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {}
  }

  playSkip() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.setValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  playWildChord() {
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      });
    } catch (e) {}
  }

  playUnoFanfare() {
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
      });
    } catch (e) {}
  }

  playDrawPenalty() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }
}

const unoAudio = new UnoAudioSynth();

// --- OFFICIAL 108-CARD DECK GENERATOR ---
const generateOfficialDeck = () => {
  const full = [];
  let cid = 1;

  COLORS.forEach(c => {
    full.push({ id: cid++, color: c, value: '0', symbol: '0' });

    for (let num = 1; num <= 9; num++) {
      const valStr = String(num);
      full.push({ id: cid++, color: c, value: valStr, symbol: valStr });
      full.push({ id: cid++, color: c, value: valStr, symbol: valStr });
    }

    ['SKIP', 'REVERSE', 'DRAW2'].forEach(act => {
      full.push({ id: cid++, color: c, value: act, symbol: act === 'SKIP' ? '🚫' : act === 'REVERSE' ? '🔄' : '+2' });
      full.push({ id: cid++, color: c, value: act, symbol: act === 'SKIP' ? '🚫' : act === 'REVERSE' ? '🔄' : '+2' });
    });
  });

  for (let i = 0; i < 4; i++) {
    full.push({ id: cid++, color: 'WILD', value: 'WILD', symbol: '🌈' });
    full.push({ id: cid++, color: 'WILD', value: 'WILD_DRAW4', symbol: '+4' });
  }

  for (let s = 0; s < 3; s++) {
    for (let i = full.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [full[i], full[j]] = [full[j], full[i]];
    }
  }

  return full;
};

const UnoGame = ({ user, onLeave }) => {
  // Mode: 'VS_AI' (1v1 vs Bot - Default & most intuitive!), 'FOUR_PLAYER' (4P table vs 3 bots), 'TWO_PLAYER' (Pass & Play)
  const [gameMode, setGameMode] = useState('VS_AI');
  const [stackingRule, setStackingRule] = useState(true);

  // Visible Reactive States
  const [hands, setHands] = useState([[], [], [], []]);
  const [discardPile, setDiscardPile] = useState([]);
  const [deckCount, setDeckCount] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [currentColor, setCurrentColor] = useState('RED');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [justDrawnCard, setJustDrawnCard] = useState(null);
  const [unoCallState, setUnoCallState] = useState({});
  const [canCatchUno, setCanCatchUno] = useState(null);
  const [actionBanner, setActionBanner] = useState(null);
  const [turnMessage, setTurnMessage] = useState('Your Turn! Match color or number, or play a Wild.');
  const [passScreen, setPassScreen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [botStatusText, setBotStatusText] = useState({});

  // Human Player Interactive Prompts (Guarantees NO auto-skipping or auto-playing behind user's back!)
  const [pendingPenaltyPrompt, setPendingPenaltyPrompt] = useState(null); // { count, fromName }
  const [pendingSkipPrompt, setPendingSkipPrompt] = useState(false);

  // Single Source of Truth Ref
  const stateRef = useRef({
    hands: [[], [], [], []],
    deck: [],
    discardPile: [],
    turnIndex: 0,
    direction: 1,
    currentColor: 'RED',
    gameMode: 'VS_AI',
    stackingRule: true,
    activeStack: 0,
    calledUno: {},
    botThinking: false,
    gameOver: false
  });

  useEffect(() => { stateRef.current.gameMode = gameMode; }, [gameMode]);
  useEffect(() => { stateRef.current.stackingRule = stackingRule; }, [stackingRule]);

  const flashBanner = (text, type = 'info') => {
    setActionBanner({ text, type });
    setTimeout(() => setActionBanner(null), 2500);
  };

  const getPlayerName = (idx) => {
    if (idx === 0) return 'You (P1)';
    if (gameMode === 'TWO_PLAYER') return 'Player 2';
    if (gameMode === 'VS_AI') return 'Cyber AI Bot';
    if (idx === 1) return 'Nova Bot (Left)';
    if (idx === 2) return 'Apex Bot (Top)';
    return 'Viper Bot (Right)';
  };

  const drawCardsForTarget = (targetIdx, count) => {
    const s = stateRef.current;
    if (count <= 0) return;

    if (s.deck.length < count) {
      const top = s.discardPile.pop();
      const recycled = [...s.discardPile];
      for (let i = recycled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recycled[i], recycled[j]] = [recycled[j], recycled[i]];
      }
      s.deck.push(...recycled);
      if (s.deck.length === 0) s.deck = generateOfficialDeck();
      s.discardPile = [top];
    }

    const drawn = s.deck.splice(0, count);
    s.hands[targetIdx].push(...drawn);
    s.calledUno[targetIdx] = false;

    unoAudio.playCardSlide();
    setHands(s.hands.map(h => [...h]));
    setDeckCount(s.deck.length);
    setDiscardPile([...s.discardPile]);
    setUnoCallState({ ...s.calledUno });
  };

  const triggerWin = async (winnerName) => {
    stateRef.current.gameOver = true;
    setGameOver(true);
    setWinner(winnerName);
    SoundEffects.playWin();

    const isP1Win = winnerName === 'YOU (P1)' || winnerName === 'PLAYER 1';
    const res = await api.submitScore('UNO', 800, isP1Win, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // --- START / RE-DEAL GAME ---
  const startNewGame = useCallback(() => {
    const full = generateOfficialDeck();
    const is4P = gameMode === 'FOUR_PLAYER';
    const numPlayers = is4P ? 4 : 2;

    const newHands = [];
    for (let p = 0; p < 4; p++) {
      if (p < numPlayers) {
        newHands.push(full.splice(0, 7));
      } else {
        newHands.push([]);
      }
    }

    // First card: ALWAYS ensure it's a number card (0-9) so Player 1 ALWAYS opens the game!
    let first = full.pop();
    while (first.color === 'WILD' || first.value === 'SKIP' || first.value === 'REVERSE' || first.value === 'DRAW2') {
      full.unshift(first);
      first = full.pop();
    }

    const firstDiscard = {
      ...first,
      rotation: (Math.random() - 0.5) * 14
    };

    const s = stateRef.current;
    s.hands = newHands;
    s.deck = full;
    s.discardPile = [firstDiscard];
    s.turnIndex = 0; // PLAYER 1 ALWAYS STARTS!
    s.direction = 1;
    s.currentColor = first.color;
    s.activeStack = 0;
    s.calledUno = {};
    s.botThinking = false;
    s.gameOver = false;

    setHands(newHands.map(h => [...h]));
    setDiscardPile([firstDiscard]);
    setDeckCount(full.length);
    setTurnIndex(0);
    setDirection(1);
    setCurrentColor(first.color);
    setShowColorPicker(false);
    setPendingWildCard(null);
    setJustDrawnCard(null);
    setPendingPenaltyPrompt(null);
    setPendingSkipPrompt(false);
    setUnoCallState({});
    setCanCatchUno(null);
    setPassScreen(false);
    setGameOver(false);
    setWinner(null);
    setBotStatusText({});

    const startMsg = `Your Turn! Table opens with ${first.color} ${first.value}.`;
    setTurnMessage(startMsg);
    flashBanner(startMsg, 'start');
    unoAudio.playCardSlide();
  }, [gameMode]);

  useEffect(() => {
    startNewGame();
  }, [gameMode]);

  const topCard = discardPile[discardPile.length - 1] || null;

  // --- OFFICIAL PLAYABILITY CHECK ---
  const isCardPlayable = (card) => {
    const s = stateRef.current;
    const top = s.discardPile[s.discardPile.length - 1];
    if (!top) return true;

    // Active stacked penalty rules (+2 on +2, +4 on +4)
    if (s.activeStack > 0 && s.stackingRule) {
      if (top.value === 'DRAW2') {
        return card.value === 'DRAW2' || card.value === 'WILD_DRAW4';
      }
      if (top.value === 'WILD_DRAW4') {
        return card.value === 'WILD_DRAW4';
      }
    }

    if (card.color === 'WILD') return true;
    if (card.color === s.currentColor) return true;
    if (card.value === top.value) return true;
    return false;
  };

  // --- CARD PLAY RESOLUTION ---
  const executePlayCard = (card, playerIdx, chosenColor) => {
    const s = stateRef.current;
    if (s.gameOver) return;

    if (card.color === 'WILD') unoAudio.playWildChord();
    else if (card.value === 'REVERSE') unoAudio.playReverse();
    else if (card.value === 'SKIP') unoAudio.playSkip();
    else unoAudio.playCardSnap(card.value === 'DRAW2');

    // Remove played card from hand
    const nextHand = s.hands[playerIdx].filter(c => c.id !== card.id);
    s.hands[playerIdx] = nextHand;

    const newDiscardCard = {
      ...card,
      rotation: (Math.random() - 0.5) * 20
    };
    s.discardPile.push(newDiscardCard);
    s.currentColor = chosenColor;

    // UNO Shout Check
    if (nextHand.length === 1) {
      if (playerIdx === 0 && !s.calledUno[0]) {
        setCanCatchUno(0);
        flashBanner('🔥 UNO! Tap SHOUT UNO before your turn finishes!', 'uno');
        setTimeout(() => {
          const cur = stateRef.current;
          if (cur.hands[0].length === 1 && !cur.calledUno[0] && !cur.gameOver) {
            botCatchUno(0);
          }
        }, 4000);
      } else if (playerIdx !== 0) {
        const botCalls = Math.random() < 0.85;
        if (botCalls) {
          s.calledUno[playerIdx] = true;
          unoAudio.playUnoFanfare();
          flashBanner(`🔥 ${getPlayerName(playerIdx)} shouted UNO! (1 card left)`, 'uno');
        } else {
          setCanCatchUno(playerIdx);
          flashBanner(`⚠️ ${getPlayerName(playerIdx)} forgot UNO! Tap CATCH BOT!`, 'warning');
          setTimeout(() => {
            setCanCatchUno(prev => (prev === playerIdx ? null : prev));
          }, 4000);
        }
      }
    } else if (nextHand.length > 1) {
      s.calledUno[playerIdx] = false;
    }

    setHands(s.hands.map(h => [...h]));
    setDiscardPile([...s.discardPile]);
    setCurrentColor(chosenColor);
    setUnoCallState({ ...s.calledUno });

    // Check Victory
    if (nextHand.length === 0) {
      triggerWin(playerIdx === 0 ? 'YOU (P1)' : getPlayerName(playerIdx).toUpperCase());
      return;
    }

    // Action Card Resolution & Next Turn Determination
    const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
    let nextIdx = (playerIdx + s.direction + numPlayers) % numPlayers;
    let msg = `${getPlayerName(nextIdx)}'s Turn`;

    if (card.value === 'REVERSE') {
      s.direction *= -1;
      setDirection(s.direction);
      if (numPlayers === 2) {
        // In 1v1 / 2P: Reverse acts like a Skip! Player plays again!
        nextIdx = playerIdx;
        msg = `🔄 Reverse! ${getPlayerName(playerIdx)} gets another turn!`;
      } else {
        nextIdx = (playerIdx + s.direction + numPlayers) % numPlayers;
        msg = `🔄 Reverse! Direction reversed. ${getPlayerName(nextIdx)}'s Turn.`;
      }
      flashBanner('🔄 DIRECTION REVERSED!', 'info');
    } else if (card.value === 'SKIP') {
      const skippedPlayer = nextIdx;
      nextIdx = (nextIdx + s.direction + numPlayers) % numPlayers;
      msg = `🚫 Skip! ${getPlayerName(skippedPlayer)} was skipped. ${getPlayerName(nextIdx)}'s Turn.`;
      flashBanner(`🚫 ${getPlayerName(skippedPlayer)} WAS SKIPPED!`, 'info');

      // If the skipped player was Human Player (0):
      if (skippedPlayer === 0) {
        setPendingSkipPrompt(true);
        s.turnIndex = 0;
        setTurnIndex(0);
        setTurnMessage(`🚫 You were skipped! Tap OK to pass.`);
        return;
      }
    } else if (card.value === 'DRAW2') {
      if (s.stackingRule) {
        s.activeStack += 2;
        msg = `➕2 Stacked! (+${s.activeStack} total). ${getPlayerName(nextIdx)}'s Turn!`;
        flashBanner(`➕2 STACKED! (+${s.activeStack} Cards)`, 'warning');
      } else {
        drawCardsForTarget(nextIdx, 2);
        const skippedPlayer = nextIdx;
        nextIdx = (nextIdx + s.direction + numPlayers) % numPlayers;
        msg = `➕2 ${getPlayerName(skippedPlayer)} drew 2 cards and was skipped!`;
        flashBanner(`➕2 ${getPlayerName(skippedPlayer)} DREW 2!`, 'warning');
      }
    } else if (card.value === 'WILD_DRAW4') {
      if (s.stackingRule) {
        s.activeStack += 4;
        msg = `🌈+4 Stacked! (+${s.activeStack} total). Color: ${chosenColor}.`;
        flashBanner(`🌈+4 STACKED! Color: ${chosenColor}`, 'warning');
      } else {
        drawCardsForTarget(nextIdx, 4);
        const skippedPlayer = nextIdx;
        nextIdx = (nextIdx + s.direction + numPlayers) % numPlayers;
        msg = `🌈+4 ${getPlayerName(skippedPlayer)} drew 4 cards! Color: ${chosenColor}.`;
        flashBanner(`🌈+4 ${getPlayerName(skippedPlayer)} DREW 4!`, 'warning');
      }
    }

    s.turnIndex = nextIdx;
    setTurnIndex(nextIdx);
    setTurnMessage(msg);

    // If there is an active stacked penalty (+2 or +4):
    if (s.activeStack > 0 && s.stackingRule) {
      if (nextIdx === 0) {
        // Human Player is attacked! Show interactive prompt — NEVER AUTO-SKIP!
        const canStack = s.hands[0].some(c =>
          (card.value === 'DRAW2' && (c.value === 'DRAW2' || c.value === 'WILD_DRAW4')) ||
          (card.value === 'WILD_DRAW4' && c.value === 'WILD_DRAW4')
        );
        setPendingPenaltyPrompt({ count: s.activeStack, canStack });
        return;
      } else {
        // Bot is attacked
        const botHand = s.hands[nextIdx];
        const botCanStack = botHand.some(c =>
          (card.value === 'DRAW2' && (c.value === 'DRAW2' || c.value === 'WILD_DRAW4')) ||
          (card.value === 'WILD_DRAW4' && c.value === 'WILD_DRAW4')
        );

        if (!botCanStack) {
          // Bot absorbs penalty after natural pause
          setTimeout(() => {
            drawCardsForTarget(nextIdx, s.activeStack);
            flashBanner(`💥 ${getPlayerName(nextIdx)} drew +${s.activeStack} cards penalty!`, 'warning');
            s.activeStack = 0;
            const afterPenalty = (nextIdx + s.direction + numPlayers) % numPlayers;
            s.turnIndex = afterPenalty;
            setTurnIndex(afterPenalty);
            setTurnMessage(`${getPlayerName(afterPenalty)}'s Turn`);

            if (afterPenalty !== 0 && s.gameMode !== 'TWO_PLAYER') {
              setTimeout(() => executeBotTurn(afterPenalty), 1200);
            }
          }, 1200);
          return;
        }
      }
    }

    // Normal Turn Transition
    if (s.gameMode === 'TWO_PLAYER' && nextIdx !== 0) {
      setPassScreen(true);
    } else if (nextIdx !== 0) {
      // Bot's turn: Give natural, readable pause (1.2 seconds) so player can follow!
      setTimeout(() => executeBotTurn(nextIdx), 1200);
    }
  };

  // --- HUMAN PLAYER PENALTY & SKIP RESPONSES ---
  const handlePlayerAcceptPenalty = () => {
    const s = stateRef.current;
    drawCardsForTarget(0, s.activeStack);
    flashBanner(`You drew ${s.activeStack} cards penalty. Turn passed!`, 'warning');
    s.activeStack = 0;
    setPendingPenaltyPrompt(null);

    const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
    const nextIdx = (0 + s.direction + numPlayers) % numPlayers;
    s.turnIndex = nextIdx;
    setTurnIndex(nextIdx);
    setTurnMessage(`${getPlayerName(nextIdx)}'s Turn`);

    if (s.gameMode === 'TWO_PLAYER') setPassScreen(true);
    else if (nextIdx !== 0) setTimeout(() => executeBotTurn(nextIdx), 1200);
  };

  const handlePlayerAcknowledgeSkip = () => {
    setPendingSkipPrompt(false);
    const s = stateRef.current;
    const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
    const nextIdx = (0 + s.direction + numPlayers) % numPlayers;
    s.turnIndex = nextIdx;
    setTurnIndex(nextIdx);
    setTurnMessage(`${getPlayerName(nextIdx)}'s Turn`);

    if (s.gameMode === 'TWO_PLAYER') setPassScreen(true);
    else if (nextIdx !== 0) setTimeout(() => executeBotTurn(nextIdx), 1200);
  };

  // --- PLAYER CARD CLICK ---
  const handleCardClick = (card, playerIdx) => {
    const s = stateRef.current;
    if (s.gameOver || showColorPicker || pendingPenaltyPrompt || pendingSkipPrompt) return;
    if (playerIdx !== s.turnIndex) return;

    if (!isCardPlayable(card)) {
      unoAudio.playDrawPenalty();
      flashBanner("Cannot play this card! Must match color or number.", 'warning');
      return;
    }

    setJustDrawnCard(null);

    if (card.color === 'WILD') {
      setPendingWildCard({ card, playerIdx });
      setShowColorPicker(true);
      return;
    }

    executePlayCard(card, playerIdx, card.color);
  };

  const handleColorSelect = (chosenColor) => {
    if (!pendingWildCard) return;
    const { card, playerIdx } = pendingWildCard;
    setShowColorPicker(false);
    setPendingWildCard(null);
    executePlayCard(card, playerIdx, chosenColor);
  };

  // --- DRAW DECK (Player Turn) ---
  const handlePlayerDrawDeck = () => {
    const s = stateRef.current;
    if (s.gameOver || showColorPicker || pendingPenaltyPrompt || pendingSkipPrompt) return;
    if (s.turnIndex !== 0 && s.gameMode !== 'TWO_PLAYER') return;

    if (s.activeStack > 0) {
      handlePlayerAcceptPenalty();
      return;
    }

    if (s.deck.length === 0) drawCardsForTarget(s.turnIndex, 0);
    const drawn = s.deck.pop();
    s.hands[s.turnIndex].push(drawn);
    s.calledUno[s.turnIndex] = false;

    unoAudio.playCardSlide();
    setHands(s.hands.map(h => [...h]));
    setDeckCount(s.deck.length);
    setUnoCallState({ ...s.calledUno });

    if (isCardPlayable(drawn)) {
      setJustDrawnCard(drawn);
      flashBanner(`You drew ${drawn.color} ${drawn.value}! Play it or Keep?`, 'info');
    } else {
      setJustDrawnCard(null);
      flashBanner(`You drew ${drawn.color} ${drawn.value} (Cannot play). Turn passed!`, 'info');
      const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
      const nextIdx = (s.turnIndex + s.direction + numPlayers) % numPlayers;
      s.turnIndex = nextIdx;
      setTurnIndex(nextIdx);
      setTurnMessage(`${getPlayerName(nextIdx)}'s Turn`);

      if (s.gameMode === 'TWO_PLAYER') setPassScreen(true);
      else if (nextIdx !== 0) setTimeout(() => executeBotTurn(nextIdx), 1200);
    }
  };

  const handlePlayDrawnCard = () => {
    if (!justDrawnCard) return;
    const card = justDrawnCard;
    setJustDrawnCard(null);
    handleCardClick(card, turnIndex);
  };

  const handlePassDrawnCard = () => {
    setJustDrawnCard(null);
    const s = stateRef.current;
    const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
    const nextIdx = (s.turnIndex + s.direction + numPlayers) % numPlayers;
    s.turnIndex = nextIdx;
    setTurnIndex(nextIdx);
    setTurnMessage(`${getPlayerName(nextIdx)}'s Turn`);

    if (s.gameMode === 'TWO_PLAYER') setPassScreen(true);
    else if (nextIdx !== 0) setTimeout(() => executeBotTurn(nextIdx), 1200);
  };

  // --- UNO SHOUT & CATCH ---
  const handlePlayerShoutUno = () => {
    const s = stateRef.current;
    s.calledUno[0] = true;
    unoAudio.playUnoFanfare();
    setUnoCallState({ ...s.calledUno });
    setCanCatchUno(null);
    flashBanner('🔥 YOU SHOUTED UNO! (1 Card Left)', 'uno');
  };

  const handleCatchVulnerableUno = () => {
    if (canCatchUno === null) return;
    const targetIdx = canCatchUno;
    setCanCatchUno(null);

    unoAudio.playDrawPenalty();
    drawCardsForTarget(targetIdx, 2);
    flashBanner(`🚨 CAUGHT! ${getPlayerName(targetIdx)} forgot UNO and draws 2!`, 'warning');
  };

  const botCatchUno = (targetIdx) => {
    const s = stateRef.current;
    if (s.hands[targetIdx].length === 1 && !s.calledUno[targetIdx] && !s.gameOver) {
      unoAudio.playDrawPenalty();
      drawCardsForTarget(targetIdx, 2);
      flashBanner(`🚨 Bot caught ${getPlayerName(targetIdx)} forgetting UNO! (+2 Cards)`, 'warning');
      setCanCatchUno(null);
    }
  };

  // --- STRATEGIC SMART AI BOT ENGINE ---
  const executeBotTurn = (botIdx) => {
    const s = stateRef.current;
    if (s.gameOver || s.turnIndex !== botIdx) return;

    setBotStatusText(prev => ({ ...prev, [botIdx]: 'Thinking...' }));

    setTimeout(() => {
      if (s.gameOver || s.turnIndex !== botIdx) return;

      const botHand = s.hands[botIdx];
      const playable = botHand.filter(c => isCardPlayable(c));

      const colorCounts = { RED: 0, BLUE: 0, GREEN: 0, YELLOW: 0 };
      botHand.forEach(c => { if (c.color !== 'WILD') colorCounts[c.color]++; });
      let dominantColor = 'RED';
      let maxC = -1;
      COLORS.forEach(c => {
        if (colorCounts[c] > maxC) {
          maxC = colorCounts[c];
          dominantColor = c;
        }
      });

      const numPlayers = s.gameMode === 'FOUR_PLAYER' ? 4 : 2;
      const nextPlayerIdx = (botIdx + s.direction + numPlayers) % numPlayers;
      const nextPlayerHandSize = s.hands[nextPlayerIdx].length;

      if (playable.length > 0) {
        let chosenCard = null;

        if (nextPlayerHandSize <= 2) {
          const aggressive = playable.filter(c =>
            c.value === 'WILD_DRAW4' || c.value === 'DRAW2' || c.value === 'SKIP' || c.value === 'REVERSE'
          );
          if (aggressive.length > 0) chosenCard = aggressive[0];
        }

        if (!chosenCard) {
          const actionCards = playable.filter(c => c.value === 'DRAW2' || c.value === 'SKIP' || c.value === 'REVERSE');
          if (actionCards.length > 0 && Math.random() < 0.5) chosenCard = actionCards[0];
        }

        if (!chosenCard) {
          const dominantMatches = playable.filter(c => c.color === dominantColor);
          if (dominantMatches.length > 0) chosenCard = dominantMatches[0];
        }

        if (!chosenCard) {
          const nonWilds = playable.filter(c => c.color !== 'WILD');
          chosenCard = nonWilds.length > 0 ? nonWilds[Math.floor(Math.random() * nonWilds.length)] : playable[0];
        }

        const nextCol = chosenCard.color === 'WILD' ? dominantColor : chosenCard.color;
        setBotStatusText(prev => ({ ...prev, [botIdx]: `Played ${chosenCard.color} ${chosenCard.value}` }));
        executePlayCard(chosenCard, botIdx, nextCol);
      } else {
        // Draw from deck
        setBotStatusText(prev => ({ ...prev, [botIdx]: 'Drawing...' }));

        if (s.activeStack > 0) {
          drawCardsForTarget(botIdx, s.activeStack);
          flashBanner(`${getPlayerName(botIdx)} drew ${s.activeStack} cards penalty!`, 'warning');
          s.activeStack = 0;
          const afterPenalty = (botIdx + s.direction + numPlayers) % numPlayers;
          s.turnIndex = afterPenalty;
          setTurnIndex(afterPenalty);
          setTurnMessage(`${getPlayerName(afterPenalty)}'s Turn`);

          if (afterPenalty === 0) setBotStatusText(prev => ({ ...prev, [botIdx]: null }));
          else if (s.gameMode !== 'TWO_PLAYER') setTimeout(() => executeBotTurn(afterPenalty), 1200);
          return;
        }

        if (s.deck.length === 0) drawCardsForTarget(botIdx, 0);
        const drawn = s.deck.pop();
        s.hands[botIdx].push(drawn);
        s.calledUno[botIdx] = false;

        unoAudio.playCardSlide();
        setHands(s.hands.map(h => [...h]));
        setDeckCount(s.deck.length);

        if (isCardPlayable(drawn)) {
          const nextCol = drawn.color === 'WILD' ? dominantColor : drawn.color;
          setBotStatusText(prev => ({ ...prev, [botIdx]: `Drew & Played ${drawn.color} ${drawn.value}!` }));
          setTimeout(() => executePlayCard(drawn, botIdx, nextCol), 800);
        } else {
          setBotStatusText(prev => ({ ...prev, [botIdx]: 'Drew & Passed' }));
          const nextIdx = (botIdx + s.direction + numPlayers) % numPlayers;
          s.turnIndex = nextIdx;
          setTurnIndex(nextIdx);
          setTurnMessage(`${getPlayerName(botIdx)} drew. ${getPlayerName(nextIdx)}'s Turn.`);

          if (nextIdx !== 0 && s.gameMode !== 'TWO_PLAYER') {
            setTimeout(() => executeBotTurn(nextIdx), 1200);
          }
        }
      }
    }, 1100);
  };

  const p1Cards = hands[0] || [];
  const p2Cards = hands[1] || [];
  const bot1Cards = hands[1] || [];
  const bot2Cards = hands[2] || [];
  const bot3Cards = hands[3] || [];

  const playerHasPlayable = p1Cards.some(c => isCardPlayable(c));

  return (
    <div className="uno-container glass-panel">
      {/* Top Header Controls */}
      <div className="uno-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>

        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => setGameMode('VS_AI')}
          >
            🤖 1v1 VS AI BOT
          </button>
          <button
            className={`mode-pill-btn ${gameMode === 'FOUR_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('FOUR_PLAYER')}
          >
            👥 4-PLAYER TABLE
          </button>
          <button
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER PASS & PLAY
          </button>
        </div>

        <div className="uno-rules-toggles">
          <button
            className={`rule-toggle-btn ${stackingRule ? 'active' : ''}`}
            onClick={() => setStackingRule(r => !r)}
            title="Toggle Draw Two and Wild Draw Four Stacking"
          >
            STACKING: {stackingRule ? 'ON ⚡' : 'OFF'}
          </button>
          <button className="btn-tertiary" onClick={startNewGame}>↺ RE-DEAL</button>
        </div>
      </div>

      {/* Floating Action Banner */}
      {actionBanner && (
        <div className={`uno-floating-action-banner ${actionBanner.type}`}>
          {actionBanner.text}
        </div>
      )}

      {/* Turn & Status Dashboard */}
      <div className="uno-status-bar">
        <div
          className="current-color-badge"
          style={{
            backgroundColor: COLOR_CONFIG[currentColor]?.hex || '#ff1744',
            boxShadow: `0 0 16px ${COLOR_CONFIG[currentColor]?.hex || '#ff1744'}`
          }}
        >
          COLOR: <strong>{currentColor}</strong>
        </div>

        <div className="uno-turn-text" style={{ color: turnIndex === 0 ? '#00f3ff' : '#ffd600' }}>
          <span className="direction-icon">{direction === 1 ? '↻ CLOCKWISE' : '↺ COUNTER-CLOCKWISE'}</span> &bull; {turnMessage}
        </div>

        <div className="cards-counter">
          <span>YOU: {p1Cards.length}</span> &bull;
          {gameMode === 'FOUR_PLAYER' ? (
            <span> B1: {bot1Cards.length} | B2: {bot2Cards.length} | B3: {bot3Cards.length}</span>
          ) : (
            <span> OPPONENT: {p2Cards.length}</span>
          )}
        </div>
      </div>

      {/* Interactive Arena Table */}
      <div className="uno-arena-table">
        <div className={`orbit-direction-ring ${direction === 1 ? 'clockwise' : 'counter-clockwise'}`}>
          <div className="ring-arrow arrow-1">➤</div>
          <div className="ring-arrow arrow-2">➤</div>
          <div className="ring-arrow arrow-3">➤</div>
          <div className="ring-arrow arrow-4">➤</div>
        </div>

        {/* Top Seat: Bot in 1v1 / Apex in 4P / P2 in 2P */}
        <div className={`table-seat top ${(gameMode === 'FOUR_PLAYER' ? turnIndex === 2 : turnIndex === 1) ? 'active-turn' : ''}`}>
          <div className="seat-avatar">
            <span className="seat-avatar-icon">🤖</span>
            {(botStatusText[gameMode === 'FOUR_PLAYER' ? 2 : 1]) && (
              <span className="seat-speech-bubble">{botStatusText[gameMode === 'FOUR_PLAYER' ? 2 : 1]}</span>
            )}
          </div>
          <span className="seat-label">
            {gameMode === 'VS_AI' ? 'CYBER AI BOT' : gameMode === 'TWO_PLAYER' ? 'PLAYER 2' : 'APEX BOT'} ({gameMode === 'FOUR_PLAYER' ? bot2Cards.length : p2Cards.length})
          </span>
          <div className="seat-cards-fan">
            {(gameMode === 'FOUR_PLAYER' ? bot2Cards : p2Cards).slice(0, 9).map((_, i) => (
              <div key={i} className="uno-mini-card-back" />
            ))}
          </div>
        </div>

        {/* Left Seat: Nova Bot (4P only) */}
        {gameMode === 'FOUR_PLAYER' && (
          <div className={`table-seat left ${turnIndex === 1 ? 'active-turn' : ''}`}>
            <div className="seat-avatar">
              <span className="seat-avatar-icon">🤖</span>
              {botStatusText[1] && <span className="seat-speech-bubble">{botStatusText[1]}</span>}
            </div>
            <span className="seat-label">NOVA BOT ({bot1Cards.length})</span>
            <div className="seat-cards-fan vertical">
              {bot1Cards.slice(0, 7).map((_, i) => (
                <div key={i} className="uno-mini-card-back" />
              ))}
            </div>
          </div>
        )}

        {/* Center Felt: Draw Deck, Discard Stack & Action Buttons */}
        <div className="uno-center-felt">
          {/* Draw Deck */}
          <div
            className={`uno-deck-stack ${turnIndex === 0 ? 'deck-interactive' : ''} ${turnIndex === 0 && !playerHasPlayable ? 'pulse-draw-need' : ''}`}
            onClick={handlePlayerDrawDeck}
            title={turnIndex === 0 ? 'Click to Draw Card' : 'Wait for your turn'}
          >
            <div className="uno-card deck-card">
              <div className="uno-logo-oval">UNO</div>
            </div>
            <span className="deck-tag">
              DRAW ({deckCount})
              {turnIndex === 0 && <span className="draw-hint-pill">TAP TO DRAW</span>}
            </span>
          </div>

          {/* Discard Stack */}
          {topCard && (
            <div className="uno-discard-stack">
              <div
                className="uno-card discard-card"
                style={{
                  backgroundColor: COLOR_CONFIG[topCard.color]?.hex || COLOR_CONFIG[currentColor]?.hex || '#ff1744',
                  transform: `rotate(${topCard.rotation || 0}deg)`,
                  boxShadow: `0 0 28px ${COLOR_CONFIG[currentColor]?.glow || 'rgba(255, 23, 68, 0.7)'}`
                }}
              >
                <span className="c-corner top-l">{topCard.symbol || topCard.value}</span>
                <div className="c-center-oval">
                  {topCard.symbol || topCard.value}
                </div>
                <span className="c-corner bot-r">{topCard.symbol || topCard.value}</span>
              </div>
              <span className="deck-tag">DISCARD PILE</span>
            </div>
          )}

          {/* UNO Shout Button */}
          {p1Cards.length === 1 && turnIndex === 0 && !unoCallState[0] && (
            <button className="uno-shout-banner-btn" onClick={handlePlayerShoutUno}>
              🔥 SHOUT UNO!
            </button>
          )}

          {/* Catch Bot Vulnerable UNO Button */}
          {canCatchUno !== null && canCatchUno !== 0 && (
            <button className="uno-catch-penalty-btn" onClick={handleCatchVulnerableUno}>
              🚨 CATCH {getPlayerName(canCatchUno).toUpperCase()}'S UNO! (+2)
            </button>
          )}
        </div>

        {/* Right Seat: Viper Bot (4P only) */}
        {gameMode === 'FOUR_PLAYER' && (
          <div className={`table-seat right ${turnIndex === 3 ? 'active-turn' : ''}`}>
            <div className="seat-avatar">
              <span className="seat-avatar-icon">🤖</span>
              {botStatusText[3] && <span className="seat-speech-bubble">{botStatusText[3]}</span>}
            </div>
            <span className="seat-label">VIPER BOT ({bot3Cards.length})</span>
            <div className="seat-cards-fan vertical">
              {bot3Cards.slice(0, 7).map((_, i) => (
                <div key={i} className="uno-mini-card-back" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Human Player Penalty Modal (NO AUTOMATIC SKIPPING!) */}
      {pendingPenaltyPrompt && (
        <div className="uno-interactive-prompt-overlay">
          <div className="prompt-card">
            <h3>💥 ATTACKED BY PENALTY!</h3>
            <p>You received a <strong>+{pendingPenaltyPrompt.count} Cards</strong> penalty stack!</p>
            <div className="prompt-actions">
              {pendingPenaltyPrompt.canStack && (
                <span className="prompt-note">⚡ You have a matching card to STACK! Click it in your hand below.</span>
              )}
              <button className="btn-primary" onClick={handlePlayerAcceptPenalty}>
                DRAW {pendingPenaltyPrompt.count} CARDS & PASS TURN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Player Skipped Modal */}
      {pendingSkipPrompt && (
        <div className="uno-interactive-prompt-overlay">
          <div className="prompt-card">
            <h3>🚫 YOU WERE SKIPPED!</h3>
            <p>An opponent played a Skip card. Your turn was bypassed.</p>
            <button className="btn-primary" onClick={handlePlayerAcknowledgeSkip}>
              ACKNOWLEDGE & NEXT TURN ➔
            </button>
          </div>
        </div>
      )}

      {/* Drawn Card Decision Modal */}
      {justDrawnCard && (
        <div className="drawn-card-decision-bar">
          <div className="drawn-preview-wrap">
            <span className="drawn-tag-lbl">YOU DREW:</span>
            <div
              className="uno-card drawn-mini-preview"
              style={{
                backgroundColor: COLOR_CONFIG[justDrawnCard.color]?.hex || '#e040fb',
                boxShadow: `0 0 16px ${COLOR_CONFIG[justDrawnCard.color]?.hex || '#e040fb'}`
              }}
            >
              <div className="c-center-oval mini">{justDrawnCard.symbol || justDrawnCard.value}</div>
            </div>
          </div>
          <span className="drawn-decision-text">This card is playable right now!</span>
          <div className="drawn-decision-btns">
            <button className="btn-primary play-drawn-btn" onClick={handlePlayDrawnCard}>
              ⚡ PLAY IT NOW
            </button>
            <button className="btn-secondary keep-drawn-btn" onClick={handlePassDrawnCard}>
              KEEP & PASS →
            </button>
          </div>
        </div>
      )}

      {/* Wild Color Selection Wheel */}
      {showColorPicker && (
        <div className="wild-wheel-overlay">
          <h3 className="neon-text">SELECT NEW COLOR</h3>
          <p className="wheel-subtext">Choose the color for the next player to follow</p>
          <div className="wild-wheel-grid">
            {COLORS.map(c => (
              <button
                key={c}
                className="color-quad-btn"
                style={{
                  backgroundColor: COLOR_CONFIG[c].hex,
                  boxShadow: `0 0 18px ${COLOR_CONFIG[c].hex}`
                }}
                onClick={() => handleColorSelect(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pass Device Privacy Screen (2P local) */}
      {passScreen && (
        <div className="pass-shield-overlay">
          <h2 className="neon-text" style={{ color: '#00f3ff' }}>
            PASS DEVICE TO {turnIndex === 0 ? 'PLAYER 1' : 'PLAYER 2'}
          </h2>
          <p style={{ color: '#ccc', margin: '15px 0' }}>Keep your hand private from opponent!</p>
          <button className="btn-primary" onClick={() => setPassScreen(false)}>
            I AM READY →
          </button>
        </div>
      )}

      {/* Player Hand Fan Area */}
      <div className="player-hand-section">
        <div className="hand-header-bar">
          <span className="hand-owner-lbl">
            {turnIndex === 0 ? '👉 YOUR CARDS' : gameMode === 'TWO_PLAYER' ? 'PLAYER 2 CARDS' : 'YOUR CARDS'} ({p1Cards.length} Cards)
          </span>
          {turnIndex === 0 && (
            <span className="turn-indicator-tag active">YOUR ACTIVE TURN</span>
          )}
        </div>

        <div className="player-cards-fan">
          {(turnIndex === 0 || gameMode !== 'TWO_PLAYER' ? p1Cards : p2Cards).map((card, idx, arr) => {
            const playable = isCardPlayable(card) && (turnIndex === 0 || gameMode === 'TWO_PLAYER');
            const mid = (arr.length - 1) / 2;
            const rot = (idx - mid) * 3.2;
            const yOffset = Math.abs(idx - mid) * 4;

            return (
              <div
                key={card.id}
                className={`uno-card hand-card ${playable ? 'playable' : 'disabled'}`}
                style={{
                  backgroundColor: COLOR_CONFIG[card.color]?.hex || '#e040fb',
                  transform: `rotate(${rot}deg) translateY(${yOffset}px)`,
                  boxShadow: playable ? `0 0 20px ${COLOR_CONFIG[card.color]?.hex || '#e040fb'}` : 'none'
                }}
                onClick={() => handleCardClick(card, turnIndex === 0 ? 0 : 1)}
                title={playable ? `Play ${card.color} ${card.value}` : `Cannot play (must match ${currentColor} or ${topCard?.value})`}
              >
                <span className="c-corner top-l">{card.symbol || card.value}</span>
                <div className="c-center-oval">
                  {card.symbol || card.value}
                </div>
                <span className="c-corner bot-r">{card.symbol || card.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="uno-hint">
        {turnIndex === 0 ? (
          playerHasPlayable ? (
            <strong style={{ color: '#00ff66' }}>👉 YOUR TURN: Tap any glowing card to play it!</strong>
          ) : (
            <strong style={{ color: '#ffd600' }}>👉 NO MATCHING CARDS: Tap the DRAW PILE in the center!</strong>
          )
        ) : (
          <span>Waiting for opponent... Watch the table and plan your move!</span>
        )}
      </p>

      {/* Game Over Celebration Modal */}
      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'YOU (P1)' || winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} WON THE UNO MATCH!
          </h2>
          <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnoGame;
