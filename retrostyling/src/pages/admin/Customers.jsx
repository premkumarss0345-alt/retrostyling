import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { userService, orderService } from '../../services/firestoreService';
import { Users, Search, Download, TrendingUp, ShoppingBag, Award, MoreVertical, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allOrders] = await Promise.all([
        userService.getAll(),
        orderService.getAll()
      ]);

      const mapped = allUsers.map(user => {
        // Find matching orders
        const userOrders = allOrders.filter(o => o.customerEmail === user.email || o.userId === user.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Sort orders to find the latest
        const sortedOrders = [...userOrders].sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        
        let lastOrderDate = null;
        if (sortedOrders.length > 0) {
          const latest = sortedOrders[0].createdAt;
          lastOrderDate = latest?.toDate ? latest.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(latest).toLocaleDateString();
        }

        const ordersCount = userOrders.length;
        const status = user.role === 'admin' ? 'vip' : ordersCount > 3 ? 'vip' : ordersCount === 0 ? 'inactive' : 'active';
        
        // Default points to 1 point per 10 rupees spent, or VIP default
        const points = Math.round(totalSpent / 10) || (user.role === 'admin' ? 1250 : 0);

        return {
          id: user.id || user.uid,
          name: user.name || 'Anonymous User',
          email: user.email || 'N/A',
          phone: user.phone || 'N/A',
          orders: ordersCount,
          totalSpent,
          points,
          status,
          joinDate: user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A',
          lastOrder: lastOrderDate || 'Never'
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.error('Customers load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.status === 'vip').length,
    totalRevenue: customers.reduce((a, b) => a + b.totalSpent, 0),
  };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Customer Management</h1>
            <p className="page-subtitle">View and manage your customer base, order history, and reward points.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Customers', value: stats.total, icon: Users, color: '#DFFF1B' },
            { label: 'Active Customers', value: stats.active, icon: TrendingUp, color: '#22C55E' },
            { label: 'VIP Customers', value: stats.vip, icon: Award, color: '#8B5CF6' },
            { label: 'Total Revenue Generated', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: ShoppingBag, color: '#3B82F6' },
          ].map((s, i) => (
            <motion.div key={i} className="inv-stat-card" variants={itemVariants}>
              <div className="inv-stat-icon" style={{ background: s.color + '18', color: s.color }}>
                <s.icon size={20} />
              </div>
              <div>
                <div className="inv-stat-value">{loading ? '...' : s.value}</div>
                <div className="inv-stat-label">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input search-input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="period-tabs">
            {['all', 'active', 'vip', 'inactive'].map(f => (
              <button key={f} className={`period-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className="table-card" variants={itemVariants}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Reward Points</th>
                  <th>Status</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span>{c.email}</span>
                        <br />
                        <small style={{ color: 'var(--text-light)' }}>{c.phone}</small>
                      </div>
                    </td>
                    <td>{c.orders} orders</td>
                    <td><strong>₹{c.totalSpent.toLocaleString()}</strong></td>
                    <td>{c.points} pts</td>
                    <td>
                      <span className={`status-pill ${c.status === 'vip' ? 'pill-delivered' : c.status === 'active' ? 'pill-processing' : 'pill-cancelled'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{c.lastOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default Customers;
