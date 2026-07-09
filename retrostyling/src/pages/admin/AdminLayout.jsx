import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut,
  Search, Bell, Menu, X, ChevronDown, ChevronRight,
  Package, Tag, Layers, Image, Star, MessageSquare,
  BarChart2, TrendingUp, Megaphone, Globe, Boxes,
  Percent, FileText, Camera, Zap, Shield, Activity,
  Store, ArrowLeft, Plus, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import './AdminLayout.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { path: '/admin/products', label: 'Products', icon: Package },
      { path: '/admin/categories', label: 'Categories', icon: Layers },
      { path: '/admin/brands', label: 'Brands', icon: Tag },
      { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    label: 'Sales',
    items: [
      { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { path: '/admin/customers', label: 'Customers', icon: Users },
      { path: '/admin/coupons', label: 'Coupons', icon: Percent },
    ],
  },
  {
    label: 'Content',
    items: [
      { path: '/admin/hero-slides', label: 'Hero Slides', icon: SlidersHorizontal },
      { path: '/admin/banners', label: 'Banners', icon: Image },
      { path: '/admin/reviews', label: 'Reviews', icon: Star },
      { path: '/admin/media', label: 'Media Library', icon: Camera },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/admin/marketing', label: 'Marketing', icon: Megaphone },
      { path: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/admin/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/settings', label: 'Settings', icon: Settings },
      { path: '/admin/super-admin', label: 'Super Admin', icon: Shield },
    ],
  },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, userProfile } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const adminName = currentUser?.displayName || userProfile?.name || 'Admin';
  const adminRole = userProfile?.role === 'superadmin' ? 'Super Admin' : 'Administrator';
  const adminInitial = adminName.charAt(0).toUpperCase();

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -280, opacity: 0 },
  };

  const mockNotifications = [
    { id: 1, type: 'order', text: 'New order #ORD-2847 placed', time: '2m ago', unread: true },
    { id: 2, type: 'stock', text: '3 products running low on stock', time: '15m ago', unread: true },
    { id: 3, type: 'review', text: 'New review pending approval', time: '1h ago', unread: false },
    { id: 4, type: 'user', text: 'New customer registered', time: '3h ago', unread: false },
  ];

  return (
    <div className={`admin-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="admin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">R</div>
          {!isCollapsed && (
            <div className="brand-info">
              <h2 className="brand-name">Retrostylings</h2>
              <span className="brand-tag">Admin Panel</span>
            </div>
          )}
          <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="sidebar-quick-actions">
            <Link to="/admin/products?action=new" className="quick-action-btn">
              <Plus size={15} />
              <span>Add Product</span>
            </Link>
            <Link to="/" className="quick-action-btn">
              <Store size={15} />
              <span>View Store</span>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="nav-section">
              {!isCollapsed && (
                <span className="nav-section-label">{section.label}</span>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${active ? 'active' : ''}`}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nav-link-icon"><Icon size={18} /></span>
                    {!isCollapsed && <span className="nav-link-label">{item.label}</span>}
                    {active && !isCollapsed && (
                      <motion.div layoutId="nav-active-pill" className="nav-active-indicator" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{adminInitial}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{adminName}</span>
                <span className="sidebar-user-role">{adminRole}</span>
              </div>
            </div>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {/* Search */}
            <div className="topbar-search">
              <Search size={16} className="topbar-search-icon" />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
              {searchVal && (
                <button className="topbar-search-clear" onClick={() => setSearchVal('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="topbar-right">
            {/* View Store */}
            <Link to="/" className="topbar-icon-btn desktop-only" title="View Store">
              <Globe size={18} />
            </Link>

            {/* Notifications */}
            <div className="topbar-dropdown" ref={notifRef}>
              <button
                className="topbar-icon-btn notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                <span className="notif-badge">2</span>
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="notif-panel"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="notif-header">
                      <span>Notifications</span>
                      <button className="notif-mark-all">Mark all read</button>
                    </div>
                    <div className="notif-list">
                      {mockNotifications.map(n => (
                        <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                          <div className={`notif-dot ${n.unread ? 'active' : ''}`} />
                          <div className="notif-content">
                            <p>{n.text}</p>
                            <span>{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link to="/admin/notifications" className="notif-footer" onClick={() => setShowNotifications(false)}>
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="topbar-dropdown" ref={profileRef}>
              <button
                className="topbar-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">{adminInitial}</div>
                <div className="profile-info desktop-only">
                  <span className="profile-name">{adminName}</span>
                  <span className="profile-role">{adminRole}</span>
                </div>
                <ChevronDown size={14} className="desktop-only" />
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    className="profile-menu"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="profile-menu-header">
                      <strong>{adminName}</strong>
                      <span>{currentUser?.email}</span>
                    </div>
                    <div className="profile-menu-divider" />
                    <Link to="/admin/settings" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                      <Settings size={15} /> Settings
                    </Link>
                    <Link to="/admin/analytics" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                      <Activity size={15} /> Activity
                    </Link>
                    <Link to="/" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                      <Globe size={15} /> View Store
                    </Link>
                    <div className="profile-menu-divider" />
                    <button className="profile-menu-item danger" onClick={handleLogout}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <motion.div
          className="admin-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={location.pathname}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLayout;
