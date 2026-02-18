import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import './BottomNav.css';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/shop', label: 'Shop', icon: Search },
        { path: '/wishlist', label: 'Wishlist', icon: Heart },
        { path: '/cart', label: 'Cart', icon: ShoppingBag },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="icon-wrapper">
                                <Icon size={24} />
                                {isActive && (
                                    <motion.div
                                        layoutId="bottom-nav-active"
                                        className="active-indicator"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className="bottom-nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
