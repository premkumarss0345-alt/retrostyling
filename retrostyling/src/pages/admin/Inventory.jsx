import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { productService, orderService } from '../../services/firestoreService';
import {
  Package, AlertTriangle, TrendingDown, Plus, Search,
  Download, ArrowUpDown, Edit2, Trash2, RefreshCw,
  ArrowUp, ArrowDown, BarChart2, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

const getStatusBadge = (status) => {
  const map = {
    ok: 'badge badge-success',
    low: 'badge badge-warning',
    critical: 'badge badge-error',
    out: 'badge badge-error',
  };
  return map[status] || 'badge';
};

const getStatusText = (status) => {
  const map = { ok: 'In Stock', low: 'Low Stock', critical: 'Critical', out: 'Out of Stock' };
  return map[status] || status;
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustMode, setAdjustMode] = useState('add'); // add, remove
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ordersData] = await Promise.all([
        productService.getAllAdmin(),
        orderService.getAll().catch(() => [])
      ]);
      setProducts(prodsData || []);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Inventory load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!showAdjust) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    const currentVal = showAdjust.available;
    const newVal = adjustMode === 'add' ? currentVal + qty : Math.max(0, currentVal - qty);
    try {
      const full = await productService.getById(showAdjust.id);
      await productService.update(showAdjust.id, {
        ...full,
        stock: newVal
      });
      setShowAdjust(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update stock: ' + err.message);
    }
  };

  // Build map of reserved stock from active customer orders
  const reservedStockMap = {};
  const activeStatuses = ['processing', 'packed', 'shipped', 'out_for_delivery', 'pending'];

  orders.forEach(order => {
    if (activeStatuses.includes(order.orderStatus)) {
      (order.items || []).forEach(item => {
        const key = item.productId || item.name;
        if (key) {
          reservedStockMap[key] = (reservedStockMap[key] || 0) + (Number(item.quantity) || 1);
        }
      });
    }
  });

  const inventoryItems = products.map(prod => {
    const threshold = prod.low_stock_threshold || 5;
    const reserved = (reservedStockMap[prod.id] || reservedStockMap[prod.name]) || 0;
    
    // Net available stock on hand
    const available = Math.max(0, prod.stock || 0);
    // Total current stock (Physical total = available + active reserved)
    const currentStock = available + reserved;

    let status = 'ok';
    if (available === 0) status = 'out';
    else if (available <= 3) status = 'critical';
    else if (available <= threshold) status = 'low';

    return {
      id: prod.id,
      sku: prod.sku || 'N/A',
      name: prod.name,
      category: prod.categoryName || prod.category || 'General',
      brand: prod.brand || 'RetroStylings',
      currentStock,
      reserved,
      available,
      reorderPoint: threshold,
      cost: prod.cost_price || 0,
      status
    };
  });

  const filtered = inventoryItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: inventoryItems.reduce((a, b) => a + b.currentStock, 0),
    low: inventoryItems.filter(i => i.status === 'low').length,
    critical: inventoryItems.filter(i => i.status === 'critical').length,
    out: inventoryItems.filter(i => i.status === 'out').length,
  };

  return (
    <AdminLayout>
      <motion.div className="inv-page" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Inventory Management</h1>
            <p className="page-subtitle">Track stock levels, set reorder points, and manage adjustments.</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="inv-stats-grid">
          {[
            { label: 'Total Stock Units', value: stats.total, icon: Package, color: '#DFFF1B' },
            { label: 'Low Stock Items', value: stats.low, icon: TrendingDown, color: '#F59E0B' },
            { label: 'Critical Stock', value: stats.critical, icon: AlertTriangle, color: '#FF4D4D' },
            { label: 'Out of Stock', value: stats.out, icon: Package, color: '#FF4D4D' },
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

        {/* Filters */}
        <motion.div className="inv-controls" variants={itemVariants}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input search-input" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="inv-filter-tabs">
            {['all', 'ok', 'low', 'critical', 'out'].map(f => (
              <button key={f} className={`period-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'ok' ? 'In Stock' : f === 'low' ? 'Low Stock' : f === 'critical' ? 'Critical' : 'Out of Stock'}
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
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Reorder Point</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No inventory items found.</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id}>
                    <td><code className="sku-code">{item.sku}</code></td>
                    <td><span className="product-name-cell">{item.name}</span></td>
                    <td><span className="badge badge-neutral">{item.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: item.currentStock < item.reorderPoint ? 'var(--error)' : 'var(--text-main)' }}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td>{item.reserved}</td>
                    <td><strong>{item.available}</strong></td>
                    <td>{item.reorderPoint}</td>
                    <td><span className={getStatusBadge(item.status)}>{getStatusText(item.status)}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setShowAdjust(item); setAdjustQty(''); setAdjustNote(''); setAdjustMode('add'); }} title="Adjust Stock">
                          <ArrowUpDown size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Adjust Modal */}
        {showAdjust && (
          <div className="modal-backdrop" onClick={() => setShowAdjust(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <h3>Adjust Stock</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAdjust(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="inv-adj-product">
                  <strong>{showAdjust.name}</strong>
                  <p>Current Stock: <strong>{showAdjust.currentStock}</strong></p>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Adjustment Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className={`btn btn-sm ${adjustMode === 'add' ? 'btn-success' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setAdjustMode('add')}><ArrowUp size={14} /> Add Stock</button>
                    <button type="button" className={`btn btn-sm ${adjustMode === 'remove' ? 'btn-danger' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setAdjustMode('remove')}><ArrowDown size={14} /> Remove Stock</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="1" placeholder="Enter quantity" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Note (optional)</label>
                  <input className="form-input" placeholder="Reason for adjustment..." value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdjust(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveAdjustment}>Save Adjustment</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default Inventory;
