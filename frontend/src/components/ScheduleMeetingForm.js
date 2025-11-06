import React, { useState } from 'react';
import { meetingAPI, handleAPIError } from '../services/api';
import { dataEventManager, DATA_TYPES } from '../services/dataEventManager';

const ScheduleMeetingForm = ({ selectedDate, onClose, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: selectedDate.toISOString().split('T')[0],
    time: '',
    duration: '60',
    location: '',
    attendees: '',
    type: 'Meeting',
    priority: 'Medium',
    reminderMinutes: '15'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const meetingDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const response = await meetingAPI.create({
        ...formData,
        dateTime: meetingDateTime.toISOString(),
        duration: Number(formData.duration),
        reminderMinutes: Number(formData.reminderMinutes),
        attendees: formData.attendees.split(',').map(email => email.trim()).filter(email => email)
      });
      
      console.log('Meeting scheduled successfully:', response.data);
      dataEventManager.emit(DATA_TYPES.MEETINGS, response.data);
      onClose();
    } catch (err) {
      setError(handleAPIError(err));
      console.error('Error scheduling meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="title">Meeting Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter meeting title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Meeting agenda or description..."
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Time *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="type">Meeting Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="Meeting">Meeting</option>
              <option value="Call">Phone Call</option>
              <option value="Video Call">Video Call</option>
              <option value="Presentation">Presentation</option>
              <option value="Training">Training</option>
              <option value="Interview">Interview</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Meeting room, address, or video link"
          />
        </div>

        <div className="form-group">
          <label htmlFor="attendees">Attendees (Email addresses)</label>
          <input
            type="text"
            id="attendees"
            name="attendees"
            value={formData.attendees}
            onChange={handleInputChange}
            placeholder="email1@example.com, email2@example.com"
          />
          <small style={{ color: '#666', fontSize: '0.8rem' }}>
            Separate multiple email addresses with commas
          </small>
        </div>

        <div className="form-row">
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
          <div className="form-group">
            <label htmlFor="reminderMinutes">Reminder</label>
            <select
              id="reminderMinutes"
              name="reminderMinutes"
              value={formData.reminderMinutes}
              onChange={handleInputChange}
            >
              <option value="0">No reminder</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleMeetingForm;