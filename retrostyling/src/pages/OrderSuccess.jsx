import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess = () => {
    return (
        <div className="order-success-page">
            <div className="container success-container">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <div className="success-icon-wrapper">
                        <CheckCircle size={80} color="var(--green)" strokeWidth={2} />
                    </div>
                </motion.div>

                <motion.h1
                    className="success-title"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Thank You for Your Order!
                </motion.h1>

                <motion.p
                    className="success-message"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Your order has been placed successfully. We've sent a detailed confirmation email to you.
                    Get ready to elevate your style!
                </motion.p>

                <motion.div
                    className="success-actions"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link to="/profile" className="btn btn-primary btn-xl">
                        <Package size={22} /> View My Orders
                    </Link>
                    <Link to="/shop" className="btn btn-xl btn-outline-hero">
                        <ShoppingBag size={22} /> Continue Shopping
                    </Link>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                    className="confetti-bubble bubble-1"
                    animate={{ y: [0, -40, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                    className="confetti-bubble bubble-2"
                    animate={{ y: [0, -60, 0], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                    className="confetti-bubble bubble-3"
                    animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                />
            </div>
        </div>
    );
};

export default OrderSuccess;
