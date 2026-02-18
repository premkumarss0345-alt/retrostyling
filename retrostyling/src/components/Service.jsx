import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import './Service.css';

const Service = () => {
    const services = [
        {
            icon: <Truck size={32} />,
            title: 'Free Shipping',
            text: 'On All Order Over ₹599'
        },
        {
            icon: <RotateCcw size={32} />,
            title: 'Easy Returns',
            text: '30 Day Returns Policy'
        },
        {
            icon: <ShieldCheck size={32} />,
            title: 'Secure Payment',
            text: '100% Secure Guarantee'
        },
        {
            icon: <Headphones size={32} />,
            title: 'Special Support',
            text: '24/7 Dedicated Support'
        }
    ];

    return (
        <section className="service section">
            <div className="container service-grid">
                {services.map((s, i) => (
                    <div key={i} className="service-item">
                        <div className="service-icon">{s.icon}</div>
                        <div className="service-content">
                            <h3 className="service-title">{s.title}</h3>
                            <p className="service-text">{s.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Service;
