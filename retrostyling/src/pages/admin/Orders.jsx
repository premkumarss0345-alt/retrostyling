import React, { useState, useEffect } from 'react';
import { Eye, X, Package, MapPin, Phone } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { orderService } from '../../services/firestoreService';

const AdminOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, orderStatus: status } : o))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="admin-header-actions">
        <h2>Order Management</h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders yet.</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id.slice(-6).toUpperCase()}</td>
                <td>
                  <div>
                    <strong>{order.customerName || 'Customer'}</strong>
                    <br />
                    <small style={{ color: 'var(--text-light)' }}>{order.customerEmail}</small>
                  </div>
                </td>
                <td>{order.items?.length || 0} items</td>
                <td>₹{Number(order.total).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${order.orderStatus}`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button 
                      className="btn-icon" 
                      onClick={() => setSelectedOrder(order)}
                      title="View Order Details"
                      style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', color: 'var(--white)', border: '1px solid var(--border)' }}
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}><MapPin size={14} style={{display:'inline', marginRight:'4px'}}/> Shipping Address</h4>
                  <p style={{ lineHeight: '1.6' }}>{selectedOrder.shippingAddress || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}><Phone size={14} style={{display:'inline', marginRight:'4px'}}/> Contact Info</h4>
                  <p style={{ lineHeight: '1.6' }}>{selectedOrder.customerName}<br/>{selectedOrder.phone}<br/>{selectedOrder.customerEmail}</p>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: 'var(--bg-soft)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {item.size ? `Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '800', color: 'var(--white)' }}>₹{Number(item.price).toLocaleString()}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status: <span className={`status-badge status-${selectedOrder.orderStatus}`}>{selectedOrder.orderStatus}</span></span>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Total: ₹{Number(selectedOrder.total).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
