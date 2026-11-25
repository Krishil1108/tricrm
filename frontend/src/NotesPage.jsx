import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiFileText, FiPlus, FiSearch, FiStar, FiTrash2, FiEdit2, 
  FiClock, FiTag, FiFolder, FiCheckCircle, FiAlertCircle, 
  FiFilter, FiGrid, FiList 
} from 'react-icons/fi';
import { noteAPI, handleAPIError } from './services/api';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import ConfirmDialog from './components/ConfirmDialog';
import Watermark from './components/Watermark';
import './PageContent.css';
import './NotesPage.css';

const CATEGORIES = ['General', 'Meeting', 'Project', 'Follow-up', 'Todo'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [starredOnly, setStarredOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    relatedTo: '',
    tags: '',
    isStarred: false,
    isReminder: false,
    reminderDate: '',
    reminderTime: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openAddModal) {
      handleOpenAddModal();
    }
  }, [location.state]);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    starred: 0,
    highPriority: 0,
    reminders: 0
  });

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedPriority !== 'All') params.priority = selectedPriority;
      if (starredOnly) params.isStarred = true;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await noteAPI.getAll(params);
      const fetchedNotes = response.data?.notes || response.data || [];
      const list = Array.isArray(fetchedNotes) ? fetchedNotes : [];
      setNotes(list);

      // Compute quick stats
      setStats({
        total: list.length,
        starred: list.filter(n => n.isStarred).length,
        highPriority: list.filter(n => n.priority === 'High').length,
        reminders: list.filter(n => n.isReminder).length
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedPriority, starredOnly, searchTerm]);

  useEffect(() => {
    fetchNotes();

    const unsub = dataEventManager.subscribe(DATA_TYPES.NOTES, () => {
      fetchNotes();
    });
    return () => unsub();
  }, [fetchNotes]);

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      category: 'General',
      priority: 'Medium',
      relatedTo: '',
      tags: '',
      isStarred: false,
      isReminder: false,
      reminderDate: '',
      reminderTime: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    let reminderDate = '';
    let reminderTime = '';
    if (note.reminderDateTime) {
      const d = new Date(note.reminderDateTime);
      reminderDate = d.toISOString().split('T')[0];
      reminderTime = d.toTimeString().slice(0, 5);
    }
    setFormData({
      title: note.title || '',
      content: note.content || '',
      category: note.category || 'General',
      priority: note.priority || 'Medium',
      relatedTo: note.relatedTo || '',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : (note.tags || ''),
      isStarred: Boolean(note.isStarred),
      isReminder: Boolean(note.isReminder),
      reminderDate,
      reminderTime
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.content.trim()) nextErrors.content = 'Content is required';

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      let reminderDateTime = null;
      if (formData.isReminder && formData.reminderDate) {
        const timePart = formData.reminderTime || '09:00';
        reminderDateTime = new Date(`${formData.reminderDate}T${timePart}`);
      }

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        relatedTo: formData.relatedTo.trim(),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isStarred: formData.isStarred,
        isReminder: formData.isReminder,
        reminderDateTime
      };

      if (editingNote) {
        await noteAPI.update(editingNote._id, payload);
      } else {
        await noteAPI.create(payload);
      }

      setShowModal(false);
      fetchNotes();
      dataEventManager.emit(DATA_TYPES.NOTES);
    } catch (err) {
      console.error('Error saving note:', err);
      setFormErrors({ submit: handleAPIError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStar = async (e, note) => {
    e.stopPropagation();
    try {
      await noteAPI.toggleStar(note._id);
      setNotes(prev => prev.map(n => n._id === note._id ? { ...n, isStarred: !n.isStarred } : n));
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleDelete = (e, note) => {
    e.stopPropagation();
    setDeleteConfirmNote(note);
  };

  const confirmDeleteNote = async () => {
    if (!deleteConfirmNote) return;
    try {
      await noteAPI.delete(deleteConfirmNote._id);
      setNotes(prev => prev.filter(n => n._id !== deleteConfirmNote._id));
      dataEventManager.emit(DATA_TYPES.NOTES);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeleteConfirmNote(null);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'priority-badge priority-high';
      case 'Low': return 'priority-badge priority-low';
      default: return 'priority-badge priority-medium';
    }
  };

  return (
    <div className="notes-page-container">
      {/* Header */}
      <div className="notes-header">
        <div>
          <h1 className="notes-title">
            <FiFileText style={{ marginRight: '10px', color: '#006A4E' }} />
            Notes & Memos
          </h1>
          <p className="notes-subtitle">Capture meeting notes, follow-up reminders, and project memos</p>
        </div>
        <button type="button" className="notes-add-btn" onClick={handleOpenAddModal}>
          <FiPlus style={{ marginRight: '6px' }} />
          Add Note
        </button>
      </div>

      {/* Stats Cards */}
      <div className="notes-stats-grid">
        <div className="notes-stat-card">
          <div className="stat-label">Total Notes</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="notes-stat-card">
          <div className="stat-label">Starred</div>
          <div className="stat-value" style={{ color: '#eab308' }}>{stats.starred}</div>
        </div>
        <div className="notes-stat-card">
          <div className="stat-label">High Priority</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.highPriority}</div>
        </div>
        <div className="notes-stat-card">
          <div className="stat-label">Reminders</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.reminders}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="notes-controls">
        <div className="notes-search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search notes by title, content, or tags..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="notes-filter-group">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="notes-select"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="notes-select"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button 
            type="button" 
            className={`notes-toggle-btn ${starredOnly ? 'active' : ''}`}
            onClick={() => setStarredOnly(!starredOnly)}
          >
            <FiStar style={{ color: starredOnly ? '#eab308' : 'inherit', marginRight: '4px' }} />
            Starred
          </button>

          <div className="notes-view-mode">
            <button 
              type="button" 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button 
              type="button" 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="notes-loading">
          <div className="notes-spinner" />
          <p>Loading notes...</p>
        </div>
      ) : error ? (
        <div className="notes-error">
          <FiAlertCircle size={24} style={{ color: '#ef4444', marginBottom: '8px' }} />
          <p>{error}</p>
          <button type="button" onClick={fetchNotes} className="notes-retry-btn">Retry</button>
        </div>
      ) : notes.length === 0 ? (
        <div className="notes-empty">
          <FiFileText size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
          <h3>No notes found</h3>
          <p>Get started by creating your first note or adjusting search filters.</p>
          <button type="button" onClick={handleOpenAddModal} className="notes-add-btn">
            <FiPlus style={{ marginRight: '6px' }} />
            Create Note
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
          {notes.map(note => (
            <div 
              key={note._id} 
              className="note-card"
              onClick={() => handleOpenEditModal(note)}
            >
              <div className="note-card-header">
                <span className="note-category-pill">{note.category || 'General'}</span>
                <span className={getPriorityBadgeClass(note.priority)}>{note.priority || 'Medium'}</span>
                <button 
                  type="button" 
                  className={`note-star-btn ${note.isStarred ? 'starred' : ''}`}
                  onClick={(e) => handleToggleStar(e, note)}
                  title={note.isStarred ? 'Starred' : 'Mark as Starred'}
                >
                  <FiStar />
                </button>
              </div>

              <h3 className="note-card-title">{note.title}</h3>
              <p className="note-card-content">{note.content}</p>

              {note.relatedTo && (
                <div className="note-related-meta">
                  <FiFolder size={12} style={{ marginRight: '4px' }} />
                  {note.relatedTo}
                </div>
              )}

              {note.isReminder && note.reminderDateTime && (
                <div className="note-reminder-meta">
                  <FiClock size={12} style={{ marginRight: '4px' }} />
                  Reminder: {new Date(note.reminderDateTime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}

              {Array.isArray(note.tags) && note.tags.length > 0 && (
                <div className="note-tags-row">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="note-tag-item">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="note-card-footer">
                <span className="note-date">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-IN') : ''}
                </span>
                <div className="note-card-actions">
                  <button 
                    type="button" 
                    className="note-action-btn edit" 
                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(note); }}
                    title="Edit Note"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button 
                    type="button" 
                    className="note-action-btn delete" 
                    onClick={(e) => handleDelete(e, note)}
                    title="Delete Note"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="note-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <h2>{editingNote ? 'Edit Note' : 'Add New Note'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="note-modal-form">
              {formErrors.submit && <div className="note-form-error-banner">{formErrors.submit}</div>}

              <div className="note-form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder="Note title..." 
                  value={formData.title} 
                  onChange={handleFormChange}
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="note-form-row">
                <div className="note-form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="note-form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleFormChange}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="note-form-group">
                <label>Content *</label>
                <textarea 
                  name="content" 
                  rows="4" 
                  placeholder="Write note details, minutes, or action items..." 
                  value={formData.content} 
                  onChange={handleFormChange}
                />
                {formErrors.content && <span className="field-error">{formErrors.content}</span>}
              </div>

              <div className="note-form-row">
                <div className="note-form-group">
                  <label>Related Entity (Client/Project)</label>
                  <input 
                    type="text" 
                    name="relatedTo" 
                    placeholder="e.g. Acme Corp / Project X" 
                    value={formData.relatedTo} 
                    onChange={handleFormChange}
                  />
                </div>

                <div className="note-form-group">
                  <label>Tags (comma separated)</label>
                  <input 
                    type="text" 
                    name="tags" 
                    placeholder="billing, urgent, followup" 
                    value={formData.tags} 
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="note-reminder-toggle-box">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="isReminder" 
                    checked={formData.isReminder} 
                    onChange={handleFormChange}
                  />
                  <span>Set as Scheduled Reminder</span>
                </label>

                {formData.isReminder && (
                  <div className="reminder-inputs-row">
                    <input 
                      type="date" 
                      name="reminderDate" 
                      value={formData.reminderDate} 
                      onChange={handleFormChange}
                    />
                    <input 
                      type="time" 
                      name="reminderTime" 
                      value={formData.reminderTime} 
                      onChange={handleFormChange}
                    />
                  </div>
                )}
              </div>

              <div className="note-modal-actions">
                <button type="button" className="note-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="note-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : (editingNote ? 'Update Note' : 'Create Note')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={Boolean(deleteConfirmNote)}
        onClose={() => setDeleteConfirmNote(null)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete note "${deleteConfirmNote?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete Note"
        cancelText="Cancel"
        type="danger"
      />

      <Watermark />
    </div>
  );
};

export default NotesPage;
