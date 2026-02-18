import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                <div className="footer-brand">
                    <h2 className="logo">RETROSTYLINGS</h2>
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
                        <li><a href="#">FAQ Information</a></li>
                        <li><a href="#">Return Policy</a></li>
                        <li><a href="#">Shipping & Delivery</a></li>
                        <li><a href="#">Order Tracking</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container bottom-flex">
                    <p className="copyright">&copy; 2026 RETROSTYLINGS. All Rights Reserved.</p>
                    <div className="payment-support">
                        <span>We Support</span>
                        <img src="https://codewithsadee.github.io/casmart/assets/images/payment-img.png" alt="Payment Methods" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
