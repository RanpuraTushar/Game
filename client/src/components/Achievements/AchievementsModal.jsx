import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ACHIEVEMENTS_DATA } from '../../../../shared/gameMetadata.js';
import './AchievementsModal.css';

const AchievementsModal = ({ user, onClose }) => {
  const [achievements, setAchievements] = useState(ACHIEVEMENTS_DATA || []);
  const [unlockedKeys, setUnlockedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAchievements = async () => {
      setLoading(true);
      try {
        const [allRes, userRes] = await Promise.all([
          api.getAchievements().catch(() => ({ achievements: ACHIEVEMENTS_DATA })),
          api.getUserAchievements(user?.id || 1).catch(() => ({ unlocked: [] }))
        ]);

        if (isMounted) {
          const list = (allRes?.achievements && allRes.achievements.length > 0)
            ? allRes.achievements
            : ACHIEVEMENTS_DATA;
          setAchievements(list);

          const unlockedArray = userRes?.unlocked || [];
          const unlockedKeyList = userRes?.unlockedKeys || [];
          const unlockedSet = new Set([
            ...unlockedArray.map(a => (typeof a === 'string' ? a : a?.key)).filter(Boolean),
            ...unlockedKeyList
          ]);
          setUnlockedKeys(unlockedSet);
        }
      } catch (err) {
        console.error('Error loading achievements modal data:', err);
        if (isMounted) {
          setAchievements(ACHIEVEMENTS_DATA);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAchievements();
    return () => { isMounted = false; };
  }, [user]);

  const totalPoints = achievements
    .filter(a => unlockedKeys.has(a.key))
    .reduce((sum, a) => sum + (a.points || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="neon-text" style={{ color: '#ffd600' }}>ARCADE ACHIEVEMENTS</h2>
            <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>
              Unlocked: <span style={{ color: '#00ff66', fontWeight: 'bold' }}>{unlockedKeys.size}</span> / {achievements.length} 
              &nbsp;|&nbsp; Points: <span style={{ color: '#ffd600', fontWeight: 'bold' }}>{totalPoints} pts</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="achievements-grid-container">
          {loading && achievements.length === 0 ? (
            <div className="leaderboard-loading">LOADING TROPHY VAULT...</div>
          ) : (
            <div className="achievements-grid">
              {achievements.map((ach) => {
                const isUnlocked = unlockedKeys.has(ach.key);
                const desc = ach.description || ach.desc || 'Complete this challenge in the arcade arena!';
                const gameTag = (ach.gameKey || ach.key?.split('_')[0] || 'ARCADE').replace(/_/g, ' ');

                return (
                  <div key={ach.key} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon-box">
                      {isUnlocked ? (ach.icon || '🏆') : '🔒'}
                    </div>
                    <div className="ach-info">
                      <div className="ach-title-row">
                        <span className="ach-title">{ach.title}</span>
                        <span className="ach-points">+{ach.points || 100} pts</span>
                      </div>
                      <p className="ach-desc">{desc}</p>
                      <span className="ach-game-tag">{gameTag}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
