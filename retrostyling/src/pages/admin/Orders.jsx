import React, { useState, useEffect } from 'react';
import { Eye, X, Package, MapPin, Phone, Check, Truck, ChevronRight, Search, RotateCcw, Plus, Trash2, Settings, CreditCard } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { orderService, invoiceTemplateService } from '../../services/firestoreService';
import { API_BASE_URL } from '../../config';

const ORDER_STATUSES = ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_STEPS = [
  { key: 'processing',       label: 'Confirm',          next: 'packed' },
  { key: 'packed',           label: 'Pack',             next: 'shipped' },
  { key: 'shipped',          label: 'Ship',             next: 'out_for_delivery' },
  { key: 'out_for_delivery', label: 'Out for Delivery', next: 'delivered' },
  { key: 'delivered',        label: 'Mark Delivered',   next: null },
];

const STATUS_LABELS = {
  processing:       'Pending',
  packed:           'Packed',
  shipped:          'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

const FILTER_TABS = [
  { key: 'all',             label: 'All' },
  { key: 'processing',      label: 'Pending' },
  { key: 'packed',          label: 'Packed' },
  { key: 'shipped',         label: 'Shipped' },
  { key: 'out_for_delivery',label: 'Out for Delivery' },
  { key: 'delivered',       label: 'Delivered' },
  { key: 'cancelled',       label: 'Cancelled' },
];

const STEP_LABELS = [
  { key: 'processing',       label: 'Order Confirmed' },
  { key: 'packed',           label: 'Packed' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const getStepIdx = (status) => STEP_LABELS.findIndex(s => s.key === status);

const formatDate = (ts) => {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AdminOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [searchVal, setSearchVal]         = useState('');
  const [updatingId, setUpdatingId]       = useState(null);

  // Tracking edit state
  const [trackingEdit, setTrackingEdit] = useState({ trackingNumber: '', courierPartner: '', estimatedDelivery: '' });
  const [savingTracking, setSavingTracking] = useState(false);

  // Administrative Payment Link state
  const [paymentLinkVal, setPaymentLinkVal] = useState('');
  const [savingPaymentLink, setSavingPaymentLink] = useState(false);

  // Invoice edit state
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ customerName: '', customerEmail: '', phone: '', shippingAddress: '', items: [] });
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Invoice template settings state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    brandName: '',
    tagline: '',
    billingStreet: '',
    billingCity: '',
    billingZip: '',
    taxPercentage: 18,
    footerNote: '',
    invoicePrefix: ''
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const openTemplateModal = async () => {
    try {
      const data = await invoiceTemplateService.get();
      setTemplateForm(data || {
        brandName: 'RetroStylings',
        tagline: 'Standard Retro-Street Tech',
        billingStreet: '12/A, Tech Hub Area',
        billingCity: 'Chennai, Tamil Nadu',
        billingZip: '600001',
        taxPercentage: 18,
        footerNote: 'Thank you for shopping with RetroStylings! For any support or returns, visit retrostylings.com/support',
        invoicePrefix: 'RS'
      });
      setShowTemplateModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const saveTemplateSettings = async () => {
    setSavingTemplate(true);
    try {
      await invoiceTemplateService.update(templateForm);
      setShowTemplateModal(false);
      alert('Invoice template settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice template');
    } finally {
      setSavingTemplate(false);
    }
  };

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
    setUpdatingId(id);
    try {
      await orderService.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, orderStatus: status } : o));
      if (selectedOrder?.id === id) setSelectedOrder(prev => ({ ...prev, orderStatus: status }));

      // ── Send status update email (fire-and-forget) ──
      const order = orders.find(o => o.id === id) || selectedOrder;
      if (order?.customerEmail) {
        fetch(`${API_BASE_URL}/api/email/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: id,
            customerName: order.customerName || 'Customer',
            customerEmail: order.customerEmail,
            status,
            items: order.items || [],
            total: order.total,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      await orderService.updateTracking(selectedOrder.id, trackingEdit);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...trackingEdit } : o));
      setSelectedOrder(prev => ({ ...prev, ...trackingEdit }));

      // Re-send shipped email with tracking info when tracking is saved
      if (selectedOrder.customerEmail && selectedOrder.orderStatus === 'shipped') {
        fetch(`${API_BASE_URL}/api/email/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: selectedOrder.id,
            customerName: selectedOrder.customerName || 'Customer',
            customerEmail: selectedOrder.customerEmail,
            status: 'shipped',
            trackingNumber: trackingEdit.trackingNumber,
            courierPartner: trackingEdit.courierPartner,
            estimatedDelivery: trackingEdit.estimatedDelivery,
            items: selectedOrder.items || [],
            total: selectedOrder.total,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTracking(false);
    }
  };

  const savePaymentLink = async () => {
    if (!selectedOrder) return;
    setSavingPaymentLink(true);
    try {
      await orderService.update(selectedOrder.id, { paymentLink: paymentLinkVal });
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, paymentLink: paymentLinkVal } : o));
      setSelectedOrder(prev => ({ ...prev, paymentLink: paymentLinkVal }));
      alert('Payment link saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save payment link');
    } finally {
      setSavingPaymentLink(false);
    }
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
    setTrackingEdit({
      trackingNumber: order.trackingNumber || '',
      courierPartner: order.courierPartner || '',
      estimatedDelivery: order.estimatedDelivery || '',
    });
    setPaymentLinkVal(order.paymentLink || '');
    setInvoiceForm({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      phone: order.phone || '',
      shippingAddress: order.shippingAddress || '',
      items: order.items ? order.items.map(i => ({ ...i })) : [],
    });
    setIsEditingInvoice(false);
  };

  const handleInvoiceItemChange = (index, field, val) => {
    setInvoiceForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: val };
      return { ...prev, items };
    });
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: 'custom_' + Date.now(),
          name: 'Custom Product',
          price: 0,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1596755094514-f87034a7a241?q=80&w=100&auto=format&fit=crop',
          size: 'M',
          color: 'White',
        }
      ]
    }));
  };

  const handleRemoveInvoiceItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const saveInvoiceChanges = async () => {
    if (!selectedOrder) return;
    setSavingInvoice(true);
    try {
      const subtotal = invoiceForm.items.reduce((acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 0), 0);
      const shippingCost = subtotal > 999 ? 0 : 99;
      const calculatedTotal = subtotal + shippingCost;

      const payload = {
        customerName: invoiceForm.customerName,
        customerEmail: invoiceForm.customerEmail,
        phone: invoiceForm.phone,
        shippingAddress: invoiceForm.shippingAddress,
        items: invoiceForm.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || null,
          name: i.name,
          image: i.image,
          size: i.size || null,
          color: i.color || null,
          quantity: Number(i.quantity || 0),
          price: Number(i.price || 0),
        })),
        total: calculatedTotal,
      };

      await orderService.update(selectedOrder.id, payload);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...payload } : o));
      setSelectedOrder(prev => ({ ...prev, ...payload }));
      setIsEditingInvoice(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice changes');
    } finally {
      setSavingInvoice(false);
    }
  };

  const getNextStep = (status) => {
    const step = STATUS_STEPS.find(s => s.key === status);
    return step?.next || null;
  };

  const getNextLabel = (status) => {
    const nextKey = getNextStep(status);
    if (!nextKey) return null;
    const step = STATUS_STEPS.find(s => s.next === nextKey);
    return step?.label || null;
  };

  // Filter & search
  const filtered = orders
    .filter(o => activeFilter === 'all' || o.orderStatus === activeFilter)
    .filter(o => {
      if (!searchVal.trim()) return true;
      const s = searchVal.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        o.customerName?.toLowerCase().includes(s) ||
        o.customerEmail?.toLowerCase().includes(s)
      );
    });

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? orders.length : orders.filter(o => o.orderStatus === tab.key).length;
    return acc;
  }, {});

  const currentStepIdx = selectedOrder ? getStepIdx(selectedOrder.orderStatus) : -1;

  return (
    <AdminLayout>
      <div className="admin-header-actions">
        <div>
          <h2>Order Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {orders.length} total orders
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem', color: 'var(--white)', fontSize: '0.875rem',
                outline: 'none', width: '220px'
              }}
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadOrders} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotateCcw size={14} /> Refresh
          </button>
          <button className="btn btn-outline btn-sm" onClick={openTemplateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Settings size={14} /> Invoice Template
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              background: activeFilter === tab.key ? 'var(--primary)' : 'var(--bg-card)',
              border: activeFilter === tab.key ? '1px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '100px',
              color: activeFilter === tab.key ? 'var(--bg-main)' : 'var(--text-dim)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span style={{
                background: activeFilter === tab.key ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                padding: '0.05rem 0.35rem', borderRadius: '100px', fontSize: '0.7rem'
              }}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
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
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders found.</td></tr>
            ) : filtered.map((order) => {
              const nextStatus = getNextStep(order.orderStatus);
              const nextLabel  = getNextLabel(order.orderStatus);
              const isUpdating = updatingId === order.id;
              return (
                <tr key={order.id}>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{order.id.slice(-6).toUpperCase()}</code>
                    {order.source === 'amazon' && (
                      <span style={{
                        marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: '4px',
                        background: 'rgba(255,153,0,0.15)', border: '1px solid rgba(255,153,0,0.35)',
                        color: '#FF9900', fontSize: '0.65rem', fontWeight: 800, verticalAlign: 'middle',
                        letterSpacing: '0.03em',
                      }}>AMZ</span>
                    )}
                  </td>
                  <td>
                    <strong>{order.customerName || 'Customer'}</strong>
                    <br />
                    <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{order.customerEmail}</small>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700 }}>₹{Number(order.total).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${order.orderStatus}`}>
                      {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {nextStatus && order.orderStatus !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus)}
                          disabled={isUpdating}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            background: 'rgba(223,255,27,0.08)', border: '1px solid rgba(223,255,27,0.25)',
                            borderRadius: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700,
                            cursor: isUpdating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                            opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          <ChevronRight size={13} /> {isUpdating ? '...' : nextLabel || STATUS_LABELS[nextStatus]}
                        </button>
                      )}
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={isUpdating}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)',
                            borderRadius: '6px', color: 'var(--error)', fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => openOrder(order)}
                        title="View Details"
                        style={{
                          background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.5rem',
                          borderRadius: '6px', color: 'var(--white)', border: '1px solid var(--border)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{isEditingInvoice ? 'Edit Invoice' : `Order #${selectedOrder.id.slice(-6).toUpperCase()}`}</h2>
                {!isEditingInvoice && (
                  <span className={`status-badge status-${selectedOrder.orderStatus}`} style={{ marginTop: '0.35rem', display: 'inline-block' }}>
                    {STATUS_LABELS[selectedOrder.orderStatus] || selectedOrder.orderStatus}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.50rem', alignItems: 'center' }}>
                {!isEditingInvoice && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditingInvoice(true)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    Edit Invoice
                  </button>
                )}
                <button className="btn-close" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
              </div>
            </div>

            {isEditingInvoice ? (
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Customer & Shipping Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Customer Name</label>
                      <input
                        type="text"
                        value={invoiceForm.customerName}
                        onChange={e => setInvoiceForm(p => ({ ...p, customerName: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Customer Email</label>
                      <input
                        type="email"
                        value={invoiceForm.customerEmail}
                        onChange={e => setInvoiceForm(p => ({ ...p, customerEmail: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Contact Phone</label>
                      <input
                        type="text"
                        value={invoiceForm.phone}
                        onChange={e => setInvoiceForm(p => ({ ...p, phone: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Shipping Address</label>
                    <textarea
                      value={invoiceForm.shippingAddress}
                      onChange={e => setInvoiceForm(p => ({ ...p, shippingAddress: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Invoice Items</h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleAddInvoiceItem}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', flexWrap: 'wrap' }}>
                      <img src={item.image} alt={item.name} style={{ width: 50, height: 65, objectFit: 'cover', borderRadius: 6, background: 'var(--bg-soft)' }} />
                      <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Product Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleInvoiceItemChange(idx, 'name', e.target.value)}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--white)', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ width: '70px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Size</label>
                        <input
                          type="text"
                          value={item.size || ''}
                          onChange={e => handleInvoiceItemChange(idx, 'size', e.target.value)}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--white)', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Color</label>
                        <input
                          type="text"
                          value={item.color || ''}
                          onChange={e => handleInvoiceItemChange(idx, 'color', e.target.value)}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--white)', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ width: '70px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleInvoiceItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--white)', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={e => handleInvoiceItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--white)', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvoiceItem(idx)}
                        style={{
                          background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
                          borderRadius: '8px', color: 'var(--error)', padding: '0.5rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.2rem'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {invoiceForm.items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                      No items on this invoice. Click 'Add Item' above.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {/* Timeline */}
                {selectedOrder.orderStatus !== 'cancelled' && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Order Progress</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                      {STEP_LABELS.map((step, i) => {
                        const done = i <= currentStepIdx;
                        const cur  = i === currentStepIdx;
                        return (
                          <React.Fragment key={step.key}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: done ? (cur ? 'var(--primary)' : 'var(--primary-light)') : 'var(--bg-elevated)',
                                border: `2px solid ${done ? 'var(--primary)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: cur ? 'var(--bg-main)' : done ? 'var(--primary)' : 'var(--text-muted)',
                                marginBottom: '0.4rem', flexShrink: 0,
                              }}>
                                {done && !cur ? <Check size={14} /> : <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: done ? 'var(--text-light)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                                {step.label}
                              </span>
                            </div>
                            {i < STEP_LABELS.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: i < currentStepIdx ? 'var(--primary)' : 'var(--border)', minWidth: 20, marginBottom: '1.3rem' }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Step Buttons */}
                {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {STATUS_STEPS.filter(s => {
                      const idx = STATUS_STEPS.findIndex(ss => ss.key === selectedOrder.orderStatus);
                      const thisIdx = STATUS_STEPS.findIndex(ss => ss.key === s.key);
                      return thisIdx === idx;
                    }).map(step => (
                      <button
                        key={step.key}
                        onClick={() => updateStatus(selectedOrder.id, step.next)}
                        disabled={!!updatingId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1.1rem',
                          background: 'var(--primary)', border: 'none', borderRadius: '8px',
                          color: 'var(--bg-main)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                        }}
                      >
                        <ChevronRight size={15} /> {step.label}
                      </button>
                    ))}
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
                        borderRadius: '8px', color: 'var(--error)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                      }}
                    >
                      <X size={14} /> Cancel Order
                    </button>
                  </div>
                )}

                {/* Tracking Info */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Truck size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                    Tracking Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Tracking Number</label>
                      <input
                        value={trackingEdit.trackingNumber}
                        onChange={e => setTrackingEdit(p => ({ ...p, trackingNumber: e.target.value }))}
                        placeholder="e.g. 1234567890"
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Courier Partner</label>
                      <input
                        value={trackingEdit.courierPartner}
                        onChange={e => setTrackingEdit(p => ({ ...p, courierPartner: e.target.value }))}
                        placeholder="e.g. BlueDart"
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Estimated Delivery</label>
                      <input
                        value={trackingEdit.estimatedDelivery}
                        onChange={e => setTrackingEdit(p => ({ ...p, estimatedDelivery: e.target.value }))}
                        placeholder="e.g. 14 July - 16 July"
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveTracking}
                    disabled={savingTracking}
                    style={{
                      marginTop: '0.75rem', padding: '0.45rem 1rem',
                      background: 'rgba(223,255,27,0.08)', border: '1px solid rgba(223,255,27,0.25)',
                      borderRadius: '8px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {savingTracking ? 'Saving...' : 'Save Tracking Info'}
                  </button>
                </div>

                {/* Administrative Payment Link */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <CreditCard size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                    Razorpay Payment Link (For Customers)
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        value={paymentLinkVal}
                        onChange={e => setPaymentLinkVal(e.target.value)}
                        placeholder="Paste Razorpay Payment Link here (e.g. https://rzp.io/i/xxxxxx)"
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <button
                      onClick={savePaymentLink}
                      disabled={savingPaymentLink}
                      style={{
                        padding: '0.53rem 1.25rem',
                        background: 'rgba(223,255,27,0.08)', border: '1px solid rgba(223,255,27,0.25)',
                        borderRadius: '8px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {savingPaymentLink ? 'Saving...' : 'Save Link'}
                    </button>
                  </div>
                  {selectedOrder.paymentLink && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Active Link:{' '}
                      <a href={selectedOrder.paymentLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                        {selectedOrder.paymentLink}
                      </a>
                    </div>
                  )}
                </div>

                {/* Customer & Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} /> Shipping Address
                    </h4>
                    <p style={{ lineHeight: '1.6', fontSize: '0.875rem' }}>{selectedOrder.shippingAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} /> Contact Info
                    </h4>
                    <p style={{ lineHeight: '1.6', fontSize: '0.875rem' }}>
                      {selectedOrder.customerName}<br />{selectedOrder.phone}<br />{selectedOrder.customerEmail}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Order Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.875rem', borderRadius: '10px' }}>
                      <img src={item.image} alt={item.name} style={{ width: 52, height: 68, objectFit: 'cover', borderRadius: 6, background: 'var(--bg-soft)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.name}</h4>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, color: 'var(--white)' }}>₹{Number(item.price).toLocaleString()}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEditingInvoice ? (
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditingInvoice(false)}
                  disabled={savingInvoice}
                >
                  Cancel
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estimated Total (incl. GST):</span>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                      ₹{(() => {
                        const sub = invoiceForm.items.reduce((acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 0), 0);
                        const ship = sub > 999 ? 0 : 99;
                        return (sub + ship).toLocaleString();
                      })()}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveInvoiceChanges}
                    disabled={savingInvoice}
                    style={{ minWidth: '120px' }}
                  >
                    {savingInvoice ? 'Saving...' : 'Save Invoice'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Placed on {formatDate(selectedOrder.createdAt)}</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Total: ₹{Number(selectedOrder.total).toLocaleString()}</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Invoice Template Settings</h2>
              <button className="btn-close" onClick={() => setShowTemplateModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Brand Name</label>
                  <input
                    type="text"
                    value={templateForm.brandName}
                    onChange={e => setTemplateForm(p => ({ ...p, brandName: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Tagline</label>
                  <input
                    type="text"
                    value={templateForm.tagline}
                    onChange={e => setTemplateForm(p => ({ ...p, tagline: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Invoice Prefix</label>
                    <input
                      type="text"
                      value={templateForm.invoicePrefix}
                      onChange={e => setTemplateForm(p => ({ ...p, invoicePrefix: e.target.value }))}
                      placeholder="e.g. RS"
                      style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Tax (GST) Percentage (%)</label>
                    <input
                      type="number"
                      value={templateForm.taxPercentage}
                      onChange={e => setTemplateForm(p => ({ ...p, taxPercentage: Number(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem', margin: '1rem 0 0.5rem 0' }}>Billing Address (Billed From)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Street Address</label>
                      <input
                        type="text"
                        value={templateForm.billingStreet}
                        onChange={e => setTemplateForm(p => ({ ...p, billingStreet: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>City, State</label>
                        <input
                          type="text"
                          value={templateForm.billingCity}
                          onChange={e => setTemplateForm(p => ({ ...p, billingCity: e.target.value }))}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>ZIP Code</label>
                        <input
                          type="text"
                          value={templateForm.billingZip}
                          onChange={e => setTemplateForm(p => ({ ...p, billingZip: e.target.value }))}
                          style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Footer Note</label>
                  <textarea
                    value={templateForm.footerNote}
                    onChange={e => setTemplateForm(p => ({ ...p, footerNote: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowTemplateModal(false)} disabled={savingTemplate}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTemplateSettings} disabled={savingTemplate}>
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
