import React, { useState, useEffect, useRef } from 'react';
import { soundEffects } from '../../utils/SoundEffects';
import './EmoteWheel.css';

const EMOTES_LIST = [
  { id: 'fire', icon: '🔥', label: 'FIRE!', color: '#ff3b30' },
  { id: 'gg', icon: '🤝', label: 'GG!', color: '#00f3ff' },
  { id: 'skull', icon: '💀', label: 'RIP!', color: '#a0aec0' },
  { id: 'brain', icon: '🧠', label: '200 IQ!', color: '#e040fb' },
  { id: 'shock', icon: '😱', label: 'NO WAY!', color: '#ffd600' },
  { id: 'hyped', icon: '⚡', label: 'HYPED!', color: '#00ff66' }
];

export default function EmoteWheel({ onSendEmote }) {
  const [isOpen, setIsOpen] = useState(false);
  const [floatingEmotes, setFloatingEmotes] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerEmote = (emote) => {
    soundEffects.playStar();
    const id = Date.now() + Math.random();
    const newEmote = {
      id,
      icon: emote.icon,
      label: emote.label,
      color: emote.color,
      left: Math.floor(20 + Math.random() * 60) // 20% to 80%
    };

    setFloatingEmotes((prev) => [...prev, newEmote]);
    setIsOpen(false);

    if (onSendEmote) {
      onSendEmote(emote);
    }

    setTimeout(() => {
      setFloatingEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 2400);
  };

  return (
    <div className="emote-wheel-container" ref={containerRef}>
      {/* Trigger Button in Toolbar */}
      <button
        type="button"
        className={`btn-theater-action ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Send In-Game Cyber Emote Reaction"
      >
        <span>💬</span>
        <span>EMOTES</span>
      </button>

      {/* Popover Wheel Menu */}
      {isOpen && (
        <div className="emote-wheel-popover glass-panel">
          <div className="emote-wheel-header">
            <span>REACTION WHEEL</span>
          </div>
          <div className="emote-buttons-grid">
            {EMOTES_LIST.map((em) => (
              <button
                key={em.id}
                type="button"
                className="emote-pill-btn"
                style={{ '--emote-color': em.color }}
                onClick={() => triggerEmote(em)}
              >
                <span className="emote-ico">{em.icon}</span>
                <span className="emote-txt">{em.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Reactions Overlay (Portal-like Screen Bubble) */}
      {floatingEmotes.length > 0 && (
        <div className="floating-emotes-canvas">
          {floatingEmotes.map((em) => (
            <div
              key={em.id}
              className="floating-emote-bubble"
              style={{ left: `${em.left}%`, '--bubble-color': em.color }}
            >
              <span className="bubble-icon">{em.icon}</span>
              <span className="bubble-label">{em.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
