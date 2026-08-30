// pianoAudio.js - High-Fidelity Polyphonic Grand Piano & Synthesizer Engine

// Standard Piano Note Frequencies (C3 to C6)
export const PIANO_KEYS_DATA = [
  // Octave 3
  { note: 'C3', freq: 130.81, type: 'white', key: 'q', label: 'Q' },
  { note: 'C#3', freq: 138.59, type: 'black', key: '2', label: '2' },
  { note: 'D3', freq: 146.83, type: 'white', key: 'w', label: 'W' },
  { note: 'D#3', freq: 155.56, type: 'black', key: '3', label: '3' },
  { note: 'E3', freq: 164.81, type: 'white', key: 'e', label: 'E' },
  { note: 'F3', freq: 174.61, type: 'white', key: 'r', label: 'R' },
  { note: 'F#3', freq: 185.00, type: 'black', key: '5', label: '5' },
  { note: 'G3', freq: 196.00, type: 'white', key: 't', label: 'T' },
  { note: 'G#3', freq: 207.65, type: 'black', key: '6', label: '6' },
  { note: 'A3', freq: 220.00, type: 'white', key: 'y', label: 'Y' },
  { note: 'A#3', freq: 233.08, type: 'black', key: '7', label: '7' },
  { note: 'B3', freq: 246.94, type: 'white', key: 'u', label: 'U' },

  // Octave 4 (Middle Octave)
  { note: 'C4', freq: 261.63, type: 'white', key: 'z', label: 'Z' },
  { note: 'C#4', freq: 277.18, type: 'black', key: 's', label: 'S' },
  { note: 'D4', freq: 293.66, type: 'white', key: 'x', label: 'X' },
  { note: 'D#4', freq: 311.13, type: 'black', key: 'd', label: 'D' },
  { note: 'E4', freq: 329.63, type: 'white', key: 'c', label: 'C' },
  { note: 'F4', freq: 349.23, type: 'white', key: 'v', label: 'V' },
  { note: 'F#4', freq: 369.99, type: 'black', key: 'g', label: 'G' },
  { note: 'G4', freq: 392.00, type: 'white', key: 'b', label: 'B' },
  { note: 'G#4', freq: 415.30, type: 'black', key: 'h', label: 'H' },
  { note: 'A4', freq: 440.00, type: 'white', key: 'n', label: 'N' },
  { note: 'A#4', freq: 466.16, type: 'black', key: 'j', label: 'J' },
  { note: 'B4', freq: 493.88, type: 'white', key: 'm', label: 'M' },

  // Octave 5
  { note: 'C5', freq: 523.25, type: 'white', key: 'i', label: 'I' },
  { note: 'C#5', freq: 554.37, type: 'black', key: '9', label: '9' },
  { note: 'D5', freq: 587.33, type: 'white', key: 'o', label: 'O' },
  { note: 'D#5', freq: 622.25, type: 'black', key: '0', label: '0' },
  { note: 'E5', freq: 659.25, type: 'white', key: 'p', label: 'P' },
  { note: 'F5', freq: 698.46, type: 'white', key: '[', label: '[' },
  { note: 'F#5', freq: 739.99, type: 'black', key: '=', label: '=' },
  { note: 'G5', freq: 783.99, type: 'white', key: ']', label: ']' }
];

