import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Award, Zap, Gift, Trophy, Star, Users, Calendar, ShoppingBag, 
  Share2, Copy, Check, MessageSquare, ArrowRight, ArrowLeft, RefreshCw, Info, Lock
} from 'lucide-react';
import Toast from '../components/Toast';
import { rewardsService, shippingSettingsService } from '../services/firestoreService';
import './Rewards.css';

// ─── DATA DEFINITIONS ─────────────────────────────────────────
const MEMBERSHIP_LEVELS = [
  { id: 'bronze', name: 'Bronze', threshold: '0 Pts', benefits: ['Free Account', 'Birthday Coupon', 'Earn 1 Pt per ₹100'], color: '#CD7F32' },
  { id: 'silver', name: 'Silver', threshold: '1,000 Pts', benefits: ['Early Sale Access', 'Free Shipping', 'Earn 2 Pts per ₹100'], color: '#C0C0C0' },
  { id: 'gold', name: 'Gold', threshold: '2,500 Pts', benefits: ['Exclusive Collections', 'Priority Support', 'Birthday Gift', 'Earn 3 Pts per ₹100'], color: '#D9FF00', current: true },
  { id: 'platinum', name: 'Platinum', threshold: '5,000 Pts', benefits: ['VIP Access', 'Limited Edition Drops', 'Free Express Shipping', 'Personal Assistant', 'Earn 5 Pts per ₹100'], color: '#E5E4E2' },
];

const WAYS_TO_EARN = [
  { title: 'Purchase Products', points: '+1.5x Points', desc: 'Earn on every purchase.', icon: ShoppingBag },
  { title: 'Write Reviews', points: '+150 Points', desc: 'Help others pick styles.', icon: MessageSquare },
  { title: 'Upload Photos', points: '+250 Points', desc: 'Show off your fits.', icon: Star },
  { title: 'Refer Friends', points: '+500 Points', desc: 'Gift points, get points.', icon: Users },
  { title: 'Birthday Reward', points: '+500 Points', desc: 'Celebrated once a year.', icon: Calendar },
  { title: 'Follow on Instagram', points: '+100 Points', desc: 'Join the community.', icon: Zap },
  { title: 'Complete Profile', points: '+200 Points', desc: 'Let us know you.', icon: Trophy },
  { title: 'Special Events', points: '+300 Points', desc: 'Participate in store drops.', icon: Gift },
];

const REDEEM_OPTIONS = [
  { id: 'r1', title: '₹100 Coupon', points: 1000, desc: 'Flat discount on any order', available: true },
  { id: 'r2', title: '₹250 Coupon', points: 2200, desc: 'Flat discount on any order', available: true },
  { id: 'r3', title: '₹500 Coupon', points: 4000, desc: 'Flat discount on any order', available: true },
  { id: 'r4', title: '₹1000 Coupon', points: 7500, desc: 'Flat discount on any order', available: true },
  { id: 'r5', title: 'Free Express Shipping', points: 800, desc: 'Free express shipping on your next order', available: true },
  { id: 'r6', title: 'Retro Oversized Hoodie', points: 12000, desc: 'Exclusive member merchandise', available: true },
  { id: 'r7', title: 'Vintage Logo T-Shirt', points: 8000, desc: 'Limited edition graphic tee', available: false },
];

const REWARD_HISTORY = [
  { date: '08 July 2026', points: '+150', reason: 'Review Reward (Essential Summer Shirt)', status: 'Credited' },
  { date: '04 July 2026', points: '+390', reason: 'Purchase Reward (Order #RS-998842)', status: 'Credited' },
  { date: '01 July 2026', points: '-500', reason: 'Redeemed ₹50 Coupon', status: 'Debited' },
  { date: '18 June 2026', points: '+500', reason: 'Referral Bonus (Joined: Priya Nair)', status: 'Credited' },
  { date: '10 June 2026', points: '+500', reason: 'Birthday Bonus Points', status: 'Credited' },
];

