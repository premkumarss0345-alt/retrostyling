import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Heart, MapPin, 
  CreditCard, Shield, Bell, LogOut, Package, 
  ChevronRight, Plus, Trash2, Edit2, Lock, Smartphone, Moon, Sun, Check, ExternalLink, X
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import './Profile.css';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { addressService, orderService, wishlistService, cartService, productService } from '../services/firestoreService';

// helper for date formatting
const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- SUB-COMPONENTS --- //

const DashboardTab = ({ setTab, orders = [], wishlist = [], cartCount = 0 }) => {
  const { currentUser, userProfile } = useAuth();
  const displayName = currentUser?.displayName || userProfile?.name || 'Retro Fashionista';
  const email = currentUser?.email || 'fashion@retro.com';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
      <div className="dash-profile-card">
        <div className="dash-avatar">{displayName.charAt(0)}</div>
        <div className="dash-info">
          <h2>Welcome back, {displayName}!</h2>
          <p>{email}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setTab('security')}>Edit Profile</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Package size={24} /></div>
          <div>
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Heart size={24} /></div>
          <div>
            <h3>{wishlist.length}</h3>
            <p>Wishlist Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShoppingBag size={24} /></div>
          <div>
            <h3>{cartCount}</h3>
            <p>Cart Items</p>
          </div>
        </div>
      </div>

      <div className="recent-orders-section">
        <div className="section-header">
          <h3>Recent Orders</h3>
          <button className="link-btn" onClick={() => setTab('orders')}>View All <ChevronRight size={16}/></button>
        </div>
        {orders.length === 0 ? (
          <div className="order-empty-state">No orders yet.</div>
        ) : (
          <div className="order-mini-list">
            {orders.slice(0, 3).map(o => (
              <div key={o.id} className="order-mini-card">
                <div className="mini-card-left">
                  <div className="order-icon"><Package size={20} /></div>
                  <div>
                    <h4>#{o.id.slice(-6).toUpperCase()}</h4>
                    <p>{formatDate(o.createdAt)}</p>
                  </div>
                </div>
                <div className="mini-card-right">
                  <p className="price">₹{o.total?.toLocaleString()}</p>
                  <span className={`status-pill pill-${o.orderStatus?.toLowerCase()}`}>{o.orderStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const OrdersTab = ({ orders = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
      <div className="section-header">
        <h2>Order History</h2>
        <p>Track your latest purchases and returns.</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>No orders placed yet.</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <React.Fragment key={o.id}>
                  <tr className="order-tr" onClick={() => toggleRow(o.id)}>
                    <td className="font-bold">#{o.id.slice(-6).toUpperCase()}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td className="font-bold">₹{o.total?.toLocaleString()}</td>
                    <td><span className={`status-pill pill-${o.orderStatus?.toLowerCase()}`}>{o.orderStatus}</span></td>
                    <td>
                      <button className="icon-btn-small">
                        <ChevronRight size={18} className={`chevron ${expandedRow === o.id ? 'rotate' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  {expandedRow === o.id && (
                    <tr className="order-expanded-tr">
                      <td colSpan="5">
                        <div className="order-detail-view">
                           <div className="items-list">
                             {o.items?.map((item, idx) => (
                               <div key={idx} className="order-item-mini">
                                  <img src={item.image} alt={item.name} />
                                  <div>
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm">Qty: {item.quantity} | Size: {item.size}</p>
                                  </div>
                               </div>
                             ))}
                           </div>
                           <div className="order-timeline">
                            <div className={`timeline-step active`}>
                              <div className="step-dot"><Check size={12}/></div>
                              <p>Order Placed</p>
                            </div>
                            <div className="timeline-line active"></div>
                            <div className={`timeline-step ${['processing', 'shipped', 'delivered'].includes(o.orderStatus) ? 'active' : ''}`}>
                              <div className="step-dot"><Package size={12}/></div>
                              <p>Processing</p>
                            </div>
                            <div className={`timeline-line ${['shipped', 'delivered'].includes(o.orderStatus) ? 'active' : ''}`}></div>
                            <div className={`timeline-step ${['shipped', 'delivered'].includes(o.orderStatus) ? 'active' : ''}`}>
                              <div className="step-dot"><MapPin size={12}/></div>
                              <p>Shipped</p>
                            </div>
                            <div className={`timeline-line ${['delivered'].includes(o.orderStatus) ? 'active' : ''}`}></div>
                            <div className={`timeline-step ${o.orderStatus === 'delivered' ? 'active' : o.orderStatus === 'cancelled' ? 'error' : ''}`}>
                              <div className="step-dot">{o.orderStatus === 'cancelled' ? <X size={12}/> : <Check size={12}/>}</div>
                              <p>{o.orderStatus?.charAt(0).toUpperCase() + o.orderStatus?.slice(1)}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

const WishlistTab = ({ wishlist = [], onRemove, onMoveToCart }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
       <div className="section-header">
        <h2>Your Wishlist</h2>
        <p>Items you've saved for later.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-state">
           <Heart size={48} />
           <p>Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map(w => (
            <div key={w.id} className="wishlist-card">
              <img src={w.image} alt={w.name} />
              <div className="wishlist-info">
                <h4>{w.name}</h4>
                <p>₹{w.price?.toLocaleString()}</p>
                <div className="wishlist-actions">
                  <button className="btn btn-primary btn-sm w-100" onClick={() => onMoveToCart(w)}>Move to Cart</button>
                  <button className="btn btn-outline btn-sm icon-mode" onClick={() => onRemove(w.id)}><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const AddressTab = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.get();
      setAddresses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await addressService.update(editingId, formData);
      } else {
        await addressService.add(formData);
      }
      setShowForm(false);
      loadAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressService.delete(id);
      loadAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      loadAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setFormData(addr);
    setShowForm(true);
  };

  if (loading) return <div className="tab-pane">Loading addresses...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
      <div className="flex-between mb-2">
        <div>
          <h2>Address Book</h2>
          <p>Manage your delivery addresses.</p>
        </div>
        {!showForm && <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={16}/> Add New</button>}
      </div>

      {showForm ? (
        <div className="settings-card">
          <h3>{editingId ? 'Edit Address' : 'New Address'}</h3>
          <form className="password-form" onSubmit={handleSave} style={{ maxWidth: '100%' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Address Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <label>Street Address</label>
              <input required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="123 Retro Avenue, Apt 4B" />
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>City</label>
                <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Mumbai" />
              </div>
              <div className="form-group">
                <label>Zip/Postal Code</label>
                <input required type="text" value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} placeholder="400001" />
              </div>
            </div>
            <div className="form-group flex-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData({...formData, isDefault: e.target.checked})} />
              <label htmlFor="isDefault" style={{ cursor: 'pointer' }}>Set as default address</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Save'} Address</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>No addresses saved yet.</div>
          ) : (
            addresses.map(a => (
              <div key={a.id} className={`address-card ${a.isDefault ? 'default' : ''}`}>
                {a.isDefault && <span className="default-badge">Default</span>}
                <div className="addr-header">
                  <h4>{a.type}</h4>
                  <div className="addr-actions">
                    <button onClick={() => openEdit(a)}><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(a.id)}><Trash2 size={16}/></button>
                  </div>
                </div>
                <p className="font-bold">{a.name}</p>
                <p>{a.street}</p>
                <p>{a.city}, {a.zip}</p>
                {!a.isDefault && (
                  <button className="link-btn" style={{ marginTop: '1rem', fontSize: '0.8rem' }} onClick={() => handleSetDefault(a.id)}>
                    Set as Default
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

const PaymentTab = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
      <div className="flex-between mb-2">
        <div>
          <h2>Payment Methods</h2>
          <p>Manage your saved cards.</p>
        </div>
        <button className="btn btn-primary btn-sm"><Plus size={16}/> Add Card</button>
      </div>

      <div className="cards-grid">
        {dummyCards.map(c => (
          <div key={c.id} className={`payment-card ${c.isDefault ? 'default' : ''}`}>
            <div className="card-chip"></div>
            <div className="card-brand">{c.brand}</div>
            <div className="card-number">**** **** **** {c.last4}</div>
            <div className="card-footer">
              <div>
                <span>EXP</span>
                <p>{c.exp}</p>
              </div>
              {c.isDefault && <span className="default-text">Default</span>}
            </div>
            <button className="card-delete"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const SecurityTab = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
      <div className="section-header">
        <h2>Security Settings</h2>
        <p>Keep your account secure.</p>
      </div>

      <div className="settings-card mb-2">
        <h3><Lock size={18} /> Change Password</h3>
        <form className="password-form" onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button className="btn btn-primary">Update Password</button>
        </form>
      </div>

      <div className="settings-card">
        <div className="flex-between align-center">
          <div>
            <h3><Smartphone size={18} /> Two-Factor Authentication</h3>
            <p className="text-sm">Add an extra layer of security to your account.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationsTab = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
       <div className="section-header">
        <h2>Notifications</h2>
        <p>Manage what we send to your inbox.</p>
      </div>

      <div className="settings-card">
        <div className="toggle-row">
          <div>
            <h4>Order Updates</h4>
            <p>Email notifications for order status changes.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
        <div className="divider"></div>
        <div className="toggle-row">
          <div>
            <h4>Promotional Offers</h4>
            <p>Get notified about sales and exclusive discounts.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
        <div className="divider"></div>
        <div className="toggle-row">
          <div>
            <h4>Account Activity</h4>
            <p>Security alerts and login notifications.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PROFILE PAGE --- //

const Profile = () => {
  const [activeTab, setActiveTab ]        = useState('dashboard');
  const [theme, setTheme]                 = useState('dark');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders]               = useState([]);
  const [wishlist, setWishlist]           = useState([]);
  const [cartCount, setCartCount]         = useState(0);
  const [loading, setLoading]             = useState(true);

  const { currentUser, logout } = useAuth();
  const navigate                = useNavigate();

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [o, wIds, cItems] = await Promise.all([
        orderService.getMyOrders(),
        wishlistService.get(),
        cartService.get(currentUser.uid)
      ]);

      setOrders(o);
      const wProducts = await productService.getByIds(wIds);
      setWishlist(wProducts);
      setCartCount(cItems.reduce((acc, i) => acc + i.quantity, 0));
    } catch (err) {
      console.error('Failed to load user data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWishlist = async (id) => {
    try {
      await wishlistService.remove(id);
      setWishlist(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      const variant = product.variants?.[0] || null;
      await cartService.addItem(product, variant, 1);
      await wishlistService.remove(product.id);
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      setCartCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={20} /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={20} /> },
    { id: 'address', label: 'Address Book', icon: <MapPin size={20} /> },
    { id: 'payment', label: 'Payment Methods', icon: <CreditCard size={20} /> },
    { id: 'security', label: 'Security', icon: <Shield size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  ];

  const renderContent = () => {
    if (loading) return <div className="tab-pane">Loading account data...</div>;
    
    switch (activeTab) {
      case 'dashboard': return <DashboardTab setTab={setActiveTab} orders={orders} wishlist={wishlist} cartCount={cartCount} />;
      case 'orders': return <OrdersTab orders={orders} />;
      case 'wishlist': return <WishlistTab wishlist={wishlist} onRemove={handleRemoveWishlist} onMoveToCart={handleMoveToCart} />;
      case 'address': return <AddressTab />;
      case 'payment': return <PaymentTab />;
      case 'security': return <SecurityTab />;
      case 'notifications': return <NotificationsTab />;
      default: return <DashboardTab setTab={setActiveTab} orders={orders} wishlist={wishlist} cartCount={cartCount} />;
    }
  };

  return (
    <div className="dashboard-page section">
      <div className="container">
        
        {/* Mobile menu toggle */}
        <div className="mobile-dash-header mobile-only">
          <h2>My Account</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? 'Close Menu' : 'Menu'}
          </button>
        </div>

        <div className="dash-unified-container">
          {/* Sidebar */}
          <aside className={`dash-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-brand desktop-only">
              <h3>My Account</h3>
            </div>
            
            <nav className="dash-nav">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className={`dash-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="dash-sidebar-footer">
              <button className="dash-nav-item theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
              <button className="dash-nav-item logout" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="dash-content-area">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
