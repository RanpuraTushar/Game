import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './AchievementsModal.css';

const AchievementsModal = ({ user, onClose }) => {
  const [achievements, setAchievements] = useState([]);
  const [unlockedKeys, setUnlockedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAchievements = async () => {
      setLoading(true);
      const allRes = await api.getAchievements();
      const userRes = await api.getUserAchievements(user?.id || 1);

      if (isMounted) {
        setAchievements(allRes.achievements || []);
        const unlocked = new Set((userRes.unlocked || []).map(a => a.key));
        setUnlockedKeys(unlocked);
        setLoading(false);
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
          {loading ? (
            <div className="leaderboard-loading">LOADING TROPHY VAULT...</div>
          ) : (
            <div className="achievements-grid">
              {achievements.map((ach) => {
                const isUnlocked = unlockedKeys.has(ach.key);
                return (
                  <div key={ach.key} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon-box">
                      {isUnlocked ? ach.icon : '🔒'}
                    </div>
                    <div className="ach-info">
                      <div className="ach-title-row">
                        <span className="ach-title">{ach.title}</span>
                        <span className="ach-points">+{ach.points} pts</span>
                      </div>
                      <p className="ach-desc">{ach.desc}</p>
                      <span className="ach-game-tag">{ach.gameKey.replace(/_/g, ' ')}</span>
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
