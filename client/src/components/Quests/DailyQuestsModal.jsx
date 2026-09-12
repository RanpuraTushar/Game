import React, { useState } from 'react';
import { getDailyQuests, claimQuestReward, getUserEconomy } from '../../utils/portalEconomy';
import { soundEffects } from '../../utils/SoundEffects';
import './DailyQuestsModal.css';

const DailyQuestsModal = ({ user, onClose, onEconomyUpdate }) => {
  const [quests, setQuests] = useState(() => getDailyQuests(user?.id));
  const [economy, setEconomy] = useState(() => getUserEconomy(user?.id));
  const [claimedNotice, setClaimedNotice] = useState('');

  const completedCount = quests.filter(q => q.completed).length;

  const handleClaim = (questId) => {
    const res = claimQuestReward(questId, user?.id);
    if (res.success) {
      soundEffects.playTrophy();
      const updatedQuests = getDailyQuests(user?.id);
      const updatedEcon = getUserEconomy(user?.id);
      setQuests(updatedQuests);
      setEconomy(updatedEcon);
      if (onEconomyUpdate) onEconomyUpdate(updatedEcon);

      setClaimedNotice(`🎉 Claimed +${res.rewardCoins} 🪙 & +${res.rewardXP} XP!`);
      setTimeout(() => setClaimedNotice(''), 3000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card daily-quests-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="quests-header">
          <div className="quests-brand">
            <span className="quests-badge-icon">🎯</span>
            <div>
              <h2 className="neon-text" style={{ color: '#00f3ff', margin: 0 }}>
                DAILY MISSIONS & BOUNTIES
              </h2>
              <span className="quests-subtitle">
                Complete daily operations to earn Neon Coins & Level XP
              </span>
            </div>
          </div>

          <div className="quests-overview-pill">
            <span className="overview-count">{completedCount} / {quests.length}</span>
            <span className="overview-label">COMPLETED</span>
          </div>

          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Claim notice banner */}
        {claimedNotice && (
          <div className="quests-claimed-banner">
            {claimedNotice}
          </div>
        )}

        {/* Daily Mission Progress bar */}
        <div className="quests-overall-bar-wrap">
          <div className="quests-overall-meta">
            <span>OPERATIONAL READINESS</span>
            <span>{Math.round((completedCount / quests.length) * 100)}%</span>
          </div>
          <div className="quests-progress-track">
            <div 
              className="quests-progress-fill" 
              style={{ width: `${(completedCount / quests.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Quests List */}
        <div className="quests-list">
          {quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

            return (
              <div 
                key={quest.id} 
                className={`quest-item-card ${quest.completed ? 'quest-done' : ''} ${quest.claimed ? 'quest-claimed' : ''}`}
              >
                <div className="quest-icon-col">
                  <span className="quest-icon">{quest.icon || '🎯'}</span>
                </div>

                <div className="quest-info-col">
                  <div className="quest-title-row">
                    <h4 className="quest-title">{quest.title}</h4>
                    <span className="quest-step-fraction">
                      {quest.progress} / {quest.target}
                    </span>
                  </div>
                  <p className="quest-desc">{quest.description}</p>

                  <div className="quest-item-track">
                    <div className="quest-item-fill" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="quest-rewards-row">
                    <span className="reward-tag coin-reward">🪙 +{quest.rewardCoins} Coins</span>
                    <span className="reward-tag xp-reward">⭐ +{quest.rewardXP} XP</span>
                  </div>
                </div>

                <div className="quest-action-col">
                  {quest.claimed ? (
                    <button className="btn-quest-status claimed" disabled>
                      ✓ CLAIMED
                    </button>
                  ) : quest.completed ? (
                    <button 
                      className="btn-quest-status claimable" 
                      onClick={() => handleClaim(quest.id)}
                    >
                      CLAIM REWARD
                    </button>
                  ) : (
                    <button className="btn-quest-status in-progress" disabled>
                      {percent}% DONE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="quests-footer">
          <span className="reset-hint">⏱️ Missions refresh automatically every day at 00:00 Midnight.</span>
        </div>
      </div>
    </div>
  );
};

export default DailyQuestsModal;
