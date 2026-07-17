import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                <div className="footer-brand">
                    <p className="footer-desc">
                        Elevating everyday essentials with a focus on quality, comfort, and timeless style. Discover the perfect blend of tradition and modernity.
                    </p>
                    <div className="social-links">
                        <a href="#"><Facebook size={20} /></a>
                        <a href="#"><Twitter size={20} /></a>
                        <a href="#"><Instagram size={20} /></a>
                        <a href="#"><Linkedin size={20} /></a>
                    </div>
                </div>

                <div className="footer-links">
                    <h3>INFORMATION</h3>
                    <ul>
                        <li><Link to="/about">About Company</Link></li>
                        <li><a href="#">Payment Type</a></li>
                        <li><a href="#">Award Winning</a></li>
                        <li><a href="#">World Media Partner</a></li>
                        <li><a href="#">Become an Agent</a></li>
                    </ul>
                </div>

                <div className="footer-links">
                    <h3>CATEGORY</h3>
                    <ul>
                        <li><a href="#">Handbags & Wallets</a></li>
                        <li><a href="#">Women's Clothing</a></li>
                        <li><a href="#">Plus Sizes</a></li>
                        <li><a href="#">Complete Your Look</a></li>
                        <li><a href="#">Baby Corner</a></li>
                    </ul>
                </div>

                <div className="footer-links">
                    <h3>HELP & SUPPORT</h3>
                    <ul>
                        <li><a href="#">Dealers & Agents</a></li>
                        <li><Link to="/return-policy">FAQ Information</Link></li>
                        <li><Link to="/return-policy">Return Policy</Link></li>
                        <li><Link to="/shipping-info">Shipping & Delivery</Link></li>
                        <li><Link to="/track-order">Order Tracking</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container bottom-flex">
                    <p className="copyright">&copy; 2026 RETROSTYLINGS. All Rights Reserved.</p>
                    <div className="payment-support">
                        <span>We Support</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* Visa */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', height: '24px', boxSizing: 'border-box' }}>
                                <svg width="32" height="10" viewBox="0 0 32 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.15 9.77L11.77 0.3H14.36L12.74 9.77H10.15ZM19.26 3.65C18.66 3.37 17.76 3.1 16.71 3.1C14.16 3.1 12.36 4.39 12.34 6.24C12.32 7.6 13.6 8.35 14.57 8.8C15.57 9.27 15.9 9.57 15.9 9.99C15.89 10.63 15.1 10.9 14.33 10.9C13.06 10.9 12.28 10.53 11.69 10.27L11.23 12.28C11.81 12.53 13.01 12.75 14.25 12.75C16.94 12.75 18.7 11.48 18.73 9.51C18.75 8.24 17.94 7.51 16.42 6.81C15.42 6.32 14.92 6.01 14.93 5.48C14.93 4.99 15.5 4.46 16.64 4.46C17.58 4.45 18.3 4.69 18.8 4.92L19.26 3.65ZM24.47 6.45C24.47 6.45 25.43 3.82 25.49 3.66C25.5 3.69 24.47 6.45 24.47 6.45ZM26.49 0.3H24.51C23.9 0.3 23.4 0.64 23.16 1.18L19.78 8.9L22.42 8.9L22.95 7.53H26.17L26.48 8.9H29.1L26.49 0.3ZM6.44 0.3L3.92 6.78L3.65 1.41C3.53 0.81 3.03 0.3 2.4 0.3H0.03L0 0.44C0.49 0.54 1.05 0.74 1.39 0.92C1.6 1.03 1.66 1.14 1.73 1.39L2.89 8.9L5.59 8.9L9.71 0.3H6.44Z" fill="#fff" transform="scale(0.8) translate(0, 1)"/>
                                </svg>
                            </div>
                            {/* Mastercard */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', height: '24px', boxSizing: 'border-box' }}>
                                <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="7.5" cy="7.5" r="6" fill="#EB001B"/>
                                    <circle cx="16.5" cy="7.5" r="6" fill="#F79E1B" fillOpacity="0.85"/>
                                </svg>
                            </div>
                            {/* UPI */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0 8px', display: 'flex', alignItems: 'center', height: '24px', boxSizing: 'border-box', fontSize: '0.6rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px', fontFamily: 'sans-serif' }}>
                                UPI
                            </div>
                            {/* Razorpay */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0 8px', display: 'flex', alignItems: 'center', height: '24px', boxSizing: 'border-box', fontSize: '0.58rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '0.5px', fontFamily: 'sans-serif' }}>
                                RAZORPAY
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
