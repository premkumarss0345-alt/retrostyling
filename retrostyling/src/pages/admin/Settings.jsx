import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { globalSettingsService } from '../../services/firestoreService';
import { ShieldCheck, CreditCard, Settings, RefreshCw } from 'lucide-react';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        storeName: 'Retrostylings',
        contactEmail: 'support@retrostylings.com',
        razorpayKeyId: 'rzp_test_demokey',
        defaultUpiId: 'retrostylings@razorpay',
        globalPaymentLink: 'https://rzp.io/l/retrostylings'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await globalSettingsService.get();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await globalSettingsService.update(settings);
            setMessage('Settings updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="loading-spinner" />
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading settings config...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Admin Settings</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Configure site values, keys and Razorpay links.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
                {/* General Settings */}
                <div className="admin-card" style={{ background: 'var(--bg-soft)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: 'var(--border)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--white)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={18} color="var(--primary)" /> General Settings
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configure site-wide settings and preferences.</p>
                    </div>

                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>Store Name</label>
                            <input name="storeName" type="text" value={settings.storeName || ''} onChange={handleInput} style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>Contact Email</label>
                            <input name="contactEmail" type="email" value={settings.contactEmail || ''} onChange={handleInput} style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }} required />
                        </div>
                    </div>
                </div>

                {/* Razorpay Integration Settings */}
                <div className="admin-card" style={{ background: 'var(--bg-soft)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: 'var(--border)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--white)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={18} color="var(--primary)" /> Razorpay & Payment Gateway
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Set your gateway keys, UPI scanner config, and default checkout redirection links.</p>
                    </div>

                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>Razorpay Key ID</label>
                            <input name="razorpayKeyId" type="text" value={settings.razorpayKeyId || ''} onChange={handleInput} style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }} required />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>Default UPI ID (for QR Generator)</label>
                            <input name="defaultUpiId" type="text" value={settings.defaultUpiId || ''} onChange={handleInput} placeholder="e.g. yourbusiness@upi" style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }} required />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>Global Shop Payment Link</label>
                            <input name="globalPaymentLink" type="url" value={settings.globalPaymentLink || ''} onChange={handleInput} placeholder="e.g. https://rzp.io/l/xxxxxxxx" style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }} required />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {message && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                            <ShieldCheck size={16} /> {message}
                        </div>
                    )}
                </div>
            </form>
        </AdminLayout>
    );
};

export default AdminSettings;
