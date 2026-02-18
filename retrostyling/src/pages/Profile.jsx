import React, { useState, useEffect } from 'react';
import { User, Package, Calendar, Clock, ChevronRight, ChevronDown, MapPin, Phone } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState({});

    useEffect(() => {
        fetchProfile();
        fetchOrders();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUser(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error('Orders data is not an array:', data);
                setOrders([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderDetails = async (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
            return;
        }

        setExpandedOrder(orderId);

        if (!orderDetails[orderId]) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/api/orders/my-orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setOrderDetails(prev => ({ ...prev, [orderId]: data }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <div className="container section">Loading Profile...</div>;

    return (
        <div className="profile-page container section">
            <div className="profile-grid">
                {/* 👤 Left Sidebar: User Info */}
                <aside className="profile-sidebar">
                    <div className="user-card-main">
                        <div className="user-avatar-large">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info-text">
                            <h2>{user?.name}</h2>
                            <p className="user-email">{user?.email}</p>
                            <span className="user-role-badge">{user?.role?.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="profile-nav-vertical">
                        <button className="nav-item active">
                            <User size={18} /> Profile Overview
                        </button>
                        <button className="nav-item">
                            <Package size={18} /> Settings
                        </button>
                    </div>
                </aside>

                {/* 📦 Right Content: Orders History */}
                <main className="profile-content">
                    <div className="content-header">
                        <h1 className="h3">Order History</h1>
                        <p className="text-light">Manage your recent orders and track deliveries.</p>
                    </div>

                    <div className="orders-list">
                        {orders.length === 0 ? (
                            <div className="empty-orders">
                                <Package size={48} strokeWidth={1} />
                                <p>You haven't placed any orders yet.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className={`order-card ${expandedOrder === order.id ? 'expanded' : ''}`}>
                                    <div className="order-summary" onClick={() => toggleOrderDetails(order.id)}>
                                        <div className="order-main-info">
                                            <div className="order-id-date">
                                                <span className="order-number">Order #{order.id}</span>
                                                <span className="order-date">
                                                    <Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="order-total-status">
                                                <span className="order-amount">₹{Number(order.total).toFixed(2)}</span>
                                                <span className={`status-pill pill-${order.order_status}`}>
                                                    {order.order_status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="order-expand-icon">
                                            {expandedOrder === order.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {expandedOrder === order.id && (
                                        <div className="order-expanded-details">
                                            <div className="order-meta-info">
                                                <p><MapPin size={14} /> <strong>Shipping Address:</strong> {order.shipping_address || 'N/A'}</p>
                                                <p><Phone size={14} /> <strong>Contact:</strong> {order.phone || 'N/A'}</p>
                                            </div>

                                            <div className="order-items-table">
                                                {orderDetails[order.id]?.map((item, idx) => (
                                                    <div key={idx} className="order-item-mini">
                                                        <img src={item.image} alt={item.name} />
                                                        <div className="item-mini-info">
                                                            <h4>{item.name}</h4>
                                                            <p>Size: {item.size} | Qty: {item.quantity}</p>
                                                        </div>
                                                        <div className="item-mini-price">
                                                            ₹{Number(item.price).toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))}
                                                {!orderDetails[order.id] && <p className="loading-small">Loading order items...</p>}
                                            </div>

                                            <div className="order-footer-actions">
                                                <button className="btn btn-outline btn-sm">TRACK ORDER</button>
                                                <button className="btn btn-outline btn-sm">NEED HELP?</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
