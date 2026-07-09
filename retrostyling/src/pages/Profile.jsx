import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Heart, MapPin, CreditCard, Shield, Bell, 
  LogOut, Package, ChevronRight, Plus, Trash2, Edit2, Lock, 
  Smartphone, Check, X, Award, Share2, Eye, RefreshCw, Zap, ArrowLeft, ArrowRight, Star, Trophy
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { addressService, orderService, wishlistService, cartService, productService } from '../services/firestoreService';
import Toast from '../components/Toast';
import './Profile.css';

// Formatting helpers
const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── FLASH SALE TIMER ──────────────────────────────────────────
const FlashSaleTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 14, s: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flash-timer">
      <span>{pad(timeLeft.h)}</span>:<span>{pad(timeLeft.m)}</span>:<span>{pad(timeLeft.s)}</span>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const Profile = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, wishlist, address, payment, rewards, security, notifications
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Address sub-state
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false });

  // Payment mock state
  const [cards, setCards] = useState([
    { id: '1', brand: 'VISA', last4: '8842', exp: '12/28', isDefault: true, name: 'MUNEESWARAN P' },
    { id: '2', brand: 'MasterCard', last4: '1095', exp: '08/29', isDefault: false, name: 'MUNEESWARAN P' }
  ]);

  // Load user details
  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentUser) {
      loadData();
    } else {
      navigate('/login');
    }
  }, [currentUser]);

  const showMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [myOrders, wIds, cartItems, prods] = await Promise.all([
        orderService.getMyOrders(),
        wishlistService.get(),
        cartService.get(currentUser.uid),
        productService.getAll()
      ]);
      setOrders(myOrders);
      setAllProducts(prods);
      
      const wProds = await productService.getByIds(wIds);
      setWishlist(wProds);
      setCartCount(cartItems.reduce((acc, i) => acc + i.quantity, 0));
      
      // Load addresses
      setAddrLoading(true);
      const addrs = await addressService.get();
      setAddresses(addrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAddrLoading(false);
    }
  };

  // Remove from Wishlist
  const handleRemoveWishlist = async (id) => {
    try {
      await wishlistService.remove(id);
      setWishlist(prev => prev.filter(p => p.id !== id));
      showMsg('Removed from wishlist');
    } catch (err) {
      console.error(err);
    }
  };

  // Move from Wishlist to Cart
  const handleMoveToCart = async (product) => {
    try {
      const variant = product.variants?.[0] || null;
      await cartService.addItem(product, variant, 1);
      await wishlistService.remove(product.id);
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      setCartCount(prev => prev + 1);
      showMsg('Item moved to cart!');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to Cart Directly
  const handleAddToCart = async (product) => {
    try {
      const variant = product.variants?.[0] || null;
      await cartService.addItem(product, variant, 1);
      setCartCount(prev => prev + 1);
      showMsg('Added to cart!');
    } catch (err) {
      console.error(err);
    }
  };

  // Address Handlers
  const handleAddrSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAddrId) {
        await addressService.update(editingAddrId, addrForm);
        showMsg('Address updated successfully');
      } else {
        await addressService.add(addrForm);
        showMsg('New address added');
      }
      setShowAddrForm(false);
      const addrs = await addressService.get();
      setAddresses(addrs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddrDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressService.delete(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showMsg('Address deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddr = async (id) => {
    try {
      await addressService.setDefault(id);
      const addrs = await addressService.get();
      setAddresses(addrs);
      showMsg('Default address updated');
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action menu details
  const QUICK_ACTIONS = [
    { id: 'orders', title: 'My Orders', desc: `${orders.length} active order(s)`, icon: Package },
    { id: 'wishlist', title: 'Wishlist', desc: `${wishlist.length} item(s) saved`, icon: Heart },
    { id: 'address', title: 'Addresses', desc: `${addresses.length} saved location(s)`, icon: MapPin },
    { id: 'payment', title: 'Payments', desc: 'Manage credit cards & UPI', icon: CreditCard },
    { id: 'rewards', title: 'Rewards', desc: '750 points available', icon: Award },
    { id: 'notifications', title: 'Notifications', desc: 'Offers & order updates', icon: Bell },
    { id: 'security', title: 'Security', desc: 'Password & authentication', icon: Shield },
  ];

  const displayName = currentUser?.displayName || userProfile?.name || 'Muneeswaran P';
  const email = currentUser?.email || 'muneeswaranmd2004@gmail.com';

  return (
    <div className="my-account-page">
      {toast && <Toast text={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <div className="account-container container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span className="active">My Account</span>
        </div>

        {/* Welcome Section */}
        <div className="welcome-banner">
          <div className="welcome-profile-info">
            <div className="welcome-avatar-wrapper">
              <div className="welcome-avatar">{displayName.charAt(0)}</div>
              <div className="membership-badge-tag">VIP Gold</div>
            </div>
            <div>
              <h1 className="welcome-title">Welcome back, {displayName.split(' ')[0]} 👋</h1>
              <p className="welcome-subtitle">Manage your orders, wishlist, addresses, and profile all in one place.</p>
            </div>
          </div>
          <div className="points-luxury-summary">
            <div className="points-label">MEMBERSHIP BALANCE</div>
            <div className="points-value">750 <span className="points-suffix">PTS</span></div>
            <div className="points-footer">VIP Tier Progress: Gold Level</div>
          </div>
        </div>

        {/* Dynamic Render Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="overview">
              {/* Quick Actions Grid */}
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(act => (
                  <div key={act.id} className="quick-card" onClick={() => setActiveTab(act.id)}>
                    <div className="quick-card-icon"><act.icon size={22} /></div>
                    <div className="quick-card-info">
                      <h3>{act.title}</h3>
                      <p>{act.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="quick-card logout" onClick={async () => { await logout(); navigate('/login'); }}>
                  <div className="quick-card-icon"><LogOut size={22} /></div>
                  <div className="quick-card-info">
                    <h3>Log Out</h3>
                    <p>Securely log out of your account</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} key={activeTab}>
              <div className="tab-container-card">
                <button className="back-btn" onClick={() => setActiveTab('overview')}>
                  <ArrowLeft size={16} /> Back to Overview
                </button>

                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="tab-title">Order History</h2>
                    <p className="tab-subtitle">Track your shipments and view past invoices.</p>
                    {orders.length === 0 ? (
                      <div className="empty-state">
                        <Package size={48} className="empty-icon" />
                        <h3>No Orders Yet</h3>
                        <p>Items you buy will appear here. Start shopping our catalog.</p>
                        <Link to="/shop" className="btn btn-primary mt-4">Explore Shop</Link>
                      </div>
                    ) : (
                      <div className="orders-cards-list">
                        {orders.map(o => (
                          <div key={o.id} className="order-item-card">
                            <div className="order-item-header">
                              <div>
                                <span className="order-id-label">ORDER ID:</span>
                                <span className="order-id-val"> #{o.id.slice(-8).toUpperCase()}</span>
                              </div>
                              <div className="order-meta-info">
                                <span>Placed on {formatDate(o.createdAt)}</span>
                                <span className="sep">•</span>
                                <span className="order-price-val">₹{o.total?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="order-item-body">
                              <div className="order-products-mini">
                                {o.items?.map((item, idx) => (
                                  <div key={idx} className="mini-prod-row">
                                    <img src={item.image || 'https://via.placeholder.com/60x80'} alt={item.name} />
                                    <div>
                                      <h4>{item.name}</h4>
                                      <p className="text-muted text-sm">Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="order-tracking-timeline">
                                <div className="tracking-status-label">
                                  Status: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{o.orderStatus}</strong>
                                </div>
                                <div className="progress-bar-track">
                                  <div 
                                    className="progress-fill" 
                                    style={{ 
                                      width: o.orderStatus === 'delivered' ? '100%' : o.orderStatus === 'shipped' ? '65%' : o.orderStatus === 'processing' ? '35%' : '10%' 
                                    }}
                                  ></div>
                                </div>
                                <div className="tracking-steps-labels">
                                  <span className="active">Placed</span>
                                  <span className={['processing', 'shipped', 'delivered'].includes(o.orderStatus) ? 'active' : ''}>Processing</span>
                                  <span className={['shipped', 'delivered'].includes(o.orderStatus) ? 'active' : ''}>Shipped</span>
                                  <span className={o.orderStatus === 'delivered' ? 'active' : ''}>Delivered</span>
                                </div>
                              </div>
                            </div>
                            <div className="order-item-footer">
                              <button className="btn btn-outline btn-sm">Track Order</button>
                              <button className="btn btn-primary btn-sm" onClick={() => showMsg('Items added to cart! (Buy again)')}>Buy Again</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- WISHLIST TAB --- */}
                {activeTab === 'wishlist' && (
                  <div>
                    <div className="wishlist-header-row">
                      <div>
                        <h2 className="tab-title">My Wishlist ({wishlist.length})</h2>
                        <p className="tab-subtitle">Your curated selection of saved styles.</p>
                      </div>
                      <div className="wishlist-toolbar">
                        <button className="btn btn-ghost btn-sm" onClick={() => showMsg('Link copied to clipboard!')}><Share2 size={14} /> Share List</button>
                      </div>
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="empty-state">
                        <Heart size={48} className="empty-icon" />
                        <h3>Your Wishlist is Waiting</h3>
                        <p>Save your favorite styles and discover them later.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                          <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
                          <Link to="/shop?filter=new" className="btn btn-outline">Explore New Arrivals</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="wishlist-shop-grid">
                        {wishlist.map(prod => (
                          <div key={prod.id} className="shop-product-card">
                            <div className="prod-img-wrapper">
                              <img src={prod.image} alt={prod.name} className="main-img" />
                              {prod.on_sale && <span className="discount-tag">-{Math.round(((prod.price - prod.discount_price)/prod.price)*100)}%</span>}
                              <button className="remove-fav-btn" onClick={() => handleRemoveWishlist(prod.id)} title="Remove"><X size={15} /></button>
                              <div className="prod-actions-overlay">
                                <Link to={`/product/${prod.slug}`} className="overlay-act-btn"><Eye size={14} /></Link>
                              </div>
                            </div>
                            <div className="prod-info-block">
                              <div className="prod-brand">{prod.brand || 'RetroStylings'}</div>
                              <h3 className="prod-title-heading">{prod.name}</h3>
                              <div className="prod-prices">
                                {prod.on_sale ? (
                                  <>
                                    <span className="curr-price">₹{prod.discount_price}</span>
                                    <span className="orig-price">₹{prod.price}</span>
                                  </>
                                ) : (
                                  <span className="curr-price">₹{prod.price}</span>
                                )}
                              </div>
                              <button className="btn btn-primary btn-sm w-full mt-3" onClick={() => handleMoveToCart(prod)}>
                                <ShoppingBag size={14} /> Add to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- ADDRESSES TAB --- */}
                {activeTab === 'address' && (
                  <div>
                    <h2 className="tab-title">Address Book</h2>
                    <p className="tab-subtitle">Manage your shipping and billing delivery addresses.</p>

                    {showAddrForm ? (
                      <form className="address-form-box" onSubmit={handleAddrSave}>
                        <h3 className="sub-header-title">{editingAddrId ? 'Edit Address' : 'Add New Address'}</h3>
                        <div className="form-grid-row">
                          <div className="form-group-item">
                            <label>Address Type</label>
                            <select value={addrForm.type} onChange={e => setAddrForm({ ...addrForm, type: e.target.value })}>
                              <option value="Home">Home 🏠</option>
                              <option value="Work">Work 💼</option>
                              <option value="Other">Other 📍</option>
                            </select>
                          </div>
                          <div className="form-group-item">
                            <label>Contact Name</label>
                            <input required type="text" value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="E.g. Muneeswaran" />
                          </div>
                        </div>
                        <div className="form-group-item mt-3">
                          <label>Street Address</label>
                          <input required type="text" value={addrForm.street} onChange={e => setAddrForm({ ...addrForm, street: e.target.value })} placeholder="123 Street name, Building, Apartment" />
                        </div>
                        <div className="form-grid-row mt-3">
                          <div className="form-group-item">
                            <label>City</label>
                            <input required type="text" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="Mumbai" />
                          </div>
                          <div className="form-group-item">
                            <label>Zip/Postal Code</label>
                            <input required type="text" value={addrForm.zip} onChange={e => setAddrForm({ ...addrForm, zip: e.target.value })} placeholder="400001" />
                          </div>
                        </div>
                        <label className="checkbox-wrap mt-3">
                          <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                          Set as default delivery address
                        </label>
                        <div className="form-actions-buttons mt-4">
                          <button type="submit" className="btn btn-primary">Save Address</button>
                          <button type="button" className="btn btn-outline" onClick={() => setShowAddrForm(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="addresses-list-grid">
                        <div className="add-new-address-card" onClick={() => { setEditingAddrId(null); setAddrForm({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false }); setShowAddrForm(true); }}>
                          <Plus size={32} />
                          <span>Add New Address</span>
                        </div>
                        {addresses.map(a => (
                          <div key={a.id} className={`address-luxury-card ${a.isDefault ? 'default-active' : ''}`}>
                            <div className="card-header-badge">
                              <span className="badge badge-neutral">{a.type || 'Home'}</span>
                              {a.isDefault && <span className="default-indicator">Default</span>}
                            </div>
                            <h3 className="recipient-name">{a.name}</h3>
                            <p className="address-details">{a.street}, {a.city} - {a.zip}</p>
                            <div className="address-actions-panel">
                              <button onClick={() => { setEditingAddrId(a.id); setAddrForm(a); setShowAddrForm(true); }}><Edit2 size={13} /> Edit</button>
                              <button onClick={() => handleAddrDelete(a.id)} className="delete"><Trash2 size={13} /> Delete</button>
                              {!a.isDefault && <button onClick={() => handleSetDefaultAddr(a.id)} className="default-link">Set Default</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- PAYMENT METHODS TAB --- */}
                {activeTab === 'payment' && (
                  <div>
                    <h2 className="tab-title">Payment Methods</h2>
                    <p className="tab-subtitle">Manage your saved credit/debit cards and secure wallets.</p>
                    <div className="payments-cards-grid">
                      {cards.map(c => (
                        <div key={c.id} className="payment-credit-card">
                          <div className="card-top-row">
                            <span className="card-type-label">{c.brand.toUpperCase()}</span>
                            <CreditCard size={20} />
                          </div>
                          <div className="card-number-hidden">•••• •••• •••• {c.last4}</div>
                          <div className="card-bottom-row">
                            <div>
                              <span className="card-small-label">CARD HOLDER</span>
                              <span className="card-bold-val">{c.name}</span>
                            </div>
                            <div>
                              <span className="card-small-label">EXPIRES</span>
                              <span className="card-bold-val">{c.exp}</span>
                            </div>
                          </div>
                          <button className="remove-card-btn" onClick={() => { setCards(cards.filter(card => card.id !== c.id)); showMsg('Payment method removed'); }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <div className="add-payment-method-card" onClick={() => showMsg('Card addition feature coming soon!')}>
                        <Plus size={24} />
                        <span>Add New Card</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- REWARDS TAB --- */}
                {activeTab === 'rewards' && (
                  <div>
                    <div className="wishlist-header-row">
                      <div>
                        <h2 className="tab-title">VIP Member Rewards</h2>
                        <p className="tab-subtitle">Enjoy exclusive discounts, coupons, and premium tier privileges.</p>
                      </div>
                      <Link to="/rewards" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <Trophy size={14} /> Open Full Rewards Center
                      </Link>
                    </div>
                    
                    <div className="rewards-layout-panel">
                      {/* Luxury VIP membership card design */}
                      <div className="luxury-member-card">
                        <div className="lux-card-glow"></div>
                        <div className="lux-header">
                          <div className="lux-brand">RETROSTYLINGS</div>
                          <div className="lux-badge"><Award size={20} /> GOLD MEMBER</div>
                        </div>
                        <div className="lux-body">
                          <div className="lux-points-counter">750 <span className="lux-points-unit">PTS</span></div>
                          <div className="lux-holder-name">MUNEESWARAN P</div>
                        </div>
                        <div className="lux-footer">
                          <span>VIP ID: #RS-998842</span>
                          <span>Member Since: 2025</span>
                        </div>
                      </div>

                      <div className="rewards-details-content">
                        <h3>Tier Progress</h3>
                        <div className="tier-progress-container">
                          <div className="tier-progress-labels">
                            <span>Gold Tier</span>
                            <span>Platinum Tier (1000 Pts)</span>
                          </div>
                          <div className="progress-bar-track neon-theme">
                            <div className="progress-fill" style={{ width: '75%' }}></div>
                          </div>
                          <p className="tier-hint">You are only <strong>250 Points</strong> away from unlocking Platinum privileges (Free priority shipping & 15% flat store discounts).</p>
                        </div>

                        <h3 className="mt-4">Available Coupons</h3>
                        <div className="coupons-grid-panel">
                          <div className="reward-coupon-card">
                            <div className="coupon-left">
                              <h4>10%</h4>
                              <p>OFF</p>
                            </div>
                            <div className="coupon-right">
                              <h5>GOLDWELCOME</h5>
                              <p>Valid on all casual wear drops.</p>
                              <button className="btn btn-outline btn-xs" onClick={() => showMsg('Coupon copied to clipboard!')}>Copy Code</button>
                            </div>
                          </div>
                          <div className="reward-coupon-card">
                            <div className="coupon-left bg-secondary-theme">
                              <h4>₹500</h4>
                              <p>CASH</p>
                            </div>
                            <div className="coupon-right">
                              <h5>RETRO500</h5>
                              <p>On orders above ₹3,000.</p>
                              <button className="btn btn-outline btn-xs" onClick={() => showMsg('Coupon copied to clipboard!')}>Copy Code</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="tab-title">Notification Settings</h2>
                    <p className="tab-subtitle">Manage your preferred alert and alert update options.</p>
                    <div className="settings-lux-switches">
                      <div className="lux-switch-row">
                        <div>
                          <h4>Order Alerts</h4>
                          <p>Receive push notifications and SMS updates regarding shipping status.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <div className="lux-switch-row">
                        <div>
                          <h4>Exclusive Sales & Offers</h4>
                          <p>Stay updated on seasonal sales, promo codes, and loyalty drops.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <div className="lux-switch-row">
                        <div>
                          <h4>System Activity</h4>
                          <p>Receive alerts concerning security logs and account logins.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SECURITY TAB --- */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="tab-title">Security & Password</h2>
                    <p className="tab-subtitle">Update your credentials and enhance account protections.</p>
                    <div className="security-settings-box">
                      <form className="password-update-form" onSubmit={e => { e.preventDefault(); showMsg('Password updated!'); }}>
                        <div className="form-group-item">
                          <label>Current Password</label>
                          <input type="password" placeholder="••••••••" required />
                        </div>
                        <div className="form-group-item mt-3">
                          <label>New Password</label>
                          <input type="password" placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="btn btn-primary mt-4">Change Password</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FLASH SALE CAROUSEL ──────────────────────────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="flash-label-tag">
                <Zap size={14} fill="currentColor" /> FLASH SALE
              </div>
              <FlashSaleTimer />
            </div>
            <Link to="/shop?filter=sale" className="link-btn">View All <ChevronRight size={16}/></Link>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(0, 4).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RECOMMENDED FOR YOU (AI RECOMMENDATION) ───────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Recommended For You</h2>
            <p className="section-subtitle">Curated styles based on your shopping preferences</p>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(1, 5).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RECENTLY VIEWED ───────────────────────────────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Recently Viewed</h2>
            <p className="section-subtitle">Styles you viewed during this session</p>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(2, 6).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CONTINUE SHOPPING CATEGORIES ─────────────────────────── */}
        <section className="dashboard-section mt-5 mb-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Continue Shopping</h2>
            <p className="section-subtitle">Navigate through your favorite style categories</p>
          </div>
          <div className="categories-luxury-grid">
            {[
              { name: 'Oversized T-Shirts', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', slug: 't-shirts' },
              { name: 'Hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', slug: 'hoodies' },
              { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', slug: 'footwear' },
              { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', slug: 'accessories' }
            ].map(cat => (
              <Link to={`/shop?category=${cat.slug}`} key={cat.name} className="category-luxury-card">
                <img src={cat.image} alt={cat.name} className="img-cover" />
                <div className="category-overlay-content">
                  <h3>{cat.name}</h3>
                  <span className="shop-link-text">Shop Collection <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
