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
    Home,
    Sparkles,
    Package,
    HelpCircle,
    ArrowRight,
    Tag,
    Layers,
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../services/AuthContext';
import { categoryService, subcategoryService, cartService, announcementService } from '../services/firestoreService';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [expandedMobileCat, setExpandedMobileCat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentNotice, setCurrentNotice] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [notices, setNotices] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, userProfile, logout, isAdmin } = useAuth();

    async function loadNavigationData() {
        try {
            const [cats, subs, dynamicNotices] = await Promise.all([
                categoryService.getAll(),
                subcategoryService.getAll(),
                announcementService.getActive().catch(() => [])
            ]);
            setCategories(cats.filter(c => c.status === 'active').sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
            setSubcategories(subs.filter(s => s.status === 'active').sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
            setNotices(dynamicNotices || []);
        } catch (err) {
            console.error('Error fetching navigation data:', err);
        }
    }

    async function loadCartCount() {
        try {
            const items = await cartService.get(currentUser.uid);
            const count = items.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (err) {
            console.error('Error fetching cart count:', err);
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentNotice((prev) => (prev + 1) % notices.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [notices.length]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        loadNavigationData();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadCartCount();
        } else {
            setCartCount(0);
        }
    }, [currentUser, location.pathname]);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setIsProfileOpen(false);
    }, [location.pathname]);

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
                {notices && notices.length > 0 && (
                    <div className="notice-bar">
                        <AnimatePresence mode="wait">
                            {(() => {
                                const activeNotice = notices[currentNotice % notices.length];
                                const noticeText = typeof activeNotice === 'string' ? activeNotice : activeNotice?.text;
                                const noticeLink = typeof activeNotice === 'object' ? activeNotice?.link : null;
                                return (
                                    <motion.div
                                        key={currentNotice}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.5 }}
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                                    >
                                        {noticeLink ? (
                                            <Link to={noticeLink} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {noticeText}
                                            </Link>
                                        ) : (
                                            <p style={{ margin: 0 }}>
                                                {noticeText}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>
                )}

                <div className="main-nav-container">
                    <div className="container header-container">
                        <button className="mobile-toggle" onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
                            <Menu size={24} />
                        </button>

                        <Link to="/" className="logo">
                            <img src="/logo.png" alt="RETRO STYLINGS" className="nav-logo-img" />
                            <span className="logo-text">RETRO <span>STYLINGS</span></span>
                        </Link>

                        <nav className="desktop-nav">
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
                                            {categories.map(cat => {
                                                const catSubs = subcategories.filter(s => s.categoryId === cat.id);
                                                return (
                                                    <div key={cat.id} className="mega-column">
                                                        <Link to={`/shop/${cat.slug}`} className="mega-category-title">
                                                            {cat.image && <img src={cat.image} alt={cat.name} className="mega-cat-thumb" />}
                                                            <span>{cat.name}</span>
                                                            {cat.featured && <span className="mega-tag-hot">HOT</span>}
                                                        </Link>
                                                        <ul>
                                                            {catSubs.map(sub => (
                                                                <li key={sub.id}>
                                                                    <Link to={`/shop/${cat.slug}/${sub.slug}`}>
                                                                        {sub.name}
                                                                        {sub.featured && <span className="sub-dot-star">•</span>}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                            {catSubs.length === 0 && (
                                                                <li>
                                                                    <Link to={`/shop/${cat.slug}`} className="mega-view-all">Browse Collection</Link>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </nav>

                        <div className="header-actions desktop-only">
                            <button className="action-btn desktop-only" onClick={() => setIsSearchOpen(true)} aria-label="Search">
                                <Search size={20} />
                            </button>

                            <Link to="/wishlist" className="action-btn desktop-only action-wishlist-btn" aria-label="Wishlist">
                                <Heart size={20} />
                            </Link>

                            <Link to="/cart" className="action-btn desktop-only" aria-label="Cart">
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
                        <motion.aside
                            className="mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                        >
                            {/* Drawer Header */}
                            <div className="drawer-header">
                                <Link to="/" className="drawer-logo" onClick={() => setIsMenuOpen(false)}>
                                    <img src="/logo.png" alt="RETRO STYLINGS" className="nav-logo-img" />
                                    <span className="logo-text">RETRO <span>STYLINGS</span></span>
                                </Link>
                                <button className="drawer-close-btn" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Container */}
                            <div className="drawer-scroll-content">
                                {/* User Account Pill / Quick Auth */}
                                {currentUser ? (
                                    <div className="drawer-user-card">
                                        <div className="drawer-user-avatar">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="drawer-user-info">
                                            <span className="drawer-user-name">{userName}</span>
                                            <span className="drawer-user-email">{currentUser.email}</span>
                                        </div>
                                        <Link
                                            to={isAdmin ? "/admin" : "/profile"}
                                            className="drawer-user-badge"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {isAdmin ? 'Admin' : 'Account'} →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="drawer-guest-card">
                                        <div>
                                            <p className="drawer-guest-title">Welcome to Retro Stylings</p>
                                            <p className="drawer-guest-sub">Exclusive drops & member perks</p>
                                        </div>
                                        <Link
                                            to="/login"
                                            className="drawer-login-btn"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Sign In <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                )}

                                {/* Search Bar */}
                                <div className="drawer-search">
                                    <form onSubmit={handleSearch}>
                                        <Search size={18} className="drawer-search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search drops, tees, hoodies..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button type="button" onClick={() => setSearchTerm('')} className="drawer-search-clear">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </form>
                                </div>

                                {/* Main Navigation Section */}
                                <div className="drawer-section">
                                    <div className="drawer-section-label">Menu</div>
                                    <ul className="drawer-nav-list">
                                        <li>
                                            <Link to="/" onClick={() => setIsMenuOpen(false)} className={`drawer-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                                                <span className="drawer-nav-icon"><Home size={18} /></span>
                                                <span className="drawer-nav-text">Home</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/shop" onClick={() => setIsMenuOpen(false)} className={`drawer-nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>
                                                <span className="drawer-nav-icon"><ShoppingBag size={18} /></span>
                                                <span className="drawer-nav-text">Shop All</span>
                                                <span className="drawer-badge-pulse">HOT</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className={`drawer-nav-link ${location.pathname === '/wishlist' ? 'active' : ''}`}>
                                                <span className="drawer-nav-icon"><Heart size={18} /></span>
                                                <span className="drawer-nav-text">Wishlist</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/rewards" onClick={() => setIsMenuOpen(false)} className={`drawer-nav-link ${location.pathname === '/rewards' ? 'active' : ''}`}>
                                                <span className="drawer-nav-icon"><Sparkles size={18} /></span>
                                                <span className="drawer-nav-text">Rewards & Offers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/track-order" onClick={() => setIsMenuOpen(false)} className={`drawer-nav-link ${location.pathname === '/track-order' ? 'active' : ''}`}>
                                                <span className="drawer-nav-icon"><Package size={18} /></span>
                                                <span className="drawer-nav-text">Track Order</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* Categories Accordion Section */}
                                <div className="drawer-section">
                                    <div className="drawer-section-label">
                                        <span>Browse Collections</span>
                                        <span className="drawer-cat-count">{categories.length}</span>
                                    </div>
                                    <div className="drawer-categories-list">
                                        {categories.map(cat => {
                                            const catSubs = subcategories.filter(s => s.categoryId === cat.id);
                                            const isExpanded = expandedMobileCat === cat.id;
                                            const displayName = (cat.name || '').replace(/_/g, ' ');

                                            return (
                                                <div key={cat.id} className={`drawer-cat-item ${isExpanded ? 'expanded' : ''}`}>
                                                    <div
                                                        className="drawer-cat-header"
                                                        onClick={() => {
                                                            if (catSubs.length > 0) {
                                                                setExpandedMobileCat(isExpanded ? null : cat.id);
                                                            } else {
                                                                navigate(`/shop/${cat.slug}`);
                                                                setIsMenuOpen(false);
                                                            }
                                                        }}
                                                    >
                                                        <div className="drawer-cat-title-wrap">
                                                            {cat.image ? (
                                                                <img src={cat.image} alt={displayName} className="drawer-cat-thumb" />
                                                            ) : (
                                                                <span className="drawer-cat-bullet" />
                                                            )}
                                                            <Link
                                                                to={`/shop/${cat.slug}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsMenuOpen(false);
                                                                }}
                                                                className="drawer-cat-name"
                                                            >
                                                                {displayName}
                                                            </Link>
                                                        </div>

                                                        {catSubs.length > 0 ? (
                                                            <button
                                                                type="button"
                                                                className="drawer-accordion-toggle"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedMobileCat(isExpanded ? null : cat.id);
                                                                }}
                                                                aria-label={`Toggle ${displayName} subcategories`}
                                                            >
                                                                <ChevronDown size={16} className={`drawer-chevron ${isExpanded ? 'rotated' : ''}`} />
                                                            </button>
                                                        ) : (
                                                            <ArrowRight size={14} className="drawer-cat-direct" />
                                                        )}
                                                    </div>

                                                    {isExpanded && catSubs.length > 0 && (
                                                        <motion.ul
                                                            className="drawer-subs-list"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            {catSubs.map(sub => (
                                                                <li key={sub.id}>
                                                                    <Link
                                                                        to={`/shop/${cat.slug}/${sub.slug}`}
                                                                        onClick={() => setIsMenuOpen(false)}
                                                                        className="drawer-sub-link"
                                                                    >
                                                                        <span>{(sub.name || '').replace(/_/g, ' ')}</span>
                                                                        {sub.featured && <span className="drawer-sub-hot">★</span>}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                            <li>
                                                                <Link
                                                                    to={`/shop/${cat.slug}`}
                                                                    onClick={() => setIsMenuOpen(false)}
                                                                    className="drawer-sub-all"
                                                                >
                                                                    Explore All {displayName} →
                                                                </Link>
                                                            </li>
                                                        </motion.ul>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Support & Info Section */}
                                <div className="drawer-section">
                                    <div className="drawer-section-label">Help & Company</div>
                                    <ul className="drawer-nav-list secondary">
                                        <li>
                                            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="drawer-nav-link">
                                                <span className="drawer-nav-icon"><Layers size={16} /></span>
                                                <span className="drawer-nav-text">About Retrostylings</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="drawer-nav-link">
                                                <span className="drawer-nav-icon"><HelpCircle size={16} /></span>
                                                <span className="drawer-nav-text">Contact & Support</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/return-policy" onClick={() => setIsMenuOpen(false)} className="drawer-nav-link">
                                                <span className="drawer-nav-icon"><Tag size={16} /></span>
                                                <span className="drawer-nav-text">Return & Exchange Policy</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* Drawer Footer */}
                                <div className="drawer-footer-content">
                                    {currentUser ? (
                                        <button className="drawer-logout-btn" onClick={handleLogout}>
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    ) : (
                                        <div className="drawer-tagline">
                                            ⚡ RETRO STYLINGS • STREETWEAR CULTURE
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
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
