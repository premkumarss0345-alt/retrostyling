import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import './Newsletter.css';

const Newsletter = () => {
    return (
        <section className="section newsletter">
            <div className="container">
                <div className="newsletter-card">
                    <h2 className="h2 card-title">Subscribe Newsletter</h2>
                    <p className="card-text">
                        Enter your email below to be the first to know about new collections and product launches.
                    </p>

                    <form className="card-form">
                        <div className="input-wrapper">
                            <Mail size={20} className="mail-icon" />
                            <input type="email" placeholder="Enter your email" required className="input-field" />
                        </div>

                        <button type="submit" className="btn btn-primary submit-btn">
                            <span>SUBSCRIBE</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
