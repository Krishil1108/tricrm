import React, { useState } from 'react';
import { noteAPI, handleAPIError } from '../services/api';
import { dataEventManager, DATA_TYPES } from '../services/dataEventManager';

const AddNotesForm = ({ selectedDate, onClose, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    tags: '',
    relatedTo: '',
    isReminder: false,
    reminderDate: selectedDate.toISOString().split('T')[0],
    reminderTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let reminderDateTime = null;
      if (formData.isReminder && formData.reminderDate && formData.reminderTime) {
        reminderDateTime = new Date(`${formData.reminderDate}T${formData.reminderTime}`);
      }

      const response = await noteAPI.create({
        ...formData,
        dateCreated: selectedDate.toISOString(),
        reminderDateTime: reminderDateTime?.toISOString(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      console.log('Note added successfully:', response.data);
      dataEventManager.emit(DATA_TYPES.NOTES, response.data);
      onClose();
    } catch (err) {
      setError(handleAPIError(err));
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="title">Note Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter note title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            placeholder="Write your note here..."
            rows="6"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="General">General</option>
              <option value="Client">Client Related</option>
              <option value="Project">Project</option>
              <option value="Meeting">Meeting Notes</option>
              <option value="Task">Task</option>
              <option value="Idea">Idea</option>
              <option value="Important">Important</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="tag1, tag2, tag3"
          />
          <small style={{ color: '#666', fontSize: '0.8rem' }}>
            Separate multiple tags with commas
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="relatedTo">Related To</label>
          <input
            type="text"
            id="relatedTo"
            name="relatedTo"
            value={formData.relatedTo}
            onChange={handleInputChange}
            placeholder="Client name, project, or reference"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              name="isReminder"
              checked={formData.isReminder}
              onChange={handleInputChange}
            />
            Set as reminder
          </label>
        </div>

        {formData.isReminder && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reminderDate">Reminder Date</label>
              <input
                type="date"
                id="reminderDate"
                name="reminderDate"
                value={formData.reminderDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reminderTime">Reminder Time</label>
              <input
                type="time"
                id="reminderTime"
                name="reminderTime"
                value={formData.reminderTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddNotesForm;