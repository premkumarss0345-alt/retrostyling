import React, { useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { Upload, Search, Grid, List, Folder, FolderPlus, Trash2, Download, Copy, Image, Film, File, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockMedia = [
  { id: 1, name: 'hero-summer-2026.jpg', type: 'image', size: '2.4 MB', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', folder: 'Banners', date: '2026-07-05', dimensions: '1920×600' },
  { id: 2, name: 'leather-jacket-01.jpg', type: 'image', size: '1.2 MB', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', folder: 'Products', date: '2026-07-04', dimensions: '800×800' },
  { id: 3, name: 'denim-jeans-main.jpg', type: 'image', size: '980 KB', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', folder: 'Products', date: '2026-07-03', dimensions: '800×800' },
  { id: 4, name: 'brand-logo.png', type: 'image', size: '120 KB', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', folder: 'Logos', date: '2026-07-01', dimensions: '400×400' },
  { id: 5, name: 'sneakers-collection.jpg', type: 'image', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', folder: 'Products', date: '2026-06-30', dimensions: '1200×800' },
  { id: 6, name: 'summer-dress-01.jpg', type: 'image', size: '760 KB', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', folder: 'Products', date: '2026-06-28', dimensions: '800×1200' },
  { id: 7, name: 'bucket-hat.jpg', type: 'image', size: '540 KB', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400', folder: 'Products', date: '2026-06-25', dimensions: '800×800' },
  { id: 8, name: 'polo-shirt-white.jpg', type: 'image', size: '650 KB', url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400', folder: 'Products', date: '2026-06-22', dimensions: '800×800' },
];

const FOLDERS = ['All', 'Products', 'Banners', 'Logos', 'Videos', 'Documents'];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

const MediaLibrary = () => {
  const [media, setMedia] = useState(mockMedia);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFolder, setActiveFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileRef = useRef();

  const filtered = media.filter(m => {
    const matchFolder = activeFolder === 'All' || m.folder === activeFolder;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteSelected = () => {
    if (window.confirm(`Delete ${selected.length} item(s)?`)) {
      setMedia(prev => prev.filter(m => !selected.includes(m.id)));
      setSelected([]);
    }
  };

  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const folderCounts = FOLDERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? media.length : media.filter(m => m.folder === f).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Media Library</h1>
            <p className="page-subtitle">Manage all your images, videos, and documents in one place.</p>
          </div>
          <div className="page-actions">
            {selected.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={deleteSelected}>
                <Trash2 size={14} /> Delete ({selected.length})
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} />
            <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Upload Files
            </button>
          </div>
        </motion.div>

        <div className="media-layout">
          {/* Folder Sidebar */}
          <aside className="media-sidebar">
            <div className="media-sidebar-header">
              <span>Folders</span>
              <button className="btn btn-ghost btn-icon btn-sm"><FolderPlus size={15} /></button>
            </div>
            {FOLDERS.map(folder => (
              <button
                key={folder}
                className={`media-folder-item ${activeFolder === folder ? 'active' : ''}`}
                onClick={() => setActiveFolder(folder)}
              >
                <Folder size={15} />
                <span>{folder}</span>
                <span className="folder-count">{folderCounts[folder] || 0}</span>
              </button>
            ))}
          </aside>

          {/* Main Area */}
          <div className="media-main">
            {/* Controls */}
            <div className="media-controls">
              <div className="search-wrapper" style={{ flex: 1, maxWidth: 320 }}>
                <Search size={15} className="search-icon" />
                <input className="form-input search-input" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="view-mode-btns">
                <button className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={15} /></button>
                <button className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={15} /></button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="media-stats">
              <span>{filtered.length} files</span>
              {selected.length > 0 && <span className="badge badge-primary">{selected.length} selected</span>}
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div className="media-grid" variants={containerVariants}>
                {/* Upload Zone */}
                <motion.div
                  className="media-upload-zone"
                  variants={itemVariants}
                  onClick={() => fileRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                >
                  <Upload size={24} />
                  <span>Upload files</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>or drag & drop</span>
                </motion.div>

                {filtered.map(item => (
                  <motion.div
                    key={item.id}
                    className={`media-item ${selected.includes(item.id) ? 'selected' : ''}`}
                    variants={itemVariants}
                    onClick={() => toggleSelect(item.id)}
                    onDoubleClick={() => setPreview(item)}
                  >
                    <div className="media-item-check">
                      {selected.includes(item.id) && <Check size={12} />}
                    </div>
                    <div className="media-item-img">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="img-cover" />
                      ) : (
                        <div className="media-file-icon"><Film size={28} /></div>
                      )}
                    </div>
                    <div className="media-item-info">
                      <p className="media-item-name">{item.name}</p>
                      <span className="media-item-size">{item.size}</span>
                    </div>
                    <div className="media-item-actions">
                      <button className="btn btn-ghost btn-icon" style={{ padding: '0.3rem' }} onClick={(e) => { e.stopPropagation(); copyUrl(item.url, item.id); }}>
                        {copiedId === item.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      </button>
                      <button className="btn btn-ghost btn-icon" style={{ padding: '0.3rem' }} onClick={(e) => { e.stopPropagation(); setPreview(item); }}>
                        <Image size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div className="table-card" variants={itemVariants}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(m => m.id) : [])} /></th>
                        <th>Preview</th>
                        <th>Name</th>
                        <th>Folder</th>
                        <th>Size</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => (
                        <tr key={item.id}>
                          <td><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                          <td>
                            <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-soft)' }}>
                              {item.type === 'image' && <img src={item.url} alt="" className="img-cover" />}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</td>
                          <td><span className="badge badge-neutral">{item.folder}</span></td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.size}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyUrl(item.url, item.id)}>
                                {copiedId === item.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreview(item)}><Image size={13} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setMedia(prev => prev.filter(m => m.id !== item.id))}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {preview && (
            <div className="modal-backdrop" onClick={() => setPreview(null)}>
              <motion.div
                className="media-preview-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <button className="media-preview-close" onClick={() => setPreview(null)}><X size={20} /></button>
                <div className="media-preview-img">
                  <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
                <div className="media-preview-meta">
                  <h4>{preview.name}</h4>
                  <div className="media-preview-tags">
                    <span className="tag">{preview.size}</span>
                    <span className="tag">{preview.dimensions}</span>
                    <span className="tag">{preview.folder}</span>
                    <span className="tag">{preview.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyUrl(preview.url, preview.id)}>
                      <Copy size={13} /> Copy URL
                    </button>
                    <button className="btn btn-primary btn-sm"><Download size={13} /> Download</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .media-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; }
        .media-sidebar { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; height: fit-content; }
        .media-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid var(--border); margin-bottom: 0.5rem; }
        .media-folder-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 500; color: var(--text-muted); cursor: pointer; border: none; background: none; transition: var(--transition-fast); text-align: left; }
        .media-folder-item:hover { background: var(--bg-soft); color: var(--text-main); }
        .media-folder-item.active { background: var(--primary-light); color: var(--primary); font-weight: 600; }
        .folder-count { margin-left: auto; font-size: 0.7rem; background: var(--bg-elevated); color: var(--text-muted); padding: 0.1rem 0.4rem; border-radius: var(--radius-full); }
        .media-main { display: flex; flex-direction: column; gap: 1rem; }
        .media-controls { display: flex; gap: 1rem; align-items: center; }
        .view-mode-btns { display: flex; gap: 0.25rem; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 2px; }
        .view-mode-btns .btn.active { background: var(--bg-elevated); color: var(--text-main); }
        .media-stats { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 0.75rem; align-items: center; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; }
        .media-upload-zone { border: 2px dashed var(--border-bright); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; min-height: 160px; transition: var(--transition); }
        .media-upload-zone:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .media-item { border: 2px solid var(--border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: var(--transition-fast); position: relative; background: var(--bg-card); }
        .media-item:hover { border-color: var(--border-bright); }
        .media-item.selected { border-color: var(--primary); background: var(--primary-light); }
        .media-item-check { position: absolute; top: 0.5rem; left: 0.5rem; width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-bright); background: var(--bg-card); display: flex; align-items: center; justify-content: center; z-index: 1; }
        .media-item.selected .media-item-check { background: var(--primary); border-color: var(--primary); color: var(--black); }
        .media-item-img { height: 120px; background: var(--bg-soft); overflow: hidden; }
        .media-file-icon { height: 120px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .media-item-info { padding: 0.5rem; }
        .media-item-name { font-size: 0.72rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-dim); }
        .media-item-size { font-size: 0.68rem; color: var(--text-muted); }
        .media-item-actions { position: absolute; top: 0.4rem; right: 0.4rem; display: none; gap: 0.2rem; background: rgba(0,0,0,0.7); border-radius: var(--radius-sm); padding: 0.2rem; }
        .media-item:hover .media-item-actions { display: flex; }
        .media-preview-modal { background: var(--bg-card); border: 1px solid var(--border-bright); border-radius: var(--radius-xl); padding: 1.5rem; max-width: 600px; width: 100%; position: relative; }
        .media-preview-close { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border-radius: 50%; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; border: 1px solid var(--border); }
        .media-preview-img { text-align: center; margin-bottom: 1rem; }
        .media-preview-meta h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; }
        .media-preview-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        @media (max-width: 768px) { .media-layout { grid-template-columns: 1fr; } .media-sidebar { display: flex; gap: 0.5rem; overflow-x: auto; } }
      `}</style>
    </AdminLayout>
  );
};

export default MediaLibrary;
