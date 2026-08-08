import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { labelService } from '../../services/firestoreService';
import { Tag, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Labels.css';

const PRESET_COLORS = [
  { name: 'Red', bg: '#EF4444', text: '#FFFFFF' },
  { name: 'Emerald', bg: '#10B981', text: '#FFFFFF' },
  { name: 'Purple', bg: '#8B5CF6', text: '#FFFFFF' },
  { name: 'Amber', bg: '#F59E0B', text: '#FFFFFF' },
  { name: 'Pink', bg: '#EC4899', text: '#FFFFFF' },
  { name: 'Blue', bg: '#3B82F6', text: '#FFFFFF' },
  { name: 'Dark Slate', bg: '#1E293B', text: '#FFFFFF' },
  { name: 'Neon Lime', bg: '#84CC16', text: '#000000' },
];

const AdminLabels = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bgColor: '#8B5CF6',
    textColor: '#FFFFFF',
    status: 'active',
    displayOrder: 1,
  });

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    setLoading(true);
    try {
      const data = await labelService.getAll();
      setLabels(data);
    } catch (err) {
      console.error('Failed to load labels:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingLabel(null);
    setFormData({
      name: '',
      slug: '',
      bgColor: '#8B5CF6',
      textColor: '#FFFFFF',
      status: 'active',
      displayOrder: labels.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lbl) => {
    setEditingLabel(lbl);
    setFormData({
      name: lbl.name || '',
      slug: lbl.slug || '',
      bgColor: lbl.bgColor || '#8B5CF6',
      textColor: lbl.textColor || '#FFFFFF',
      status: lbl.status || 'active',
      displayOrder: lbl.displayOrder || 1,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Label Name is required');
      return;
    }

    setSaving(true);
    const slug = formData.slug || formData.name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const payload = {
      ...formData,
      slug,
    };

    try {
      if (editingLabel) {
        await labelService.update(editingLabel.id, payload);
      } else {
        await labelService.create(payload);
      }
      setIsModalOpen(false);
      await loadLabels();
    } catch (err) {
      console.error('Failed to save label:', err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        alert('Firestore Permission Error!\n\nPlease add rules in your Firebase Console for labels:\n\nmatch /labels/{id} { allow read, write: if true; }');
      } else {
        alert('Failed to save label: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this label? Products assigned to this label will no longer display it.')) return;
    try {
      await labelService.delete(id);
      await loadLabels();
    } catch (err) {
      console.error('Error deleting label:', err);
      alert('Failed to delete label: ' + err.message);
    }
  };

  const handleToggleStatus = async (lbl) => {
    const nextStatus = lbl.status === 'active' ? 'inactive' : 'active';
    try {
      await labelService.update(lbl.id, { status: nextStatus });
      await loadLabels();
    } catch (err) {
      console.error('Error toggling label status:', err);
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const list = [...labels];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setLabels(list);
    try {
      await labelService.reorder(list);
    } catch (err) {
      console.error('Error reordering labels:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-labels-page">
        <div className="admin-page-header">
          <div>
            <span className="subtitle">Product Metadata</span>
            <h2><Tag size={24} className="header-icon" /> Product Labels</h2>
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} /> Add Custom Label
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-spinner">Loading labels...</div>
        ) : (
          <div className="glass-card labels-table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Badge Preview</th>
                    <th>Label Name</th>
                    <th>Slug</th>
                    <th>Colors</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center empty-cell">
                        No product labels created yet. Click "Add Custom Label" to get started!
                      </td>
                    </tr>
                  ) : (
                    labels.map((lbl, idx) => (
                      <tr key={lbl.id || idx}>
                        <td>
                          <div className="order-actions">
                            <button
                              className="btn-icon btn-sm"
                              disabled={idx === 0}
                              onClick={() => handleMoveOrder(idx, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="btn-icon btn-sm"
                              disabled={idx === labels.length - 1}
                              onClick={() => handleMoveOrder(idx, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <span
                            className="label-badge-preview"
                            style={{
                              backgroundColor: lbl.bgColor || '#8B5CF6',
                              color: lbl.textColor || '#FFFFFF',
                            }}
                          >
                            {lbl.name || 'LABEL'}
                          </span>
                        </td>
                        <td>
                          <strong className="label-name-text">{lbl.name}</strong>
                        </td>
                        <td><code>{lbl.slug}</code></td>
                        <td>
                          <div className="color-swatches-cell">
                            <span className="swatch-bubble" style={{ backgroundColor: lbl.bgColor }} title={`Background: ${lbl.bgColor}`} />
                            <span className="swatch-bubble text-swatch" style={{ backgroundColor: lbl.textColor }} title={`Text: ${lbl.textColor}`} />
                          </div>
                        </td>
                        <td>
                          <button
                            className={`status-pill ${lbl.status === 'active' ? 'status-active' : 'status-inactive'}`}
                            onClick={() => handleToggleStatus(lbl)}
                          >
                            {lbl.status === 'active' ? <Check size={12} /> : <X size={12} />}
                            {lbl.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="text-right">
                          <div className="table-row-actions">
                            <button
                              className="btn-icon"
                              onClick={() => openEditModal(lbl)}
                              title="Edit Label"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(lbl.id)}
                              title="Delete Label"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="admin-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="admin-modal-content glass-card"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <div className="modal-header">
                  <h3>{editingLabel ? 'Edit Label' : 'Add Custom Label'}</h3>
                  <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="modal-body-form">
                  <div className="badge-live-preview-box">
                    <label>Badge Live Preview</label>
                    <div className="preview-container">
                      <span
                        className="label-badge-preview large"
                        style={{
                          backgroundColor: formData.bgColor || '#8B5CF6',
                          color: formData.textColor || '#FFFFFF',
                        }}
                      >
                        {formData.name.trim() ? formData.name : 'SAMPLE LABEL'}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Label Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. HOT, NEW, BESTSELLER, 30% OFF"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Slug (URL Identifier)</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Background Color</label>
                      <div className="color-picker-input">
                        <input
                          type="color"
                          value={formData.bgColor}
                          onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                        />
                        <input
                          type="text"
                          value={formData.bgColor}
                          onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Text Color</label>
                      <div className="color-picker-input">
                        <input
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        />
                        <input
                          type="text"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Quick Preset Color Palettes</label>
                    <div className="preset-colors-grid">
                      {PRESET_COLORS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="preset-color-btn"
                          style={{ backgroundColor: p.bg, color: p.text }}
                          onClick={() => setFormData({ ...formData, bgColor: p.bg, textColor: p.text })}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Display Order</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">Active (Visible to customers)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : editingLabel ? 'Update Label' : 'Create Label'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminLabels;
