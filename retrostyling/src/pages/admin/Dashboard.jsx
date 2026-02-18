import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
    Users,
    ShoppingBag,
    CreditCard,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    Package,
    AlertCircle,
    Download,
    Plus
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    // No changes needed here based on the review, the stats API returns correct key 'totalProducts'.
    // The user issue "edit is not reflect in shop page" likely due to filtering or caching.
    // I've added the status filter. If they edited a product to be "draft", it won't show in shop.
    // If they edited price but didn't save, that's another issue.
    // Let's verify ProductForm save logic.
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const salesData = [
        { name: 'Mon', sales: 400 },
        { name: 'Tue', sales: 300 },
        { name: 'Wed', sales: 600 },
        { name: 'Thu', sales: 800 },
        { name: 'Fri', sales: 500 },
        { name: 'Sat', sales: 900 },
        { name: 'Sun', sales: 1100 },
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.stats) setStats(data.stats);
                if (data.recentOrders) setRecentOrders(data.recentOrders);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) return <AdminLayout>Loading CRM Dashboard...</AdminLayout>;

    return (
        <AdminLayout>
            <motion.div
                className="crm-dashboard"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="crm-header-section">
                    <div>
                        <h1>Business Overview</h1>
                        <p className="text-muted">Welcome back, here's what's happening today.</p>
                    </div>
                    <div className="crm-actions">
                        <button className="btn-secondary">
                            <Download size={18} />
                            Export
                        </button>
                        <button className="btn-primary">
                            <Plus size={18} />
                            New Order
                        </button>
                    </div>
                </div>

                <div className="crm-stats-grid">
                    <motion.div className="crm-stat-card" variants={itemVariants}>
                        <div className="stat-icon users-bg">
                            <Users size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Customers</span>
                            <h2 className="stat-value">{stats.totalUsers}</h2>
                            <span className="stat-change positive">
                                <ArrowUpRight size={14} /> 12.5%
                            </span>
                        </div>
                    </motion.div>

                    <motion.div className="crm-stat-card" variants={itemVariants}>
                        <div className="stat-icon orders-bg">
                            <ShoppingBag size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Orders</span>
                            <h2 className="stat-value">{stats.totalOrders}</h2>
                            <span className="stat-change positive">
                                <ArrowUpRight size={14} /> 8.2%
                            </span>
                        </div>
                    </motion.div>

                    <motion.div className="crm-stat-card" variants={itemVariants}>
                        <div className="stat-icon revenue-bg">
                            <CreditCard size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Revenue</span>
                            <h2 className="stat-value">₹{Number(stats.totalRevenue).toLocaleString()}</h2>
                            <span className="stat-change positive">
                                <ArrowUpRight size={14} /> 24.3%
                            </span>
                        </div>
                    </motion.div>

                    <motion.div className="crm-stat-card" variants={itemVariants}>
                        <div className="stat-icon conversion-bg">
                            <TrendingUp size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">New Listings</span>
                            <h2 className="stat-value">{stats.totalProducts}</h2>
                            <span className="stat-change negative">
                                <ArrowDownRight size={14} /> 2.1%
                            </span>
                        </div>
                    </motion.div>
                </div>

                <div className="crm-grid-main">
                    <motion.div className="crm-chart-container" variants={itemVariants}>
                        <div className="container-header">
                            <h3>Revenue Growth</h3>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div className="crm-activity-container" variants={itemVariants}>
                        <div className="container-header">
                            <h3>Recent Orders</h3>
                            <a href="/admin/orders" className="view-all">View All</a>
                        </div>
                        <div className="activity-list">
                            {recentOrders.length > 0 ? (
                                recentOrders.map(order => (
                                    <div key={order.id} className="activity-item">
                                        <div className="order-initials">
                                            {order.customer_name.charAt(0)}
                                        </div>
                                        <div className="order-details">
                                            <p className="order-desc">
                                                <strong>{order.customer_name}</strong>
                                            </p>
                                            <span className="order-time">
                                                Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="order-amount">
                                            ₹{order.total}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>No recent orders found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="crm-pipeline-section">
                    <h3>Quick Management</h3>
                    <div className="pipeline-grid">
                        <motion.div className="pipeline-card" variants={itemVariants} whileHover={{ y: -5 }}>
                            <Clock size={24} className="icon-pending" />
                            <h4>12 Pending</h4>
                            <p>To process</p>
                        </motion.div>
                        <motion.div className="pipeline-card" variants={itemVariants} whileHover={{ y: -5 }}>
                            <Package size={24} className="icon-shipped" />
                            <h4>05 Shipped</h4>
                            <p>In transit</p>
                        </motion.div>
                        <motion.div className="pipeline-card" variants={itemVariants} whileHover={{ y: -5 }}>
                            <CheckCircle size={24} className="icon-delivered" />
                            <h4>84 Delivered</h4>
                            <p>Completed</p>
                        </motion.div>
                        <motion.div className="pipeline-card" variants={itemVariants} whileHover={{ y: -5 }}>
                            <AlertCircle size={24} className="icon-stock" />
                            <h4>03 Low Stock</h4>
                            <p>Restock needed</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </AdminLayout>
    );
};

export default Dashboard;
