import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Shirt,
    ShoppingBag,
    Users,
    Globe,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    Settings,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Products', icon: Shirt },
        { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/hero-slides', label: 'Hero Slides', icon: Globe },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="admin-layout">
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="mobile-overlay"
                    />
                )}
            </AnimatePresence>

            <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="admin-brand">
                    <div className="brand-logo">T</div>
                    <h2 className="brand-text">Retrostylings <span>ADMIN</span></h2>
                    <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="admin-nav">
                    <div className="nav-section-label">Main Menu</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Icon size={20} />
                                <span className="nav-label">{item.label}</span>
                                {isActive && <motion.div layoutId="active-pill" className="active-pill" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="admin-footer">
                    <Link to="/" className="nav-item">
                        <Globe size={20} />
                        <span className="nav-label">View Site</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span className="nav-label">Log Out</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="header-search">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Search anything..." />
                        </div>
                    </div>

                    <div className="header-right">
                        <button className="header-icon-btn">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>
                        <div className="admin-user-info">
                            <div className="user-avatar">AD</div>
                            <div className="user-details">
                                <span className="user-name">Admin User</span>
                                <span className="user-role">Super Admin</span>
                            </div>
                        </div>
                    </div>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="admin-content"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};

export default AdminLayout;
