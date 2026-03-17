import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    Heart,
    ShoppingBag,
    User,
    Menu,
    X,
    ChevronDown,
    LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../services/AuthContext';
import { categoryService, cartService } from '../services/firestoreService';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentNotice, setCurrentNotice] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, userProfile, logout, isAdmin } = useAuth();

    const notices = [
        "🎉 FREE SHIPPING ON ALL ORDERS ABOVE ₹999",
        "🔥 SUMMER CLEARANCE: UP TO 50% OFF",
        "🚀 NEW DROPS EVERY FRIDAY - STAY TUNED",
        "✨ USE CODE 'RETRO10' FOR EXTRA 10% DISCOUNT"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentNotice((prev) => (prev + 1) % notices.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [notices.length]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        loadCategories();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadCartCount();
        } else {
            setCartCount(0);
        }
    }, [currentUser, location.pathname]); // Update count on page change as well

    useEffect(() => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setIsProfileOpen(false);
    }, [location.pathname]);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const loadCartCount = async () => {
        try {
            const items = await cartService.get(currentUser.uid);
            const count = items.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (err) {
            console.error('Error fetching cart count:', err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/shop?search=${searchTerm}`);
            setIsSearchOpen(false);
            setSearchTerm('');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'HOME', path: '/' },
        { name: 'SHOP', path: '/shop' },
        { name: 'ABOUT', path: '/about' }
    ];

    const userName = currentUser?.displayName || userProfile?.name || 'User';

    return (
        <>
            <header className={`header-wrapper ${isScrolled ? 'sticky' : ''}`}>
                <div className="notice-bar">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentNotice}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                        >
                            {notices[currentNotice]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <div className="main-nav-container">
                    <div className="container header-container">
                        <button className="mobile-toggle" onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
                            <Menu size={24} />
                        </button>

                        <Link to="/" className="logo">
                            RETRO<span>STYLINGS</span>
                        </Link>

                        <nav className="desktop-nav desktop-only">
                            <ul className="nav-links">
                                {navLinks.map((link) => (
                                    <li key={link.name}>
                                        <Link to={link.path} className={location.pathname === link.path ? 'active' : ''}>
                                            {link.name}
                                            {location.pathname === link.path && (
                                                <motion.div
                                                    layoutId="active-nav"
                                                    className="active-indicator"
                                                    transition={{ type: 'spring', duration: 0.6 }}
                                                />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                                <li className="dropdown-parent">
                                    <span className="nav-item">
                                        CATEGORIES <ChevronDown size={14} />
                                    </span>
                                    <div className="mega-dropdown">
                                        <div className="mega-grid">
                                            <div className="mega-column">
                                                <h4>Collections</h4>
                                                <ul>
                                                    {categories.map(cat => (
                                                        <li key={cat.id}>
                                                            <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="mega-column">
                                                <h4>Highlights</h4>
                                                <ul>
                                                    <li><Link to="/shop" style={{ color: 'var(--primary)' }}>Clearance Sale</Link></li>
                                                    <li><Link to="/shop">New Arrivals</Link></li>
                                                    <li><Link to="/shop">Best Sellers</Link></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </nav>

                        <div className="header-actions">
                            <button className="action-btn desktop-only" onClick={() => setIsSearchOpen(true)}>
                                <Search size={20} />
                            </button>

                            <Link to="/wishlist" className="action-btn desktop-only">
                                <Heart size={20} />
                            </Link>

                            <Link to="/cart" className="action-btn">
                                <ShoppingBag size={20} />
                                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                            </Link>

                            <div className="user-profile desktop-only">
                                {currentUser ? (
                                    <div className="profile-container" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                        <div className="nav-avatar">{userName.charAt(0).toUpperCase()}</div>
                                        <AnimatePresence>
                                            {isProfileOpen && (
                                                <motion.div
                                                    className="user-menu"
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 15 }}
                                                >
                                                    <div className="user-menu-header">
                                                        <p>Connected as</p>
                                                        <strong>{userName}</strong>
                                                    </div>
                                                    <Link to="/profile">My Orders</Link>
                                                    {isAdmin && <Link to="/admin" className="admin-tag">Admin Hub</Link>}
                                                    <button onClick={handleLogout} className="logout-btn">
                                                        <LogOut size={16} /> SIGN OUT
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link to="/login" className="action-btn" title="Sign In">
                                        <User size={20} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            className="menu-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            className="mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="drawer-header">
                                <Link to="/" className="logo">RETRO<span>STYLINGS</span></Link>
                                <button onClick={() => setIsMenuOpen(false)}><X size={28} /></button>
                            </div>

                            <div className="drawer-search">
                                <form onSubmit={handleSearch}>
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </form>
                            </div>

                            <nav className="mobile-nav">
                                <ul>
                                    {navLinks.map(link => (
                                        <li key={link.name}><Link to={link.path}>{link.name}</Link></li>
                                    ))}
                                    <li className="mobile-cat-header">Product Categories</li>
                                    {categories.map(cat => (
                                        <li key={cat.id} className="mobile-cat-item">
                                            <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
                                        </li>
                                    ))}
                                    <li><Link to="/contact">Support</Link></li>
                                </ul>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        className="full-search-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button className="close-search-btn" onClick={() => setIsSearchOpen(false)}>
                            <X size={32} />
                        </button>
                        <div className="search-container">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="EXPLORE RETRO..."
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit">SEARCH NOW</button>
                            </form>
                            <div className="search-hints">
                                <p>Popular Tags</p>
                                <div className="hints-grid">
                                    <span>Streetwear</span>
                                    <span>Vintage</span>
                                    <span>Accessories</span>
                                    <span>Summer Sale</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
