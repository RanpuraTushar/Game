import React, { useState } from 'react';
import { 
  COSMETICS_CATALOG, 
  getUserEconomy, 
  buyCosmeticItem, 
  equipCosmeticItem, 
  claimDailyBonus,
  canClaimDailyBonus
} from '../../utils/portalEconomy';
import { soundEffects } from '../../utils/SoundEffects';
import './CyberShopModal.css';

const CyberShopModal = ({ user, onClose, onEconomyUpdate }) => {
  const [activeTab, setActiveTab] = useState('frames'); // 'frames' | 'titles'
  const [economy, setEconomy] = useState(() => getUserEconomy(user?.id));
  const [message, setMessage] = useState({ text: '', type: '' });

  const isDailyAvailable = canClaimDailyBonus(user?.id);

  const showFeedback = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleClaimDaily = () => {
    const res = claimDailyBonus(user?.id);
    if (res.success) {
      soundEffects.playTrophy();
      setEconomy({ ...res.current });
      if (onEconomyUpdate) onEconomyUpdate(res.current);
      showFeedback(`🎉 Claimed +${res.bonusCoins} Coins & +${res.bonusXP} XP!`, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleBuy = (itemId) => {
    const res = buyCosmeticItem(itemId, user?.id);
    if (res.success) {
      soundEffects.playStar();
      setEconomy({ ...res.current });
      if (onEconomyUpdate) onEconomyUpdate(res.current);
      showFeedback(`✓ Purchased & unlocked "${res.item.name}"!`, 'success');
    } else {
      soundEffects.playClick();
      showFeedback(res.message, 'error');
    }
  };

  const handleEquip = (itemId) => {
    soundEffects.playClick();
    const res = equipCosmeticItem(itemId, user?.id);
    if (res.success) {
      setEconomy({ ...res.current });
      if (onEconomyUpdate) onEconomyUpdate(res.current);
      showFeedback(`✓ Item equipped!`, 'success');
    }
  };

  const activeTitleObj = COSMETICS_CATALOG.titles.find(t => t.id === economy.equippedTitle);
  const activeFrameObj = COSMETICS_CATALOG.frames.find(f => f.id === economy.equippedFrame);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card cyber-shop-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Shop Header */}
        <div className="shop-header">
          <div className="shop-brand">
            <span className="shop-icon">🪙</span>
            <div>
              <h2 className="neon-cyan-text">CYBER VAULT & STORE</h2>
              <span className="shop-subtitle">Unlock custom avatar frames & prestige badges</span>
            </div>
          </div>

          <div className="shop-balance-pill">
            <span className="coin-glow-icon">🪙</span>
            <span className="coin-amount">{economy.coins.toLocaleString()}</span>
            <span className="coin-label">COINS</span>
          </div>

          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Daily Reward Banner */}
        <div className="daily-reward-strip">
          <div className="daily-reward-left">
            <span className="gift-icon">🎁</span>
            <div>
              <span className="daily-title">DAILY PILOT SALARY</span>
              <span className="daily-desc">
                {isDailyAvailable 
                  ? 'Your daily supply crate is ready to claim (+150 🪙 & +75 ⭐)'
                  : '✓ You claimed today\'s supply crate! Resets at midnight.'}
              </span>
            </div>
          </div>
          <button 
            className={`btn-claim-daily ${!isDailyAvailable ? 'claimed' : ''}`}
            onClick={handleClaimDaily}
            disabled={!isDailyAvailable}
          >
            {isDailyAvailable ? 'CLAIM REWARD (+150 🪙)' : 'CLAIMED TODAY ✓'}
          </button>
        </div>

        {/* Feedback Message */}
        {message.text && (
          <div className={`shop-msg-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Live Avatar Preview Stage */}
        <div className="live-avatar-preview-stage">
          <div className="preview-label">LIVE PROFILE PREVIEW</div>
          <div className="preview-character-box">
            <div 
              className={`preview-avatar-halo ${activeFrameObj?.cssClass || ''}`}
              style={{ borderColor: activeFrameObj?.color || 'transparent' }}
            >
              <span className="preview-avatar-icon">{user?.avatar || '👤'}</span>
            </div>

            <div className="preview-meta-col">
              <div className="preview-name-row">
                <span className="preview-username">{user?.username || 'Pilot'}</span>
                {activeTitleObj && (
                  <span 
                    className="preview-title-badge" 
                    style={{ borderColor: activeTitleObj.badgeColor, color: activeTitleObj.badgeColor }}
                  >
                    {activeTitleObj.icon} {activeTitleObj.name}
                  </span>
                )}
              </div>
              <span className="preview-rank-tag">LEVEL {economy.level} PILOT • {economy.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Shop Navigation Tabs */}
        <div className="shop-category-tabs">
          <button 
            className={`shop-tab-btn ${activeTab === 'frames' ? 'active' : ''}`}
            onClick={() => { soundEffects.playClick(); setActiveTab('frames'); }}
          >
            🖼️ AVATAR FRAMES ({COSMETICS_CATALOG.frames.length})
          </button>
          <button 
            className={`shop-tab-btn ${activeTab === 'titles' ? 'active' : ''}`}
            onClick={() => { soundEffects.playClick(); setActiveTab('titles'); }}
          >
            👑 PRESTIGE TITLES ({COSMETICS_CATALOG.titles.length})
          </button>
        </div>

        {/* Items Grid */}
        <div className="shop-items-grid">
          {activeTab === 'frames' && COSMETICS_CATALOG.frames.map((item) => {
            const isOwned = economy.inventory?.includes(item.id);
            const isEquipped = economy.equippedFrame === item.id;
            const canAfford = economy.coins >= item.price;

            return (
              <div key={item.id} className={`shop-item-card ${isEquipped ? 'item-is-equipped' : ''}`}>
                <div className="item-visual-demo">
                  <div 
                    className={`demo-avatar-frame ${item.cssClass}`}
                    style={{ borderColor: item.color }}
                  >
                    <span className="demo-avatar-icon">{user?.avatar || '👤'}</span>
                  </div>
                </div>

                <div className="item-info">
                  <h4 className="item-name" style={{ color: item.color }}>{item.name}</h4>
                  <p className="item-desc">{item.description}</p>
                </div>

                <div className="item-action-footer">
                  {isOwned ? (
                    <button 
                      className={`btn-item-action ${isEquipped ? 'btn-equipped' : 'btn-equip'}`}
                      onClick={() => handleEquip(item.id)}
                    >
                      {isEquipped ? 'EQUIPPED ✓' : 'EQUIP'}
                    </button>
                  ) : (
                    <button 
                      className="btn-item-action btn-buy"
                      onClick={() => handleBuy(item.id)}
                      disabled={!canAfford}
                    >
                      <span>🪙 {item.price}</span>
                      <span>BUY</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {activeTab === 'titles' && COSMETICS_CATALOG.titles.map((item) => {
            const isOwned = economy.inventory?.includes(item.id);
            const isEquipped = economy.equippedTitle === item.id;
            const canAfford = economy.coins >= item.price;

            return (
              <div key={item.id} className={`shop-item-card ${isEquipped ? 'item-is-equipped' : ''}`}>
                <div className="item-visual-demo title-demo">
                  <span 
                    className="demo-title-pill" 
                    style={{ borderColor: item.badgeColor, color: item.badgeColor }}
                  >
                    {item.icon} {item.name}
                  </span>
                </div>

                <div className="item-info">
                  <h4 className="item-name" style={{ color: item.badgeColor }}>{item.name}</h4>
                  <p className="item-desc">{item.description}</p>
                </div>

                <div className="item-action-footer">
                  {isOwned ? (
                    <button 
                      className={`btn-item-action ${isEquipped ? 'btn-equipped' : 'btn-equip'}`}
                      onClick={() => handleEquip(item.id)}
                    >
                      {isEquipped ? 'EQUIPPED ✓' : 'EQUIP'}
                    </button>
                  ) : (
                    <button 
                      className="btn-item-action btn-buy"
                      onClick={() => handleBuy(item.id)}
                      disabled={!canAfford}
                    >
                      <span>🪙 {item.price}</span>
                      <span>BUY</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CyberShopModal;