const EXCLUSIVE_OFFERS = [
  { title: 'Gold Tier Early Sale Access', label: 'GOLD MEMBER ONLY', desc: 'Get 24h early access to the upcoming Summer drop.', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400' },
  { title: 'Limited Edition Chrome Sneakers', label: 'PLATINUM & GOLD ONLY', desc: 'Only 50 units worldwide. Release on 15th July.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
];

const BADGES = [
  { title: 'First Purchase', desc: 'Completed your first order.', icon: '🥇', earned: true },
  { title: 'Style Explorer', desc: 'Completed 10 orders.', icon: '🛒', earned: false },
  { title: 'Top Reviewer', desc: 'Wrote 5 helpful product reviews.', icon: '⭐', earned: true },
  { title: 'VIP Customer', desc: 'Reached Gold Membership tier.', icon: '👑', earned: true },
  { title: 'Festival Shopper', desc: 'Purchased during Diwali Special drop.', icon: '🔥', earned: false },
  { title: 'Platinum Elite', desc: 'Reached Platinum Membership tier.', icon: '💎', earned: false },
];

const MISSIONS = [
  { title: 'Buy 3 Products', target: '3 Products', progress: 2, max: 3, points: '+300 Points', done: false },
  { title: 'Spend ₹5000 Total', target: '₹5000 Spend', progress: 4100, max: 5000, points: '+500 Points', done: false },
  { title: 'Refer 2 Friends', target: '2 Referrals', progress: 2, max: 2, points: '+700 Points', done: true },
  { title: 'Write 5 Reviews', target: '5 Reviews', progress: 3, max: 5, points: '+250 Points', done: false },
];

const RECOMMENDED_EARNING = [
  { title: 'Retro Fleece Hoodie', price: '₹1,899', points: '+190 Points', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300' },
  { title: 'Denim Utility Overshirt', price: '₹1,100', points: '+110 Points', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300' },
];

const Rewards = () => {
  const [rewardData, setRewardData] = useState({ points: 0, tier: 'Bronze', vipId: 'N/A', memberSince: new Date().getFullYear() });
  const [history, setHistory] = useState([]);
  const [spinUsed, setSpinUsed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [badgeModal, setBadgeModal] = useState(null);
  const [birthdayClaimed, setBirthdayClaimed] = useState(false);
  const [redeemOptions, setRedeemOptions] = useState(REDEEM_OPTIONS);

  const [hideRewards, setHideRewards] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    shippingSettingsService.get().then(s => {
      if (s && s.hideRewards) {
        setHideRewards(true);
      }
      setSettingsLoading(false);
    }).catch(() => setSettingsLoading(false));
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const data = await rewardsService.getAll();
      if (data && data.length > 0) {
        setRedeemOptions(data);
      }
    } catch (err) {
      console.error(err);
    }
    try {
      const rDetails = await rewardsService.getCustomerPoints();
      setRewardData(rDetails);
    } catch (_) {}
    try {
      const hist = await rewardsService.getHistory();
      setHistory(hist);
    } catch (_) {}
  };

  const showMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText('https://retrostylings.com/invite?ref=MUNEESWARAN250');
    setCopied(true);
    showMsg('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpin = () => {
    if (spinUsed) {
      showMsg('You have already used your daily spin. Available again in 24 hours!', 'warning');
      return;
    }
    setSpinning(true);
    
    // Simulate wheel spin rotation
    setTimeout(async () => {
      setSpinning(false);
      setSpinUsed(true);
      const prizes = [
        { name: '50 Bonus Points', pts: 50 },
        { name: '100 Bonus Points', pts: 100 },
        { name: 'Free Shipping Coupon', pts: 0 },
        { name: '10% Discount Code', pts: 0 },
      ];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      if (win.pts > 0) {
        try {
          const newPoints = await rewardsService.addPoints(win.pts, `Daily Spin & Win Prize`);
          setRewardData(prev => ({ ...prev, points: newPoints }));
          const hist = await rewardsService.getHistory();
          setHistory(hist);
        } catch (_) {}
      }
      showMsg(`Congratulations! You won: ${win.name}!`);
    }, 3000);
  };

  const getNextTierDetails = (pts) => {
    if (pts >= 5000) {
      return { next: 'Platinum (Max Tier)', progress: 100, remaining: 0, label: 'Ultimate Member status achieved' };
    }
    if (pts >= 2500) {
      const remaining = 5000 - pts;
      const progress = ((pts - 2500) / 2500) * 100;
      return { next: 'Platinum (5,000 Pts)', progress, remaining, label: `${remaining} Points to Platinum Member` };
    }
    if (pts >= 1000) {
      const remaining = 2500 - pts;
      const progress = ((pts - 1000) / 1500) * 100;
      return { next: 'Gold (2,500 Pts)', progress, remaining, label: `${remaining} Points to Gold Member` };
    }
    const remaining = 1000 - pts;
    const progress = (pts / 1000) * 100;
    return { next: 'Silver (1,000 Pts)', progress, remaining, label: `${remaining} Points to Silver Member` };
  };

  const tierDetails = getNextTierDetails(rewardData.points);

  const totalEarned = history
    .filter(h => h.status === 'Credited')
    .reduce((acc, h) => {
      const val = parseInt(h.points?.toString().replace('+', '') || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

  const totalRedeemed = history
    .filter(h => h.status === 'Debited')
    .reduce((acc, h) => {
      const val = Math.abs(parseInt(h.points?.toString() || 0));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

  if (!settingsLoading && hideRewards) {
    return (
      <div className="rewards-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
        <div className="empty-state" style={{ maxWidth: '420px', padding: '3rem 2rem', background: 'var(--bg-card)', border: 'var(--glass-border-bright)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <Trophy size={48} className="empty-icon" style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Rewards Program Inactive</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>The VIP rewards program is currently disabled. Please check back later.</p>
          <Link to="/profile" className="btn btn-primary btn-sm" style={{ marginTop: '1.5rem', display: 'inline-flex', textDecoration: 'none' }}>Go to Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-page">
      {toast && <Toast text={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <div className="rewards-container container">
        {/* Header navigation back */}
        <div className="rewards-header-nav">
          <Link to="/profile" className="back-link"><ArrowLeft size={16} /> Back to My Account</Link>
          <div className="rewards-breadcrumb">Home / Rewards & Loyalty</div>
        </div>

        {/* WELCOME HERO SECTION */}
        <div className="rewards-hero-grid">
          {/* Premium Membership Card */}
          <div className="loyalty-hero-card">
            <div className="loyalty-card-glow"></div>
            <div className="loyalty-card-header">
              <span className="brand-logo">RETRO REWARDS</span>
              <span className="tier-tag">{rewardData.tier.toUpperCase()} MEMBER ⭐</span>
            </div>
            <div className="loyalty-card-body">
              <h2 className="points-counter">{rewardData.points.toLocaleString()}</h2>
              <p className="points-label">AVAILABLE POINTS</p>
            </div>
            <div className="loyalty-card-footer">
              <div>
                <span>MEMBER SINCE</span>
                <p>{rewardData.memberSince}</p>
              </div>
              <div className="stats-indicator text-right">
                <span>LIFETIME SAVINGS</span>
                <p>₹{Math.floor(totalRedeemed * 0.1)}</p>
              </div>
            </div>
          </div>

          {/* Progress / Stat Info Grid */}
          <div className="tier-progress-card">
            <h3>Tier Level Status</h3>
            <div className="progress-info-row">
              <span className="current-tier font-bold">{rewardData.tier} Member</span>
              <span className="next-tier text-muted">{tierDetails.next}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${tierDetails.progress}%` }}></div>
            </div>
            <p className="pts-remaining-label">
              {tierDetails.label}
            </p>
            <div className="stat-summary-grid">
              <div className="stat-box">
                <span className="stat-label">Total Earned</span>
                <p className="stat-value">{totalEarned}</p>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Redeemed</span>
                <p className="stat-value">{totalRedeemed}</p>
              </div>
              <div className="stat-box">
                <span className="stat-label">Active Perks</span>
                <p className="stat-value">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎂 BIRTHDAY SPECIAL SECTION */}
        <div className="birthday-promo-section mt-5">
          <div className="birthday-glow"></div>
          <div className="birthday-content">
            <div className="birthday-icon">🎂</div>
            <div>
              <h3>Happy Birthday Month!</h3>
              <p>As a {rewardData.tier} Member, claim your exclusive birthday rewards bundle.</p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            disabled={birthdayClaimed}
            onClick={async () => {
              setBirthdayClaimed(true);
              try {
                const newPoints = await rewardsService.addPoints(500, 'Birthday Month Reward');
                setRewardData(prev => ({ ...prev, points: newPoints }));
                const hist = await rewardsService.getHistory();
                setHistory(hist);
                showMsg('Birthday bundle claimed! +500 Points added to account.');
              } catch (_) {
                showMsg('Failed to claim birthday points.', 'error');
              }
            }}
          >
            {birthdayClaimed ? 'Claimed ✓' : 'Claim Birthday Bundle'}
          </button>
        </div>

        {/* DUAL CODES & DAILY SPIN SECTION */}
        <div className="rewards-dual-layout mt-5">
          {/* Daily Spin & Win wheel */}
          <div className="glass-card spin-wheel-card">
            <h3>Daily Spin & Win</h3>
            <p className="subtitle">Spin once every 24 hours to win coupons, free shipping, or bonus points.</p>
            <div className="wheel-showcase">
              <div className={`wheel-circle ${spinning ? 'spin-animating' : ''}`}>
                <div className="wheel-notch pointer-notch"></div>
                <div className="wheel-sections">
                  <span>+50 Pts</span>
                  <span>10% Off</span>
                  <span>+100 Pts</span>
                  <span>Free Ship</span>
                </div>
              </div>
              <button className="btn btn-primary mt-4 spin-btn" onClick={handleSpin} disabled={spinning || spinUsed}>
                {spinning ? 'Spinning...' : spinUsed ? 'Come Back Tomorrow' : 'Spin Wheel'}
              </button>
            </div>
          </div>

          {/* Gamified Missions */}
          <div className="glass-card missions-card">
            <h3>Reward Missions</h3>
            <p className="subtitle">Complete monthly challenges to earn massive bonus points.</p>
            <div className="missions-stack">
              {MISSIONS.map((m, i) => (
                <div key={i} className={`mission-row ${m.done ? 'completed' : ''}`}>
                  <div className="mission-info">
                    <h4>{m.title}</h4>
                    <span className="bonus-tag">{m.points}</span>
                  </div>
                  <div className="mission-progress-bar">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(m.progress / m.max) * 100}%` }}></div>
                    </div>
                    <span className="progress-fraction">{m.progress}/{m.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MEMBERSHIP LEVELS PRIVILEGES */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone text-center">
            <h2 className="section-title">Membership Tiers</h2>
            <p className="section-subtitle">Unlock premium privileges as you earn points</p>
          </div>
          <div className="levels-tier-grid">
            {MEMBERSHIP_LEVELS.map(level => (
              <div key={level.id} className={`level-card ${level.current ? 'current-active' : ''}`} style={{ '--level-color': level.color }}>
                {level.current && <span className="level-active-badge">Current Level</span>}
                <h3 className="level-name" style={{ color: level.color }}>{level.name}</h3>
                <span className="level-threshold">{level.threshold}</span>
                <ul className="level-benefits-list">
                  {level.benefits.map((b, bi) => (
                    <li key={bi}><Check size={14} style={{ color: level.color }} /> {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* WAYS TO EARN */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone text-center">
            <h2 className="section-title">Ways To Earn Points</h2>
            <p className="section-subtitle">Earn points easily through purchases, reviews, and community challenges</p>
          </div>
          <div className="ways-earn-grid">
            {WAYS_TO_EARN.map((w, i) => (
              <div key={i} className="earn-card">
                <div className="earn-icon"><w.icon size={20} /></div>
                <div className="earn-info">
                  <h4>{w.title}</h4>
                  <p className="earn-points">{w.points}</p>
                  <p className="earn-desc">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REDEEM REWARDS */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone text-center">
            <h2 className="section-title">Redeem Rewards</h2>
            <p className="section-subtitle">Exchange your points for coupons and exclusive merchandise</p>
          </div>
          <div className="redeem-rewards-grid">
            {redeemOptions.map(opt => (
              <div key={opt.id} className={`redeem-card ${opt.available === false ? 'out-of-stock' : ''}`}>
                <div className="redeem-header">
                  <h4>{opt.title}</h4>
                  <span className="redeem-pts-cost">{opt.points} Points</span>
                </div>
                <p className="redeem-desc">{opt.desc}</p>
                <button 
                  className="btn btn-primary btn-sm w-full mt-3" 
                  disabled={rewardData.points < opt.points || opt.available === false}
                  onClick={async () => {
                    try {
                      const newPoints = await rewardsService.redeem(opt.id, opt.points, opt.title);
                      setRewardData(prev => ({ ...prev, points: newPoints }));
                      const hist = await rewardsService.getHistory();
                      setHistory(hist);
                      showMsg(`Successfully redeemed ${opt.title}! Coupon code ready for use.`);
                    } catch (err) {
                      showMsg(err.message || 'Failed to redeem reward', 'error');
                    }
                  }}
                >
                  {opt.available === false ? 'Out of Stock' : rewardData.points >= opt.points ? 'Redeem Reward' : 'Insufficient Points'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AVAILABLE COUPONS */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone text-center">
            <h2 className="section-title">Active Coupons</h2>
            <p className="section-subtitle">Claimed coupon codes ready for use at checkout</p>
          </div>
          <div className="coupons-scroller-grid">
            <div className="active-coupon-card">
              <div className="coupon-value">20% OFF</div>
              <div className="coupon-details">
                <h4>SUMMEREXCLUSIVE</h4>
                <p>Minimum Order: ₹1,999</p>
                <span className="expires-tag">Expires in 8 Days</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showMsg('Coupon code copied! Ready to apply.')}>Apply Now</button>
            </div>
            <div className="active-coupon-card">
              <div className="coupon-value">₹500 OFF</div>
              <div className="coupon-details">
                <h4>GOLDTREAT500</h4>
                <p>Minimum Order: ₹2,499</p>
                <span className="expires-tag text-red">Expires in 2 Days</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showMsg('Coupon code copied! Ready to apply.')}>Apply Now</button>
            </div>
          </div>
        </section>

        {/* REFERRAL PROGRAM */}
        <section className="rewards-section mt-5">
          <div className="referral-lux-card">
            <div className="referral-header">
              <h2>Invite Friends & Family</h2>
              <p className="referral-bonus-text">You earn <strong>₹250</strong> and your friend gets <strong>₹250</strong> on their first order.</p>
            </div>
            
            <div className="referral-link-row">
              <input className="referral-link-input" readOnly value="https://retrostylings.com/invite?ref=MUNEESWARAN250" />
              <button className="btn btn-primary" onClick={copyRefLink}>
                {copied ? <Check size={16} /> : <Copy size={16} />} Copy
              </button>
            </div>

            <div className="referral-shares">
              <span>Share Link via:</span>
              <div className="share-buttons-stack">
                <button className="btn btn-outline btn-xs" onClick={() => showMsg('WhatsApp sharing opened...')}>WhatsApp</button>
                <button className="btn btn-outline btn-xs" onClick={() => showMsg('Instagram sharing opened...')}>Instagram</button>
                <button className="btn btn-outline btn-xs" onClick={() => showMsg('Telegram sharing opened...')}>Telegram</button>
              </div>
            </div>

            <div className="referral-stats-summary mt-4">
              <div className="ref-stat">
                <span>Friends Joined</span>
                <p>3</p>
              </div>
              <div className="ref-stat">
                <span>Orders Completed</span>
                <p>2</p>
              </div>
              <div className="ref-stat text-right">
                <span>Rewards Earned</span>
                <p>₹500</p>
              </div>
            </div>
          </div>
        </section>

        {/* EXCLUSIVE MEMBER OFFERS */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Exclusive Member Offers</h2>
            <p className="section-subtitle">Exclusive limited launches and events unlocked for your tier level</p>
          </div>
          <div className="exclusive-offers-scroller">
            {EXCLUSIVE_OFFERS.map((offer, i) => (
              <div key={i} className="exclusive-offer-card">
                <img src={offer.image} alt={offer.title} />
                <div className="offer-content">
                  <span className="offer-tag">{offer.label}</span>
                  <h3>{offer.title}</h3>
                  <p>{offer.desc}</p>
                  <button className="btn btn-primary btn-sm mt-3">Unlock Early Access</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ACHIEVEMENT BADGES */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone text-center">
            <h2 className="section-title">Achievement Badges</h2>
            <p className="section-subtitle">Earn unique badges as you complete shopping milestones</p>
          </div>
          <div className="badges-grid-list">
            {BADGES.map((b, i) => (
              <div key={i} className={`badge-card-item ${b.earned ? 'earned' : 'locked'}`} onClick={() => setBadgeModal(b)}>
                <div className="badge-item-icon">{b.icon}</div>
                <h4>{b.title}</h4>
                <span className="badge-status-label">{b.earned ? 'Unlocked' : 'Locked'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PERSONALIZED RECOMMENDATIONS (EARN MORE POINTS) */}
        <section className="rewards-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Shop & Earn Bonus Points</h2>
            <p className="section-subtitle">Styles curated to maximize your points balance</p>
          </div>
          <div className="recommendations-scroller">
            {RECOMMENDED_EARNING.map((rec, i) => (
              <div key={i} className="earn-rec-card">
                <img src={rec.image} alt={rec.title} />
                <div className="earn-rec-info">
                  <h4>{rec.title}</h4>
                  <div className="flex-between">
                    <span className="price">{rec.price}</span>
                    <span className="bonus-pill">{rec.points}</span>
                  </div>
                  <button className="btn btn-primary btn-sm w-full mt-3">Shop Now</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REWARD HISTORY TIMELINE */}
        <section className="rewards-section mt-5 mb-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Points History</h2>
            <p className="section-subtitle">Activity logs of your earned and redeemed loyalty points</p>
          </div>
          <div className="reward-timeline-wrapper">
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No points activity recorded yet.</p>
            ) : history.map((hist, i) => (
              <div key={i} className="timeline-item-row">
                <div className="timeline-dot-indicator"></div>
                <div className="timeline-info-content">
                  <div className="flex-between align-center">
                    <h4 className="reason">{hist.reason}</h4>
                    <span className={`points-change-value ${hist.points.startsWith('+') ? 'credit' : 'debit'}`}>
                      {hist.points}
                    </span>
                  </div>
                  <div className="flex-between mt-2">
                    <span className="date text-muted">{hist.date}</span>
                    <span className="status-badge-tag">{hist.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Badge click Modal */}
      <AnimatePresence>
        {badgeModal && (
          <div className="modal-overlay" onClick={() => setBadgeModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{badgeModal.title}</h2>
                <button className="btn-close" onClick={() => setBadgeModal(null)}><X size={20} /></button>
              </div>
              <div className="modal-body text-center">
                <div className="badge-modal-large-icon">{badgeModal.icon}</div>
                <p className="badge-modal-desc mt-3">{badgeModal.desc}</p>
                <div className="badge-modal-status-badge mt-4">
                  {badgeModal.earned ? '✓ Unlocked Milestone' : '🔒 Locked Milestone'}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rewards;
