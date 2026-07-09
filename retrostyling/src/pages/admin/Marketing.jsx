import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  Zap, Star, Lightbulb, Gift, Award, Users, Mail,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rewardsService } from '../../services/firestoreService';
import Toast from '../../components/Toast';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const mockFlashSales = [
  { id: 1, name: 'Midnight Flash Sale', discount: 40, startTime: '2026-07-08T22:00', endTime: '2026-07-09T04:00', products: 12, active: true },
  { id: 2, name: 'Weekend Blowout', discount: 25, startTime: '2026-07-12T10:00', endTime: '2026-07-13T22:00', products: 28, active: false },
];

const mockLoyaltyRules = [
  { id: 1, action: 'Purchase', points: 10, description: '10 points per ₹100 spent', active: true },
  { id: 2, action: 'Review', points: 50, description: '50 points for writing a review', active: true },
  { id: 3, action: 'Referral', points: 200, description: '200 points per successful referral', active: true },
  { id: 4, action: 'Birthday', points: 100, description: '100 bonus points on birthday', active: false },
  { id: 5, action: 'First Order', points: 150, description: '150 points on first purchase', active: true },
];

const CountdownTimer = ({ endTime }) => {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>Ended</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="countdown-timer">
      <Clock size={12} /> {h}h {m}m remaining
    </span>
  );
};

