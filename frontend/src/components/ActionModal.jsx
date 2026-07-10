import React, { useState } from 'react';
import './ActionModal.css';
import AddClientForm from './AddClientForm';
// import AddInventoryForm from './AddInventoryForm'; // Removed inventory functionality
import ScheduleMeetingForm from './ScheduleMeetingForm';
import AddNotesForm from './AddNotesForm';

const ActionModal = ({ isOpen, onClose, selectedDate }) => {
  const [selectedAction, setSelectedAction] = useState(null);

  if (!isOpen) return null;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const actions = [
    { id: 'client', title: 'Add Client', icon: '👤', description: 'Add a new client to your CRM' },
    { id: 'meeting', title: 'Schedule Meeting', icon: '📅', description: 'Schedule a meeting or appointment' },
    { id: 'notes', title: 'Add Notes', icon: '📝', description: 'Add notes or reminders' }
  ];

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
  };

  const handleBackToActions = () => {
    setSelectedAction(null);
  };

  const handleClose = () => {
    setSelectedAction(null);
    onClose();
  };

  const renderActionForm = () => {
    switch (selectedAction) {
      case 'client':
        return <AddClientForm selectedDate={selectedDate} onClose={handleClose} onBack={handleBackToActions} />;
      case 'meeting':
        return <ScheduleMeetingForm selectedDate={selectedDate} onClose={handleClose} onBack={handleBackToActions} />;
      case 'notes':
        return <AddNotesForm selectedDate={selectedDate} onClose={handleClose} onBack={handleBackToActions} />;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {selectedAction ? actions.find(a => a.id === selectedAction)?.title : 'What would you like to do?'}
          </h2>
          <p className="selected-date">{formatDate(selectedDate)}</p>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {selectedAction ? (
            renderActionForm()
          ) : (
            <div className="action-grid">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="action-card"
                  onClick={() => handleActionSelect(action.id)}
                >
                  <div className="action-icon">{action.icon}</div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionModal;