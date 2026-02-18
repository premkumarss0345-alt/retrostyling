import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, CreditCard, ShieldCheck, ChevronLeft, Truck } from 'lucide-react';
import Toast from '../components/Toast';
import './Checkout.css';

const Checkout = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formData, setFormData] = useState({
        shippingAddress: '',
        phone: '',
        city: '',
        pincode: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const res = await fetch('http://localhost:5001/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.length === 0) navigate('/cart');
            setCartItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const price = item.on_sale ? item.discount_price : item.price;
        return acc + (price * item.quantity);
    }, 0);

    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');

        const fullAddress = `${formData.shippingAddress}, ${formData.city} - ${formData.pincode}`;

        try {
            const res = await fetch('http://localhost:5001/api/orders/place', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    total: total,
                    shippingAddress: fullAddress,
                    phone: formData.phone
                })
            });

            if (res.ok) {
                setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
                setTimeout(() => navigate('/order-success'), 1500);
            } else {
                setToast({ show: true, message: 'Failed to place order. Try again.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'An error occurred.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    if (loading) return <div className="container section center-loading">Preparing checkout...</div>;

    return (
        <motion.div
            className="checkout-page section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="container">
                <Link to="/cart" className="back-link">
                    <ChevronLeft size={18} /> Back to Cart
                </Link>
                <h1 className="h2 title-centered">Checkout</h1>

                <div className="checkout-layout">
                    {/* 📝 Left: Shipping and Payment Form */}
                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <motion.div className="checkout-section" variants={itemVariants}>
                            <h3><MapPin size={20} /> Shipping Information</h3>
                            <div className="form-group">
                                <label>Delivery Address</label>
                                <textarea
                                    name="shippingAddress"
                                    required
                                    placeholder="House No, Street, Landmark..."
                                    onChange={handleInput}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" name="city" required placeholder="Noida" onChange={handleInput} />
                                </div>
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input type="text" name="pincode" required placeholder="201301" onChange={handleInput} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label><Phone size={14} /> Contact Number</label>
                                <input type="tel" name="phone" required placeholder="+91 XXXX XXX XXX" onChange={handleInput} />
                            </div>
                        </motion.div>

                        <motion.div className="checkout-section" variants={itemVariants}>
                            <h3><CreditCard size={20} /> Payment Method</h3>
                            <div className="payment-option selected">
                                <CreditCard size={24} color="var(--primary)" />
                                <div className="payment-text">
                                    <strong>Cash on Delivery (COD)</strong>
                                    <p>Safe and easy. Pay when your order arrives.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <button type="submit" className="btn btn-primary checkout-pay-btn" disabled={submitting}>
                                {submitting ? 'PLACING ORDER...' : `Place Order • ₹${total.toLocaleString()}`}
                            </button>
                            <p className="secure-text"><ShieldCheck size={16} /> Secure Checkout - SSL Encrypted</p>
                        </motion.div>
                    </form>

                    {/* 🛒 Right: Order Summary */}
                    <aside className="checkout-summary">
                        <motion.div className="summary-card" variants={itemVariants}>
                            <h3>Order Summary</h3>
                            <div className="summary-items">
                                {cartItems.map(item => (
                                    <div key={item.id} className="summary-item">
                                        <img src={item.image} alt={item.name} />
                                        <div className="item-detail">
                                            <h4>{item.name}</h4>
                                            <p>Qty: {item.quantity} • {item.size || 'Standard'}</p>
                                        </div>
                                        <div className="item-price">
                                            ₹{(Number(item.on_sale ? item.discount_price : item.price) * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="flex-center gap-1"><Truck size={14} /> Shipping</span>
                                    <span className={shipping === 0 ? 'free-tag' : ''}>
                                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                                    </span>
                                </div>
                                {shipping > 0 && (
                                    <p className="shipping-hint">Add ₹{Math.max(0, 999 - subtotal)} more for free shipping!</p>
                                )}
                                <div className="summary-row total">
                                    <span>Total Amount</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    </aside>
                </div>
            </div>

            <Toast
                isOpen={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </motion.div>
    );
};

export default Checkout;