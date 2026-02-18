import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Heart,
    ShoppingBag,
    User,
    Menu,
    X,
    ChevronDown,
    Phone,
    Facebook,
    Instagram,
    Twitter,
    LogOut
} from 'lucide-react';
import './Navbar.css';  

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        fetchCategories();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className={`header-wrapper ${isScrolled ? 'sticky' : ''}`}>
            {/* 🔝 Top Bar */}
            <div className="top-bar">
                <div className="container top-bar-content">
                    <div className="top-bar-left">
                        <span className="promo-text">🎉 Free Shipping on Orders Above ₹999</span>
                    </div>
                    <div className="top-bar-right">
                        <a href="tel:+919876543210" className="contact-link">
                            <Phone size={14} /> +91 98765 43210
                        </a>
                        <div className="social-links-nav">
                            <Facebook size={14} />
                            <Instagram size={14} />
                            <Twitter size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 🧭 Main Navigation */}
            <div className="main-header">
                <div className="container header-container">

                    {/* Left: Logo */}
                    <Link to="/" className="logo">
                        RETROSTYLINGS
                    </Link>

                    {/* Center: Links */}
                    <nav className={`navbar ${isMenuOpen ? 'open' : ''}`}>
                        <ul className="navbar-list">
                            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>HOME</Link></li>
                            <li><Link to="/shop" onClick={() => setIsMenuOpen(false)}>SHOP</Link></li>
                            <li className="dropdown-root">
                                <span className="nav-link">
                                    CATEGORIES <ChevronDown size={14} />
                                </span>
                                <ul className="dropdown-menu">
                                    {categories.map(cat => (
                                        <li key={cat.id}>
                                            <Link to={`/category/${cat.slug}`} onClick={() => setIsMenuOpen(false)}>
                                                {cat.name}
                                            </Link>
                                        </li>
                                    ))}
                                    <li><hr /></li>
                                    <li><Link to="/shop?sale=true" onClick={() => setIsMenuOpen(false)} className="sale-link">SALE</Link></li>
                                    <li><Link to="/shop?new=true" onClick={() => setIsMenuOpen(false)} className="new-link">NEW ARRIVALS</Link></li>
                                </ul>
                            </li>
                            <li><Link to="/about" onClick={() => setIsMenuOpen(false)}>ABOUT</Link></li>
                            <li><Link to="/blog" onClick={() => setIsMenuOpen(false)}>BLOG</Link></li>
                            <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>CONTACT</Link></li>
                        </ul>
                    </nav>

                    {/* Right: User Actions */}
                    <div className="header-actions">
                        <button
                            className="action-icon-btn"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            title="Search"
                        >
                            <Search size={22} />
                        </button>

                        <Link to="/wishlist" className="action-icon-btn" title="Wishlist">
                            <div className="icon-badge-root">
                                <Heart size={22} />
                                <span className="badge-count">2</span>
                            </div>
                        </Link>

                        <Link to="/cart" className="action-icon-btn" title="Cart">
                            <div className="icon-badge-root">
                                <ShoppingBag size={22} />
                                <span className="badge-count green">3</span>
                            </div>
                        </Link>

                        <div className="user-profile-root">
                            {user ? (
                                <div className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                    <div className="avatar-small">{user.name.charAt(0)}</div>
                                    <ChevronDown size={14} />
                                    {isProfileOpen && (
                                        <ul className="profile-dropdown">
                                            <li className="dropdown-header">Hello, {user.name}</li>
                                            <li><Link to="/profile" onClick={() => setIsProfileOpen(false)}>My Orders</Link></li>
                                            <li><Link to="/profile" onClick={() => setIsProfileOpen(false)}>Profile Details</Link></li>
                                            {user.role === 'admin' && <li><Link to="/admin" onClick={() => setIsProfileOpen(false)}>Admin Panel</Link></li>}
                                            <li><hr /></li>
                                            <li onClick={handleLogout} className="logout-btn">
                                                <LogOut size={16} /> Logout
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="login-link-nav">
                                    <User size={22} />
                                    <span>Sign In</span>
                                </Link>
                            )}
                        </div>

                        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔍 Search Overlay */}
            <div className={`search-overlay ${isSearchOpen ? 'active' : ''}`}>
                <div className="container">
                    <form className="search-overlay-form" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="SEARCH FOR PRODUCTS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus={isSearchOpen}
                        />
                        <button type="submit"><Search size={24} /></button>
                        <button type="button" onClick={() => setIsSearchOpen(false)} className="close-search">
                            <X size={24} />
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
