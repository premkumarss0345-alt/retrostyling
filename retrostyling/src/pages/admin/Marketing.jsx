import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  Zap, Star, Lightbulb, Gift, Award, Users, Mail,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Clock, Globe, Search, FileText, Check,
  Tag, Percent, Truck, Copy, Sparkles, X, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rewardsService, flashSaleService, productService, userRewardsService, userService } from '../../services/firestoreService';
import Toast from '../../components/Toast';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

/* mockFlashSales removed - loaded from Firestore */

const mockLoyaltyRules = [];

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
  const location = useLocation();
  const [flashSales, setFlashSales] = useState([]);
  const [loadingFlash, setLoadingFlash] = useState(true);
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [editingFlash, setEditingFlash] = useState(null);
  const [flashForm, setFlashForm] = useState({ name: '', discount: '', startTime: '', endTime: '', active: false, productIds: [] });
  const [productsList, setProductsList] = useState([]);

  const [loyaltyRules, setLoyaltyRules] = useState(mockLoyaltyRules);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'flash');
  const [newsletterForm, setNewsletterForm] = useState({ subject: '', body: '', segment: 'all' });
  const [seoForm, setSeoForm] = useState({
    siteTitle: "Retrostylings | Premium Men's Fashion & Apparel",
    metaDescription: "Discover retro and modern men's fashion at Retrostylings. Shop premium shirts, t-shirts, jackets, and essentials with supreme comfort and style.",
    metaKeywords: "men's fashion, vintage clothing, retro shirts, premium menswear, streetwear, casual wear, formal wear",
    googleSiteVerification: "",
    bingSiteVerification: "",
    ogImageUrl: "/og-image.jpg"
  });

  // Rewards catalog state
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({ title: '', points: '', desc: '', available: true });
  const [toast, setToast] = useState(null);

  // User-specific rewards state ("Which user has which reward")
  const [userRewards, setUserRewards] = useState([]);
  const [loadingUserRewards, setLoadingUserRewards] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [userRewardSearch, setUserRewardSearch] = useState('');
  const [userRewardFilter, setUserRewardFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [assignForm, setAssignForm] = useState({
    userId: '',
    userEmail: '',
    userName: '',
    title: '',
    type: 'percentage',
    code: '',
    discountValue: '',
    minOrder: '',
    maxDiscount: '',
    points: '',
    expiry: '',
    notes: '',
  });

  useEffect(() => {
    loadRewards();
    loadFlashSales();
    loadProducts();
    loadUserRewards();
    loadUsers();
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const loadUserRewards = async () => {
    setLoadingUserRewards(true);
    try {
      const data = await userRewardsService.getAll();
      setUserRewards(data);
    } catch (err) {
      console.error('Error loading user rewards:', err);
    } finally {
      setLoadingUserRewards(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsersList(data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

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

  const loadFlashSales = async () => {
    setLoadingFlash(true);
    try {
      const data = await flashSaleService.getAll();
      setFlashSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFlash(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAllAdmin();
      setProductsList(data);
    } catch (err) {
      console.error(err);
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

  // ─── USER REWARDS HANDLERS ──────────────────────────────────────
  const openAssignModal = (preUser = null) => {
    const generatedCode = `REW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setAssignForm({
      userId: preUser?.id || preUser?.uid || '',
      userEmail: preUser?.email || '',
      userName: preUser?.name || preUser?.displayName || '',
      title: 'Special VIP Discount',
      type: 'percentage',
      code: generatedCode,
      discountValue: '20',
      minOrder: '',
      maxDiscount: '',
      points: '200',
      expiry: '',
      notes: 'Thank you for your valuable patronage!',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignReward = async (e) => {
    e.preventDefault();
    if (!assignForm.userId && !assignForm.userEmail) {
      showMsg('Please select a customer for this reward', 'error');
      return;
    }
    if (!assignForm.title.trim()) {
      showMsg('Please enter a reward title', 'error');
      return;
    }

    try {
      // Find user details if only userId was selected
      let selectedUser = usersList.find(u => (u.id || u.uid) === assignForm.userId);
      const email = assignForm.userEmail || selectedUser?.email || '';
      const name = assignForm.userName || selectedUser?.displayName || selectedUser?.name || 'Customer';

      await userRewardsService.assignReward({
        userId: assignForm.userId || selectedUser?.id || selectedUser?.uid,
        userEmail: email,
        userName: name,
        title: assignForm.title,
        type: assignForm.type,
        code: assignForm.code,
        discountValue: assignForm.discountValue,
        minOrder: assignForm.minOrder,
        maxDiscount: assignForm.maxDiscount,
        points: assignForm.points,
        expiry: assignForm.expiry,
        notes: assignForm.notes,
      });

      showMsg(`Reward assigned to ${name}!`);
      setIsAssignModalOpen(false);
      loadUserRewards();
    } catch (err) {
      console.error('Error assigning reward:', err);
      showMsg('Failed to assign reward to customer', 'error');
    }
  };

  const handleToggleUserRewardStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'used' : 'active';
    try {
      await userRewardsService.updateStatus(id, newStatus);
      showMsg(`Reward marked as ${newStatus}`);
      loadUserRewards();
    } catch (err) {
      console.error(err);
      showMsg('Failed to update reward status', 'error');
    }
  };

  const handleDeleteUserReward = async (id) => {
    if (!window.confirm('Revoke and delete this assigned reward?')) return;
    try {
      await userRewardsService.delete(id);
      showMsg('Assigned reward revoked');
      loadUserRewards();
    } catch (err) {
      console.error(err);
      showMsg('Failed to delete reward', 'error');
    }
  };

  const copyRewardCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showMsg(`Code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateFlashModal = () => {
    setEditingFlash(null);
    setFlashForm({ name: '', discount: '', startTime: '', endTime: '', active: false, productIds: [] });
    setIsFlashModalOpen(true);
  };

  const openEditFlashModal = (sale) => {
    setEditingFlash(sale);
    setFlashForm({
      name: sale.name,
      discount: sale.discount,
      startTime: sale.startTime,
      endTime: sale.endTime,
      active: sale.active,
      productIds: sale.productIds || []
    });
    setIsFlashModalOpen(true);
  };

  const handleSaveFlash = async (e) => {
    e.preventDefault();
    if (flashForm.productIds.length === 0) {
      showMsg('Please select at least one product', 'error');
      return;
    }
    try {
      const payload = {
        name: flashForm.name,
        discount: parseInt(flashForm.discount, 10),
        startTime: flashForm.startTime,
        endTime: flashForm.endTime,
        active: flashForm.active,
        productIds: flashForm.productIds,
        products: flashForm.productIds.length
      };

      if (editingFlash) {
        await flashSaleService.update(editingFlash.id, payload);
        showMsg('Flash sale updated successfully');
      } else {
        await flashSaleService.create(payload);
        showMsg('New flash sale created');
      }
      setIsFlashModalOpen(false);
      loadFlashSales();
    } catch (err) {
      console.error(err);
      showMsg('Failed to save flash sale', 'error');
    }
  };

  const handleDeleteFlash = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flash sale?')) return;
    try {
      await flashSaleService.delete(id);
      showMsg('Flash sale deleted');
      loadFlashSales();
    } catch (err) {
      console.error(err);
      showMsg('Failed to delete flash sale', 'error');
    }
  };

  const toggleFlash = async (id, currentActive) => {
    try {
      await flashSaleService.toggleActive(id, currentActive);
      showMsg(`Flash sale status updated`);
      loadFlashSales();
    } catch (err) {
      console.error(err);
      showMsg('Failed to update flash sale status', 'error');
    }
  };

  const toggleRule = (id) => setLoyaltyRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const TABS = [
    { id: 'flash', label: 'Flash Sales', icon: Zap },
    { id: 'featured', label: 'Featured Products', icon: Star },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: Award },
    { id: 'referral', label: 'Referral Program', icon: Users },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'seo', label: 'SEO & Metadata', icon: Globe },
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
              <button className="btn btn-primary btn-sm" onClick={openCreateFlashModal}><Plus size={14} /> Create Flash Sale</button>
            </div>
            {loadingFlash ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading flash sales...</div>
            ) : flashSales.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No flash sales defined. Create one to get started.</div>
            ) : (
              flashSales.map(sale => (
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
                      {sale.products || 0} products · {sale.startTime.replace('T', ' ')} → {sale.endTime.replace('T', ' ')}
                    </p>
                    {sale.active && <CountdownTimer endTime={sale.endTime} />}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEditFlashModal(sale)} title="Edit"><Edit2 size={15} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteFlash(sale.id)} style={{ color: 'var(--error)' }} title="Delete"><Trash2 size={15} /></button>
                    <button className="toggle-btn" onClick={() => toggleFlash(sale.id, sale.active)}>
                      {sale.active ? <ToggleRight size={24} color="var(--primary)" /> : <ToggleLeft size={24} color="var(--text-muted)" />}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
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

            {/* ─── CUSTOMER REWARD ASSIGNMENTS ("Which User Has Which Reward") ─── */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Customer Reward Assignments
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Track and manage which customer has which reward. Directly assign personal coupons, bonus points, or VIP perks.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openAssignModal()}>
                  <Plus size={14} /> Assign Reward to Customer
                </button>
              </div>

              {/* Filters & Search for User Rewards */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div className="search-wrapper" style={{ maxWidth: 280, flex: 1 }}>
                  <Search size={15} className="search-icon" />
                  <input
                    className="form-input search-input"
                    placeholder="Search by customer, email, reward..."
                    value={userRewardSearch}
                    onChange={e => setUserRewardSearch(e.target.value)}
                  />
                </div>
                <div className="period-tabs">
                  {['all', 'active', 'used'].map(f => (
                    <button
                      key={f}
                      type="button"
                      className={`period-btn ${userRewardFilter === f ? 'active' : ''}`}
                      onClick={() => setUserRewardFilter(f)}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {loadingUserRewards ? (
                <div style={{ color: 'var(--text-muted)', padding: '1.5rem 0', textAlign: 'center' }}>
                  Loading assigned customer rewards...
                </div>
              ) : userRewards.length === 0 ? (
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px dashed var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '2.5rem', 
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Gift size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
                  <h4 style={{ color: 'var(--white)', marginBottom: '0.3rem' }}>No Rewards Assigned Yet</h4>
                  <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                    Reward your top customers or send special discounts and perks directly to specific users!
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => openAssignModal()}>
                    <Plus size={14} /> Assign First Reward
                  </button>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Reward Title</th>
                        <th>Type & Value</th>
                        <th>Code</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRewards
                        .filter(r => {
                          const matchesSearch = 
                            (r.userName || '').toLowerCase().includes(userRewardSearch.toLowerCase()) ||
                            (r.userEmail || '').toLowerCase().includes(userRewardSearch.toLowerCase()) ||
                            (r.title || '').toLowerCase().includes(userRewardSearch.toLowerCase()) ||
                            (r.code || '').toLowerCase().includes(userRewardSearch.toLowerCase());
                          const matchesFilter = userRewardFilter === 'all' || r.status === userRewardFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map(r => (
                          <tr key={r.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: 'var(--white)' }}>{r.userName || 'Anonymous User'}</strong>
                                <small style={{ color: 'var(--text-muted)' }}>{r.userEmail || 'No email'}</small>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{r.title}</span>
                                {r.notes && <small style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>"{r.notes}"</small>}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                {r.type === 'percentage' ? `${r.discountValue}% OFF`
                                  : r.type === 'flat' ? `₹${r.discountValue} OFF`
                                  : r.type === 'free_shipping' ? 'FREE SHIPPING'
                                  : r.type === 'points' ? `+${r.points} PTS`
                                  : 'GIFT'}
                              </span>
                              {r.minOrder > 0 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                                  Min ₹{r.minOrder}
                                </span>
                              )}
                            </td>
                            <td>
                              {r.code ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <code style={{ background: 'var(--bg-soft)', padding: '0.15rem 0.4rem', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {r.code}
                                  </code>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ padding: '0.15rem' }}
                                    onClick={() => copyRewardCode(r.code)}
                                    title="Copy code"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  {copiedCode === r.code && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Copied!</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {r.expiry || 'No Expiry'}
                            </td>
                            <td>
                              <span className={`status-pill ${r.status === 'active' ? 'pill-delivered' : 'pill-cancelled'}`}>
                                {r.status === 'active' ? 'Active' : 'Redeemed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                  onClick={() => handleToggleUserRewardStatus(r.id, r.status)}
                                  title={r.status === 'active' ? 'Mark as Used' : 'Reactivate'}
                                >
                                  {r.status === 'active' ? 'Mark Used' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon text-red"
                                  onClick={() => handleDeleteUserReward(r.id)}
                                  title="Revoke Reward"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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

        {/* SEO & Metadata */}
        {activeTab === 'seo' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="marketing-info-card">
              <Globe size={22} color="var(--primary)" />
              <div>
                <h4>Search Engine Optimization (SEO) & Social Sharing</h4>
                <p>Manage default meta tags, structured data, canonical settings, and search console verification tags.</p>
              </div>
            </div>

            <div className="newsletter-form">
              <div className="form-group">
                <label className="form-label">Default Website Title *</label>
                <input
                  className="form-input"
                  value={seoForm.siteTitle}
                  onChange={e => setSeoForm(s => ({ ...s, siteTitle: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Meta Description *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={seoForm.metaDescription}
                  onChange={e => setSeoForm(s => ({ ...s, metaDescription: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Meta Keywords</label>
                <input
                  className="form-input"
                  value={seoForm.metaKeywords}
                  onChange={e => setSeoForm(s => ({ ...s, metaKeywords: e.target.value }))}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Google Site Verification Meta Code</label>
                  <input
                    className="form-input"
                    placeholder="e.g. google-site-verification-id"
                    value={seoForm.googleSiteVerification}
                    onChange={e => setSeoForm(s => ({ ...s, googleSiteVerification: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Bing Webmaster Verification Code</label>
                  <input
                    className="form-input"
                    placeholder="e.g. bing-verification-id"
                    value={seoForm.bingSiteVerification}
                    onChange={e => setSeoForm(s => ({ ...s, bingSiteVerification: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Default Open Graph Image URL (OG Image)</label>
                <input
                  className="form-input"
                  placeholder="/og-image.jpg"
                  value={seoForm.ogImageUrl}
                  onChange={e => setSeoForm(s => ({ ...s, ogImageUrl: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} /> View XML Sitemap
                  </a>
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Search size={14} /> View Robots.txt
                  </a>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => showMsg('SEO Settings updated successfully!')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Check size={14} /> Save SEO Settings
                </button>
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

      {/* Flash Sale Edit/Create Modal */}
      <AnimatePresence>
        {isFlashModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsFlashModalOpen(false)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <h3>{editingFlash ? 'Edit Flash Sale' : 'Create Flash Sale'}</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setIsFlashModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveFlash}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Flash Sale Name *</label>
                    <input required className="form-input" placeholder="E.g. Midnight Flash Sale" value={flashForm.name} onChange={e => setFlashForm({ ...flashForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount Percentage *</label>
                    <input required type="number" min="1" max="99" className="form-input" placeholder="E.g. 40" value={flashForm.discount} onChange={e => setFlashForm({ ...flashForm, discount: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Start Time *</label>
                      <input required type="datetime-local" className="form-input" value={flashForm.startTime} onChange={e => setFlashForm({ ...flashForm, startTime: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">End Time *</label>
                      <input required type="datetime-local" className="form-input" value={flashForm.endTime} onChange={e => setFlashForm({ ...flashForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Select Products (Select multiple) *</label>
                    <div className="products-select-list" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', maxHeight: 150, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {productsList.map(p => {
                        const isChecked = flashForm.productIds.includes(p.id);
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => {
                              setFlashForm(f => {
                                const newIds = isChecked ? f.productIds.filter(id => id !== p.id) : [...f.productIds, p.id];
                                return { ...f, productIds: newIds };
                              });
                            }} />
                            {p.name} (₹{p.price})
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={flashForm.active} onChange={e => setFlashForm({ ...flashForm, active: e.target.checked })} />
                    Mark as Active (will automatically deactivate other active flash sales)
                  </label>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFlashModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingFlash ? 'Update Sale' : 'Create Sale'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Assign Reward to Customer Modal ─── */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsAssignModalOpen(false)}>
            <motion.div
              className="modal-box"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 620, maxHeight: '85vh', overflowY: 'auto' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Assign Reward to Customer
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Grant custom discounts, coupons, or bonus points to a specific customer.
                  </p>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setIsAssignModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleAssignReward}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  
                  {/* Customer Selector */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Select Target Customer *</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{usersList.length} registered customers</span>
                    </label>
                    <select
                      required
                      className="form-input"
                      value={assignForm.userId}
                      onChange={e => {
                        const selId = e.target.value;
                        const selUser = usersList.find(u => (u.id || u.uid) === selId);
                        setAssignForm(prev => ({
                          ...prev,
                          userId: selId,
                          userEmail: selUser?.email || '',
                          userName: selUser?.displayName || selUser?.name || 'Customer'
                        }));
                      }}
                    >
                      <option value="">-- Choose a Customer --</option>
                      {usersList.map(u => (
                        <option key={u.id || u.uid} value={u.id || u.uid}>
                          {u.displayName || u.name || 'User'} ({u.email}) • {u.points || 0} pts
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preset Template Quick-fill */}
                  <div className="form-group">
                    <label className="form-label">Reward Template (Optional Preset)</label>
                    <select
                      className="form-input"
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'pct20') {
                          setAssignForm(f => ({ ...f, title: 'VIP 20% OFF Reward', type: 'percentage', discountValue: '20', minOrder: '999' }));
                        } else if (val === 'flat250') {
                          setAssignForm(f => ({ ...f, title: '₹250 Welcome Gift Voucher', type: 'flat', discountValue: '250', minOrder: '1200' }));
                        } else if (val === 'flat500') {
                          setAssignForm(f => ({ ...f, title: '₹500 Loyalty Appreciation', type: 'flat', discountValue: '500', minOrder: '2499' }));
                        } else if (val === 'freeship') {
                          setAssignForm(f => ({ ...f, title: 'Free Express Shipping Perk', type: 'free_shipping', discountValue: '0', minOrder: '0' }));
                        } else if (val === 'pts500') {
                          setAssignForm(f => ({ ...f, title: '500 Birthday Bonus Points', type: 'points', points: '500', discountValue: '0' }));
                        }
                      }}
                    >
                      <option value="">-- Select or write custom below --</option>
                      <option value="pct20">VIP 20% OFF (Min ₹999)</option>
                      <option value="flat250">₹250 Gift Voucher (Min ₹1,200)</option>
                      <option value="flat500">₹500 Loyalty Appreciation (Min ₹2,499)</option>
                      <option value="freeship">Free Express Shipping</option>
                      <option value="pts500">500 Bonus Points (Direct balance credit)</option>
                    </select>
                  </div>

                  {/* Title & Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Reward Name / Title *</label>
                      <input
                        required
                        className="form-input"
                        placeholder="e.g. VIP 20% Discount"
                        value={assignForm.title}
                        onChange={e => setAssignForm({ ...assignForm, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reward Type *</label>
                      <select
                        className="form-input"
                        value={assignForm.type}
                        onChange={e => setAssignForm({ ...assignForm, type: e.target.value })}
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="flat">Flat Discount (₹)</option>
                        <option value="free_shipping">Free Shipping</option>
                        <option value="points">Bonus Loyalty Points</option>
                        <option value="perk">Exclusive Perk / Gift</option>
                      </select>
                    </div>
                  </div>

                  {/* Value / Points depending on type */}
                  {assignForm.type === 'points' ? (
                    <div className="form-group">
                      <label className="form-label">Points to Credit Customer *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 500"
                        value={assignForm.points}
                        onChange={e => setAssignForm({ ...assignForm, points: e.target.value })}
                      />
                      <small style={{ color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                        Points will be immediately added to the customer's balance and logged in points history.
                      </small>
                    </div>
                  ) : assignForm.type !== 'free_shipping' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">{assignForm.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max={assignForm.type === 'percentage' ? "100" : undefined}
                          className="form-input"
                          placeholder="e.g. 20"
                          value={assignForm.discountValue}
                          onChange={e => setAssignForm({ ...assignForm, discountValue: e.target.value })}
                        />
                      </div>
                      {assignForm.type === 'percentage' && (
                        <div className="form-group">
                          <label className="form-label">Max Discount Cap (₹, Optional)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="e.g. 500"
                            value={assignForm.maxDiscount}
                            onChange={e => setAssignForm({ ...assignForm, maxDiscount: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Coupon Code generation */}
                  {assignForm.type !== 'points' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Coupon Code *</label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            required
                            className="form-input"
                            style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                            placeholder="e.g. VIP20"
                            value={assignForm.code}
                            onChange={e => setAssignForm({ ...assignForm, code: e.target.value.toUpperCase() })}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setAssignForm(f => ({ ...f, code: `REW-${Math.random().toString(36).substring(2, 8).toUpperCase()}` }))}
                          >
                            Gen
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Minimum Order (₹, Optional)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          placeholder="0 = No minimum"
                          value={assignForm.minOrder}
                          onChange={e => setAssignForm({ ...assignForm, minOrder: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expiry & Note */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={assignForm.expiry}
                        onChange={e => setAssignForm({ ...assignForm, expiry: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Personal Note / Message for Customer</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Exclusive gift from store management"
                        value={assignForm.notes}
                        onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                      />
                    </div>
                  </div>

                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Assign Reward
                  </button>
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
