import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Plus, Trash2, Truck, Package, MapPin, Clock,
  DollarSign, Zap, RotateCcw, Globe, AlertCircle, CheckCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { shippingSettingsService } from '../../services/firestoreService';
import './ShippingSettings.css';

const DEFAULT_SETTINGS = {
  freeShippingLimit: 0,
  standardCharge: 0,
  expressCharge: 0,
  minDeliveryDays: 0,
  maxDeliveryDays: 0,
  expressDeliveryDays: 0,
  returnWindowDays: 0,
  courierPartners: [],
  deliveryZones: [],
  sameDayAvailable: false,
  expressAvailable: false,
  hideRewards: false,
};

const AdminShippingSettings = () => {
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const [newPartner, setNewPartner]   = useState('');
  const [newZone, setNewZone]         = useState('');

  useEffect(() => {
    shippingSettingsService.get().then(s => {
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await shippingSettingsService.update(settings);
      showMsg('Shipping settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showMsg('Failed to save settings. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const addPartner = () => {
    if (!newPartner.trim()) return;
    set('courierPartners', [...settings.courierPartners, newPartner.trim()]);
    setNewPartner('');
  };

  const removePartner = (i) => {
    set('courierPartners', settings.courierPartners.filter((_, idx) => idx !== i));
  };

  const addZone = () => {
    if (!newZone.trim()) return;
    set('deliveryZones', [...settings.deliveryZones, newZone.trim()]);
    setNewZone('');
  };

  const removeZone = (i) => {
    set('deliveryZones', settings.deliveryZones.filter((_, idx) => idx !== i));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading shipping settings...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`ss-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      <div className="admin-header-actions">
        <div>
          <h2>Shipping Settings</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Configure shipping charges, zones, and delivery options
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="ss-grid">
        {/* Shipping Charges */}
        <motion.div
          className="ss-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="ss-card-header">
            <div className="ss-card-icon" style={{ background: 'rgba(223,255,27,0.08)', color: 'var(--neon-yellow)' }}>
              <DollarSign size={20} />
            </div>
            <h3>Shipping Charges</h3>
          </div>

          <div className="ss-fields">
            <div className="ss-field">
              <label>Free Shipping Limit (₹)</label>
              <p className="ss-field-desc">Orders above this amount get free standard shipping</p>
              <input
                type="number"
                value={settings.freeShippingLimit}
                onChange={e => set('freeShippingLimit', Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="ss-field">
              <label>Standard Delivery Charge (₹)</label>
              <p className="ss-field-desc">Applied when order is below free shipping limit</p>
              <input
                type="number"
                value={settings.standardCharge}
                onChange={e => set('standardCharge', Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="ss-field">
              <label>Express Delivery Charge (₹)</label>
              <p className="ss-field-desc">Additional charge for express delivery</p>
              <input
                type="number"
                value={settings.expressCharge}
                onChange={e => set('expressCharge', Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
        </motion.div>

        {/* Delivery Times */}
        <motion.div
          className="ss-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="ss-card-header">
            <div className="ss-card-icon" style={{ background: 'rgba(157,78,221,0.08)', color: 'var(--neon-purple)' }}>
              <Clock size={20} />
            </div>
            <h3>Delivery Times</h3>
          </div>

          <div className="ss-fields">
            <div className="ss-field-row">
              <div className="ss-field">
                <label>Min Delivery Days</label>
                <input
                  type="number"
                  value={settings.minDeliveryDays}
                  onChange={e => set('minDeliveryDays', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="ss-field">
                <label>Max Delivery Days</label>
                <input
                  type="number"
                  value={settings.maxDeliveryDays}
                  onChange={e => set('maxDeliveryDays', Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>
            <div className="ss-field">
              <label>Express Delivery Days</label>
              <input
                type="number"
                value={settings.expressDeliveryDays}
                onChange={e => set('expressDeliveryDays', Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="ss-field">
              <label>Return Window (Days)</label>
              <p className="ss-field-desc">How many days customers have to request a return after delivery</p>
              <input
                type="number"
                value={settings.returnWindowDays}
                onChange={e => set('returnWindowDays', Number(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </motion.div>

        {/* Delivery Options */}
        <motion.div
          className="ss-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="ss-card-header">
            <div className="ss-card-icon" style={{ background: 'rgba(0,245,255,0.08)', color: 'var(--neon-cyan)' }}>
              <Zap size={20} />
            </div>
            <h3>Delivery Options</h3>
          </div>

          <div className="ss-toggles">
            <div className="ss-toggle-row">
              <div>
                <h4>Express Delivery</h4>
                <p>Enable {settings.expressDeliveryDays}-day express delivery option at checkout</p>
              </div>
              <label className="ss-switch">
                <input
                  type="checkbox"
                  checked={settings.expressAvailable}
                  onChange={e => set('expressAvailable', e.target.checked)}
                />
                <span className="ss-switch-track" />
              </label>
            </div>
            <div className="ss-toggle-row">
              <div>
                <h4>Same Day Delivery</h4>
                <p>Enable same-day delivery (for select metro cities only)</p>
              </div>
              <label className="ss-switch">
                <input
                  type="checkbox"
                  checked={settings.sameDayAvailable}
                  onChange={e => set('sameDayAvailable', e.target.checked)}
                />
                <span className="ss-switch-track" />
              </label>
            </div>
            <div className="ss-toggle-row">
              <div>
                <h4>Hide Rewards Option</h4>
                <p>Hide rewards program and membership balances from the website</p>
              </div>
              <label className="ss-switch">
                <input
                  type="checkbox"
                  checked={settings.hideRewards || false}
                  onChange={e => set('hideRewards', e.target.checked)}
                />
                <span className="ss-switch-track" />
              </label>
            </div>
          </div>
        </motion.div>

        {/* Courier Partners */}
        <motion.div
          className="ss-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="ss-card-header">
            <div className="ss-card-icon" style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--neon-blue)' }}>
              <Truck size={20} />
            </div>
            <h3>Courier Partners</h3>
          </div>

          <div className="ss-chips-list">
            {settings.courierPartners.map((cp, i) => (
              <div key={i} className="ss-chip">
                <Package size={13} />
                <span>{cp}</span>
                <button onClick={() => removePartner(i)} title="Remove"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          <div className="ss-add-row">
            <input
              type="text"
              placeholder="Add courier partner..."
              value={newPartner}
              onChange={e => setNewPartner(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPartner()}
            />
            <button className="ss-add-btn" onClick={addPartner}><Plus size={16} /> Add</button>
          </div>
        </motion.div>

        {/* Delivery Zones */}
        <motion.div
          className="ss-card ss-card--full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="ss-card-header">
            <div className="ss-card-icon" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--neon-orange)' }}>
              <Globe size={20} />
            </div>
            <h3>Delivery Zones</h3>
          </div>
          <p className="ss-card-desc">Cities and regions where delivery is available</p>

          <div className="ss-chips-list ss-chips-list--row">
            {settings.deliveryZones.map((zone, i) => (
              <div key={i} className="ss-chip">
                <MapPin size={13} />
                <span>{zone}</span>
                <button onClick={() => removeZone(i)} title="Remove"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          <div className="ss-add-row">
            <input
              type="text"
              placeholder="Add delivery zone..."
              value={newZone}
              onChange={e => setNewZone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addZone()}
            />
            <button className="ss-add-btn" onClick={addZone}><Plus size={16} /> Add Zone</button>
          </div>
        </motion.div>
      </div>

      {/* Preview Banner */}
      <motion.div
        className="ss-preview"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <h4>Live Preview — Checkout Shipping</h4>
        <div className="ss-preview-row">
          <div className="ss-preview-option">
            <Truck size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <strong>Standard Delivery</strong>
              <span>{settings.minDeliveryDays}–{settings.maxDeliveryDays} days</span>
            </div>
            <span className="ss-preview-charge">₹{settings.standardCharge}</span>
            <span className="ss-preview-free">FREE above ₹{settings.freeShippingLimit.toLocaleString()}</span>
          </div>
          {settings.expressAvailable && (
            <div className="ss-preview-option">
              <Zap size={18} style={{ color: 'var(--secondary)' }} />
              <div>
                <strong>Express Delivery</strong>
                <span>{settings.expressDeliveryDays} day</span>
              </div>
              <span className="ss-preview-charge">₹{settings.expressCharge}</span>
            </div>
          )}
        </div>
        <p className="ss-preview-note">Return window: {settings.returnWindowDays} days from delivery</p>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminShippingSettings;
