import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contactService } from '../services/firestoreService';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';
import './Contact.css';

const FAQS = [
    {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery. Items must be unused, unwashed, and in original packaging with all tags intact.',
    },
    {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 4–7 business days across India. Express shipping (2–3 days) is available at checkout.',
    },
    {
        q: 'Do you offer Cash on Delivery?',
        a: 'Yes! Cash on Delivery (COD) is available for orders across India. Pay when you receive your package.',
    },
    {
        q: 'How do I track my order?',
        a: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track it from My Orders in your account.',
    },
    {
        q: 'Can I exchange a product?',
        a: 'Yes, exchanges are accepted within 7 days of delivery for a different size or colour, subject to availability.',
    },
];

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [openFaq, setOpenFaq] = useState(null);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            // 1. Save to Firestore
            await contactService.submit(formData);

            // 2. Send auto-reply email via backend
            try {
                await fetch(`${API_BASE_URL}/api/email/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerName:  formData.name,
                        customerEmail: formData.email,
                        subject:       formData.subject,
                        message:       formData.message,
                    }),
                });
            } catch (emailErr) {
                // Email failure shouldn't block the user-facing success
                console.warn('Auto-reply email failed:', emailErr.message);
            }

            setStatus('success');
            setToast({
                show: true,
                message: "Message sent! We'll get back to you within 24–48 hours.",
                type: 'success',
            });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
            setToast({ show: true, message: 'Failed to send message. Please try again.', type: 'error' });
        }
    };

    return (
        <div className="contact-page">

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="contact-hero">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="contact-hero-inner"
                    >
                        <span className="contact-eyebrow">Get In Touch</span>
                        <h1 className="contact-title">
                            Contact <span className="text-primary">Us</span>
                        </h1>
                        <p className="contact-subtitle">
                            Have a question, feedback, or need support?<br />
                            We're here to help — Monday to Saturday, 9AM–6PM IST.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Info + Form ───────────────────────────────────────────── */}
            <section className="contact-main section">
                <div className="container">
                    <div className="contact-grid">

                        {/* Info column */}
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="contact-info-col"
                        >
                            <div className="contact-info-card">
                                {[
                                    {
                                        icon: <Mail size={20} />,
                                        label: 'Email Us',
                                        lines: ['retrostylings@retrostylings.in'],
                                        href: 'mailto:retrostylings@retrostylings.in',
                                    },
                                    {
                                        icon: <Phone size={20} />,
                                        label: 'Call Us',
                                        lines: ['+91 98765 43210', 'Mon–Sat, 9AM–6PM IST'],
                                        href: 'tel:+919876543210',
                                    },
                                    {
                                        icon: <MapPin size={20} />,
                                        label: 'Location',
                                        lines: ['Chennai, Tamil Nadu', 'India'],
                                    },
                                    {
                                        icon: <Clock size={20} />,
                                        label: 'Working Hours',
                                        lines: ['Mon–Sat: 9AM–6PM IST', 'Sunday: Closed'],
                                    },
                                ].map((item, i) => (
                                    <div className="ci-item" key={i}>
                                        <div className="ci-icon">{item.icon}</div>
                                        <div className="ci-body">
                                            <div className="ci-label">{item.label}</div>
                                            {item.lines.map((line, j) =>
                                                j === 0 && item.href
                                                    ? <a key={j} href={item.href} className="ci-link">{line}</a>
                                                    : <p key={j} className="ci-text">{line}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social links */}
                            <div className="contact-social-block">
                                <p className="social-label">Follow Us</p>
                                <div className="social-row">
                                    {[
                                        { name: 'Instagram', href: 'https://instagram.com/retrostylings' },
                                        { name: 'Facebook',  href: 'https://facebook.com/retrostylings' },
                                        { name: 'X',         href: 'https://twitter.com/retrostylings' },
                                        { name: 'YouTube',   href: 'https://youtube.com/@retrostylings' },
                                    ].map(s => (
                                        <a key={s.name} href={s.href}
                                           target="_blank" rel="noopener noreferrer"
                                           className="social-chip">
                                            {s.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Form column */}
                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="contact-form-col"
                        >
                            <div className="contact-form-card">
                                <div className="form-card-header">
                                    <MessageSquare size={20} />
                                    <span>Send us a message</span>
                                </div>

                                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="cf-name">Full Name</label>
                                            <input
                                                id="cf-name" type="text" name="name"
                                                placeholder="Muneeswaran R"
                                                value={formData.name}
                                                onChange={handleChange} required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="cf-email">Email Address</label>
                                            <input
                                                id="cf-email" type="email" name="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={handleChange} required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="cf-subject">Subject</label>
                                        <input
                                            id="cf-subject" type="text" name="subject"
                                            placeholder="How can we help you?"
                                            value={formData.subject}
                                            onChange={handleChange} required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="cf-message">Message</label>
                                        <textarea
                                            id="cf-message" name="message" rows={6}
                                            placeholder="Tell us more about your query..."
                                            value={formData.message}
                                            onChange={handleChange} required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={`cf-submit ${status}`}
                                        disabled={status === 'sending'}
                                    >
                                        {status === 'sending' ? (
                                            <><span className="cf-spinner" /> Sending…</>
                                        ) : status === 'success' ? (
                                            '✓ Message Sent!'
                                        ) : (
                                            <><Send size={16} /> Send Message</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <section className="contact-faq section">
                <div className="container">
                    <div className="faq-header">
                        <span className="contact-eyebrow">FAQ</span>
                        <h2 className="faq-title">Frequently Asked Questions</h2>
                        <p className="faq-sub">
                            Can't find what you're looking for?{' '}
                            <a href="mailto:retrostylings@retrostylings.in" className="faq-link">
                                Email us directly →
                            </a>
                        </p>
                    </div>

                    <div className="faq-list">
                        {FAQS.map((faq, i) => (
                            <motion.div
                                key={i}
                                className={`faq-item ${openFaq === i ? 'open' : ''}`}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <button
                                    className="faq-question"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    aria-expanded={openFaq === i}
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown size={18} className="faq-chevron" />
                                </button>
                                <AnimatePresence initial={false}>
                                    {openFaq === i && (
                                        <motion.div
                                            className="faq-answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <p>{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Toast
                isOpen={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default Contact;
