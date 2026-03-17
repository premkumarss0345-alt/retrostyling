import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="contact-page">
            <section className="contact-hero section">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-header centered"
                    >
                        <span className="subtitle">Get In Touch</span>
                        <h1 className="h1">CONTACT <span className="text-primary">US</span></h1>
                        <p className="text-dim">Have a question or feedback? We'd love to hear from you.</p>
                    </motion.div>
                </div>
            </section>

            <section className="contact-content section">
                <div className="container">
                    <div className="contact-grid">
                        {/* ℹ️ Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="contact-info"
                        >
                            <div className="info-card">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <Mail size={24} />
                                    </div>
                                    <div className="info-text">
                                        <h4>Email Us</h4>
                                        <p>support@retrostylings.com</p>
                                        <p>info@retrostylings.com</p>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <Phone size={24} />
                                    </div>
                                    <div className="info-text">
                                        <h4>Call Us</h4>
                                        <p>+91 98765 43210</p>
                                        <p>Monday - Saturday, 10am - 7pm</p>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="info-text">
                                        <h4>Visit Us</h4>
                                        <p>123 Fashion Street, Design Hub</p>
                                        <p>Chennai, Tamil Nadu, India</p>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-socials">
                                <h3>Follow Us</h3>
                                <div className="social-pills">
                                    <a href="#" className="social-pill">Instagram</a>
                                    <a href="#" className="social-pill">Facebook</a>
                                    <a href="#" className="social-pill">Twitter</a>
                                </div>
                            </div>
                        </motion.div>

                        {/* ✉️ Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="contact-form-wrapper"
                        >
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        name="message"
                                        rows="5"
                                        placeholder="Your message here..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className={`submit-btn ${status === 'success' ? 'success' : ''}`}
                                    disabled={status === 'sending'}
                                >
                                    {status === 'sending' ? (
                                        'Sending...'
                                    ) : status === 'success' ? (
                                        'Message Sent!'
                                    ) : (
                                        <>
                                            Send Message <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 🗺️ FAQ or Map Section can be added here */}
        </div>
    );
};

export default Contact;