const Marketing = () => {
  const [flashSales, setFlashSales] = useState(mockFlashSales);
  const [loyaltyRules, setLoyaltyRules] = useState(mockLoyaltyRules);
  const [activeTab, setActiveTab] = useState('flash');
  const [newsletterForm, setNewsletterForm] = useState({ subject: '', body: '', segment: 'all' });

  // Rewards catalog state
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({ title: '', points: '', desc: '', available: true });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoadingRewards(true);
    try {
      const data = await rewardsService.getAll();
      setRewards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRewards(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: rewardForm.title,
        points: parseInt(rewardForm.points, 10),
        desc: rewardForm.desc,
        available: rewardForm.available
      };

      if (editingReward) {
        await rewardsService.update(editingReward.id, payload);
        showMsg('Reward option updated successfully');
      } else {
        await rewardsService.create(payload);
        showMsg('New reward option created');
      }
      setIsModalOpen(false);
      loadRewards();
    } catch (err) {
      console.error(err);
      showMsg('Failed to save reward option', 'error');
    }
  };

  const handleDeleteReward = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reward option?')) return;
    try {
      await rewardsService.delete(id);
      showMsg('Reward option deleted');
      loadRewards();
    } catch (err) {
      console.error(err);
      showMsg('Failed to delete reward option', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingReward(null);
    setRewardForm({ title: '', points: '', desc: '', available: true });
    setIsModalOpen(true);
  };

  const openEditModal = (reward) => {
    setEditingReward(reward);
    setRewardForm({ title: reward.title, points: reward.points, desc: reward.desc, available: reward.available });
    setIsModalOpen(true);
  };

  const toggleFlash = (id) => setFlashSales(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  const toggleRule = (id) => setLoyaltyRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const TABS = [
    { id: 'flash', label: 'Flash Sales', icon: Zap },
    { id: 'featured', label: 'Featured Products', icon: Star },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: Award },
    { id: 'referral', label: 'Referral Program', icon: Users },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
  ];

  return (
    <AdminLayout>
      {toast && <Toast isOpen={true} message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Marketing</h1>
            <p className="page-subtitle">Manage flash sales, loyalty programs, referrals, and newsletters.</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </motion.div>

        {/* Flash Sales */}
        {activeTab === 'flash' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm"><Plus size={14} /> Create Flash Sale</button>
            </div>
            {flashSales.map(sale => (
              <motion.div key={sale.id} className="marketing-card" variants={itemVariants}>
                <div className="marketing-card-icon" style={{ background: 'rgba(223,255,27,0.1)', color: 'var(--primary)' }}>
                  <Zap size={22} />
                </div>
                <div className="marketing-card-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3>{sale.name}</h3>
                    <span className="badge badge-primary">{sale.discount}% OFF</span>
                    <span className={`badge ${sale.active ? 'badge-success' : 'badge-neutral'}`}>{sale.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {sale.products} products · {sale.startTime.replace('T', ' ')} → {sale.endTime.replace('T', ' ')}
                  </p>
                  {sale.active && <CountdownTimer endTime={sale.endTime} />}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-icon"><Edit2 size={15} /></button>
                  <button className="toggle-btn" onClick={() => toggleFlash(sale.id)}>
                    {sale.active ? <ToggleRight size={24} color="var(--primary)" /> : <ToggleLeft size={24} color="var(--text-muted)" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Featured Products */}
        {activeTab === 'featured' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="marketing-info-card">
              <Star size={20} color="var(--warning)" />
              <div>
                <h4>Featured Products</h4>
                <p>Products marked as featured will appear in the "Featured" section on the homepage. You can manage this from the Product edit page.</p>
              </div>
              <button className="btn btn-primary btn-sm">Manage Products</button>
            </div>
            <div className="marketing-info-card">
              <Lightbulb size={20} color="var(--primary)" />
              <div>
                <h4>Recommended Products</h4>
                <p>Configure AI-powered product recommendations for homepage and product detail pages.</p>
              </div>
              <button className="btn btn-secondary btn-sm">Configure</button>
            </div>
          </motion.div>
        )}

        {/* Loyalty & Rewards */}
        {activeTab === 'loyalty' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="loyalty-summary">
              <div className="loyalty-stat"><h3>24,680</h3><p>Total Points Issued</p></div>
              <div className="loyalty-stat"><h3>12,340</h3><p>Points Redeemed</p></div>
              <div className="loyalty-stat"><h3>₹1 = 1 pt</h3><p>Redemption Rate</p></div>
              <div className="loyalty-stat"><h3>482</h3><p>Active Members</p></div>
            </div>
            
            <h3 style={{ fontWeight: 700, marginTop: '1rem' }}>Point Earning Rules</h3>
            {loyaltyRules.map(rule => (
              <motion.div key={rule.id} className="loyalty-rule-card" variants={itemVariants}>
                <div className="loyalty-rule-icon"><Award size={18} /></div>
                <div className="loyalty-rule-info">
                  <h4>{rule.action}</h4>
                  <p>{rule.description}</p>
                </div>
                <span className="loyalty-points">+{rule.points} pts</span>
                <button className="toggle-btn" onClick={() => toggleRule(rule.id)}>
                  {rule.active ? <ToggleRight size={22} color="var(--primary)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                </button>
              </motion.div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <h3 style={{ fontWeight: 700 }}>Redeemable Rewards Catalog</h3>
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} /> Create Reward Option
              </button>
            </div>
            
            {loadingRewards ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading rewards catalog...</div>
            ) : rewards.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No reward options defined. Create one to get started.</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reward Title</th>
                      <th>Points Cost</th>
                      <th>Description</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map(r => (
                      <tr key={r.id}>
                        <td className="font-bold">{r.title}</td>
                        <td><span className="badge badge-primary">{r.points} pts</span></td>
                        <td>{r.desc}</td>
                        <td>
                          <span className={`status-pill ${r.available ? 'pill-delivered' : 'pill-cancelled'}`}>
                            {r.available ? 'Available' : 'Out of Stock'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-icon" onClick={() => openEditModal(r)}><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-icon text-red" onClick={() => handleDeleteReward(r.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Referral Program */}
        {activeTab === 'referral' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="loyalty-summary">
              <div className="loyalty-stat"><h3>156</h3><p>Total Referrals</p></div>
              <div className="loyalty-stat"><h3>89</h3><p>Successful</p></div>
              <div className="loyalty-stat"><h3>₹44,500</h3><p>Revenue Generated</p></div>
              <div className="loyalty-stat"><h3>₹17,800</h3><p>Rewards Paid</p></div>
            </div>
            <div className="marketing-info-card">
              <Gift size={20} color="var(--secondary)" />
              <div>
                <h4>Referral Settings</h4>
                <p>Referrer earns ₹200 + Referred friend gets ₹100 off first order</p>
              </div>
              <button className="btn btn-secondary btn-sm">Edit Settings</button>
            </div>
          </motion.div>
        )}

        {/* Newsletter */}
        {activeTab === 'newsletter' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="loyalty-summary">
              <div className="loyalty-stat"><h3>3,842</h3><p>Subscribers</p></div>
              <div className="loyalty-stat"><h3>68.4%</h3><p>Open Rate</p></div>
              <div className="loyalty-stat"><h3>12</h3><p>Campaigns Sent</p></div>
            </div>
            <div className="newsletter-form">
              <div className="form-group">
                <label className="form-label">Recipient Segment</label>
                <select className="form-input" value={newsletterForm.segment} onChange={e => setNewsletterForm(f => ({ ...f, segment: e.target.value }))}>
                  <option value="all">All Subscribers ({3842})</option>
                  <option value="new">New Customers (last 30 days)</option>
                  <option value="vip">VIP Customers</option>
                  <option value="inactive">Inactive (90+ days)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email Subject *</label>
                <input className="form-input" placeholder="E.g. New arrivals this week!" value={newsletterForm.subject} onChange={e => setNewsletterForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-input" rows={6} placeholder="Write your newsletter content..." value={newsletterForm.body} onChange={e => setNewsletterForm(f => ({ ...f, body: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm">Send Campaign</button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Rewards Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <h3>{editingReward ? 'Edit Reward Option' : 'Create Reward Option'}</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveReward}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Reward Title *</label>
                    <input required className="form-input" placeholder="E.g. ₹500 Coupon" value={rewardForm.title} onChange={e => setRewardForm({ ...rewardForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Points Cost *</label>
                    <input required type="number" min="1" className="form-input" placeholder="E.g. 4000" value={rewardForm.points} onChange={e => setRewardForm({ ...rewardForm, points: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <input required className="form-input" placeholder="E.g. Flat discount on any order" value={rewardForm.desc} onChange={e => setRewardForm({ ...rewardForm, desc: e.target.value })} />
                  </div>
                  <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={rewardForm.available} onChange={e => setRewardForm({ ...rewardForm, available: e.target.checked })} />
                    Mark as Available / In Stock
                  </label>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingReward ? 'Update Reward' : 'Create Reward'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default Marketing;
