import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { newsletterService } from '../services/firestoreService';
import Toast from './Toast';
import './Newsletter.css';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await newsletterService.subscribe(email);
            setStatus('success');
            setToast({ show: true, message: 'Subscribed successfully! Welcome to Retro Stylings.', type: 'success' });
            setEmail('');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setToast({ show: true, message: err.message || 'Failed to subscribe. Please try again.', type: 'error' });
        }
    };
    return (
        <section className="section newsletter">
            <div className="container">
                <div className="newsletter-card">
                    <h2 className="h2 card-title">Subscribe Newsletter</h2>
                    <p className="card-text">
                        Enter your email below to be the first to know about new collections and product launches.
                    </p>

                    <form className="card-form" onSubmit={handleSubmit}>
                        <div className="input-wrapper">
                            <Mail size={20} className="mail-icon" />
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                required 
                                className="input-field" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary submit-btn"
                            disabled={status === 'loading'}
                        >
                            <span>{status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
            <Toast 
                isOpen={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </section>
    );
};

export default Newsletter;