// Classic Songs Library for Tutorial & Auto-Play
export const SONG_LIBRARY = [
  {
    id: 'FUR_ELISE',
    title: 'Für Elise (Beethoven)',
    difficulty: 'Intermediate',
    icon: '🎼',
    notes: [
      { note: 'E5', duration: 250 }, { note: 'D#5', duration: 250 },
      { note: 'E5', duration: 250 }, { note: 'D#5', duration: 250 },
      { note: 'E5', duration: 250 }, { note: 'B4', duration: 250 },
      { note: 'D5', duration: 250 }, { note: 'C5', duration: 250 },
      { note: 'A4', duration: 500 }, { note: 'C4', duration: 250 },
      { note: 'E4', duration: 250 }, { note: 'A4', duration: 250 },
      { note: 'B4', duration: 500 }, { note: 'E4', duration: 250 },
      { note: 'G#4', duration: 250 }, { note: 'B4', duration: 250 },
      { note: 'C5', duration: 500 }, { note: 'E4', duration: 250 },
      { note: 'E5', duration: 250 }, { note: 'D#5', duration: 250 },
      { note: 'E5', duration: 250 }, { note: 'D#5', duration: 250 },
      { note: 'E5', duration: 250 }, { note: 'B4', duration: 250 },
      { note: 'D5', duration: 250 }, { note: 'C5', duration: 250 },
      { note: 'A4', duration: 600 }
    ]
  },
  {
    id: 'CANON_IN_D',
    title: 'Canon in D (Pachelbel)',
    difficulty: 'Easy',
    icon: '🎻',
    notes: [
      { note: 'F#4', duration: 350 }, { note: 'E4', duration: 350 },
      { note: 'D4', duration: 350 }, { note: 'C#4', duration: 350 },
      { note: 'B3', duration: 350 }, { note: 'A3', duration: 350 },
      { note: 'B3', duration: 350 }, { note: 'C#4', duration: 350 },
      { note: 'D4', duration: 350 }, { note: 'F#4', duration: 350 },
      { note: 'A4', duration: 350 }, { note: 'G4', duration: 350 },
      { note: 'F#4', duration: 350 }, { note: 'D4', duration: 350 },
      { note: 'E4', duration: 350 }, { note: 'F#4', duration: 600 }
    ]
  },
  {
    id: 'INTERSTELLAR',
    title: 'Interstellar Theme (Hans Zimmer)',
    difficulty: 'Advanced',
    icon: '🌌',
    notes: [
      { note: 'A4', duration: 300 }, { note: 'B4', duration: 300 },
      { note: 'C5', duration: 300 }, { note: 'B4', duration: 300 },
      { note: 'A4', duration: 300 }, { note: 'B4', duration: 300 },
      { note: 'C5', duration: 300 }, { note: 'B4', duration: 300 },
      { note: 'E5', duration: 450 }, { note: 'D5', duration: 450 },
      { note: 'C5', duration: 450 }, { note: 'B4', duration: 450 },
      { note: 'A4', duration: 600 }
    ]
  },
  {
    id: 'TWINKLE',
    title: 'Twinkle Twinkle Little Star',
    difficulty: 'Beginner',
    icon: '⭐',
    notes: [
      { note: 'C4', duration: 300 }, { note: 'C4', duration: 300 },
      { note: 'G4', duration: 300 }, { note: 'G4', duration: 300 },
      { note: 'A4', duration: 300 }, { note: 'A4', duration: 300 },
      { note: 'G4', duration: 600 },
      { note: 'F4', duration: 300 }, { note: 'F4', duration: 300 },
      { note: 'E4', duration: 300 }, { note: 'E4', duration: 300 },
      { note: 'D4', duration: 300 }, { note: 'D4', duration: 300 },
      { note: 'C4', duration: 600 }
    ]
  }
];

class PianoAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sustainPedal = true;
    this.currentInstrument = 'GRAND_PIANO'; // GRAND_PIANO, ELECTRIC, SYNTH
    this.activeNodes = new Map();
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setInstrument(inst) {
    this.currentInstrument = inst;
  }

  setSustain(sustain) {
    this.sustainPedal = sustain;
  }

  playNote(noteName, durationOverride = null) {
    this.init();
    if (!this.ctx) return;

    const keyData = PIANO_KEYS_DATA.find(k => k.note === noteName);
    if (!keyData) return;

    const freq = keyData.freq;
    const now = this.ctx.currentTime;
    const decayTime = this.sustainPedal ? 2.2 : 0.8;

    if (this.currentInstrument === 'GRAND_PIANO') {
      this.synthesizeGrandPiano(freq, now, decayTime);
    } else if (this.currentInstrument === 'ELECTRIC') {
      this.synthesizeElectricPiano(freq, now, decayTime);
    } else {
      this.synthesizeCyberSynth(freq, now, decayTime);
    }
  }

  // Realistic Acoustic Grand Piano Synthesis (Multi-Harmonics + Hammer Strike)
  synthesizeGrandPiano(freq, now, decayTime) {
    const harmonics = [
      { ratio: 1.0, gain: 0.8 },
      { ratio: 2.0, gain: 0.35 },
      { ratio: 3.0, gain: 0.18 },
      { ratio: 4.0, gain: 0.08 },
      { ratio: 5.0, gain: 0.04 }
    ];

    harmonics.forEach(({ ratio, gain: hGain }) => {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = ratio === 1.0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * ratio, now);

      // Natural acoustic piano attack & exponential decay curve
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(hGain * 0.45, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (decayTime / ratio));

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + decayTime);
    });
  }

  // Electric Rhodes / Bell Chime Piano
  synthesizeElectricPiano(freq, now, decayTime) {
    const osc = this.ctx.createOscillator();
    const modOsc = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    modOsc.type = 'sine';
    modOsc.frequency.setValueAtTime(freq * 2, now);
    modGain.gain.setValueAtTime(120, now);
    modGain.gain.exponentialRampToValueAtTime(1, now + 0.5);

    modOsc.connect(osc.frequency);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    osc.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    modOsc.start(now);
    osc.stop(now + decayTime);
    modOsc.stop(now + decayTime);
  }

  // Cyber Synth Lead
  synthesizeCyberSynth(freq, now, decayTime) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, now);
    filter.frequency.exponentialRampToValueAtTime(freq, now + 0.4);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime * 0.8);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + decayTime);
  }
}

export const PianoAudio = new PianoAudioEngine();
