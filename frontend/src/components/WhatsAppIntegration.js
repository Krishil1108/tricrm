import React, { useState } from 'react';
import WhatsAppService from '../services/WhatsAppService';
import { FaWhatsapp } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';
import './WhatsAppIntegration.css';

const WhatsAppIntegration = ({ client, quotation, onClose }) => {
  const [messageType, setMessageType] = useState('quotation');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const messageTypes = [
    { value: 'quotation', label: '📋 Send Quotation', icon: '📋' },
    { value: 'payment', label: '💳 Payment Reminder', icon: '💳' },
    { value: 'followup', label: '📞 Follow-up', icon: '📞' },
    { value: 'meeting', label: '📅 Meeting Reminder', icon: '📅' },
    { value: 'status', label: '📊 Status Update', icon: '📊' },
    { value: 'custom', label: '✏️ Custom Message', icon: '✏️' }
  ];

  const handleSendMessage = async () => {
    setIsLoading(true);
    
    try {
      // Validate client phone number before sending
      if (!client.phone || client.phone.trim() === '') {
        showError('Client phone number is missing. Cannot send WhatsApp message.');
        return;
      }

      switch (messageType) {
        case 'quotation':
          if (quotation) {
            WhatsAppService.sendQuotation(client, quotation);
          } else {
            showWarning('Please select a quotation to send');
            return;
          }
          break;
          
        case 'payment':
          const invoiceData = {
            invoiceNumber: quotation?.quotationNumber || 'INV-001',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            amount: quotation?.amount || 0
          };
          WhatsAppService.sendPaymentReminder(client, invoiceData);
          break;
          
        case 'followup':
          if (!customMessage.trim()) {
            setModalConfig({
              title: 'Follow-up Message Required',
              message: 'Please enter a follow-up message before sending to your client.',
              type: 'warning',
              confirmText: 'OK'
            });
            setShowModal(true);
            return;
          }
          WhatsAppService.sendFollowUp(client, customMessage);
          break;
          
        case 'meeting':
          const meetingData = {
            date: new Date(),
            time: '10:00 AM',
            location: 'TechCorp Office',
            topic: 'Business Discussion'
          };
          WhatsAppService.sendMeetingReminder(client, meetingData);
          break;

        case 'status':
          WhatsAppService.sendQuoteStatusUpdate(client, quotation, quotation?.status || 'pending');
          break;
          
        case 'custom':
          if (!customMessage.trim()) {
            setModalConfig({
              title: 'Custom Message Required',
              message: 'Please enter your custom message content before sending.',
              type: 'warning',
              confirmText: 'OK'
            });
            setShowModal(true);
            return;
          }
          WhatsAppService.sendDirectMessage(client.phone, customMessage);
          break;
          
        default:
          break;
      }
      
      // Log the activity
      console.log(`WhatsApp message sent to ${client.name} (${client.phone})`);
      // Show success message with action feedback
      setModalConfig({
        title: 'WhatsApp Opened Successfully',
        message: `WhatsApp has been opened with your message ready to send to ${client.name} at ${client.phone}. Please complete the sending process in WhatsApp.`,
        type: 'success',
        confirmText: 'Got it'
      });
      setShowModal(true);
      
      // Close the modal after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      
      // Show specific error message
      if (error.message.includes('Invalid phone number')) {
        setModalConfig({
          title: 'Phone Number Error',
          message: `Cannot send message: ${error.message}. Please update the client's phone number and try again.`,
          type: 'error',
          confirmText: 'OK'
        });
        setShowModal(true);
      } else {
        showError('Error sending message. Please check the phone number and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const previewMessage = () => {
    switch (messageType) {
      case 'quotation':
        return quotation ? WhatsAppService.generateQuotationMessage(client, quotation) : 'Please select a quotation';
      case 'payment':
        return `Payment reminder for ${client.name} - Amount: ₹${quotation?.amount || 0}`;
      case 'followup':
        return customMessage || 'Enter your follow-up message...';
      case 'meeting':
        return `Meeting reminder for ${client.name} - Business Discussion at TechCorp Office`;
      case 'status':
        return `Quote status update for ${client.name} - ${quotation?.quotationNumber} is ${quotation?.status || 'pending'}`;
      case 'custom':
        return customMessage || 'Enter your custom message...';
      default:
        return '';
    }
  };

  return (
    <div className="whatsapp-modal-overlay">
      <div className="whatsapp-modal">
        <div className="whatsapp-header">
          <div className="whatsapp-title">
            <FaWhatsapp className="whatsapp-icon" size={24} />
            <h3>Send WhatsApp Message</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="whatsapp-content">
          {/* Client Info */}
          <div className="client-info">
            <div className="client-avatar">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="client-details">
              <h4>{client.name}</h4>
              <div className="phone-info">
                <strong>📱 Phone:</strong> 
                <span className={`phone-number ${!client.phone ? 'missing' : 'valid'}`}>
                  {client.phone || 'No phone number available'}
                </span>
              </div>
              {client.email && <p>✉️ {client.email}</p>}
              {client.company && <p>🏢 {client.company}</p>}
            </div>
          </div>

          {/* Quote Info */}
          {quotation && (
            <div className="quote-info">
              <h4>Quotation Details</h4>
              <div className="quote-details">
                <span><strong>Quote #:</strong> {quotation.quotationNumber}</span>
                <span><strong>Amount:</strong> ₹{quotation.amount}</span>
                <span><strong>Status:</strong> {quotation.status}</span>
                <span><strong>Created:</strong> {new Date(quotation.created).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Message Type Selection */}
          <div className="message-type-section">
            <label>Select Message Type</label>
            <div className="message-type-grid">
              {messageTypes.map(type => (
                <button
                  key={type.value}
                  className={`message-type-btn ${messageType === type.value ? 'active' : ''}`}
                  onClick={() => setMessageType(type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input */}
          {(messageType === 'custom' || messageType === 'followup') && (
            <div className="custom-message-section">
              <label>Your Message</label>
              <textarea
                className="custom-message-input"
                placeholder="Enter your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Phone Number Warning */}
          {!client.phone && (
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              <div>
                <strong>No Phone Number Available</strong>
                <p>This client doesn't have a phone number. Please add a phone number to send WhatsApp messages.</p>
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div className="message-preview-section">
            <label>Message Preview</label>
            <div className="message-preview">
              <div className="whatsapp-bubble">
                <pre>{previewMessage()}</pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="whatsapp-actions">
            <button 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="send-whatsapp-btn" 
              onClick={handleSendMessage}
              disabled={isLoading || !client.phone}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending...
                </>
              ) : !client.phone ? (
                <>
                  <span className="whatsapp-icon">❌</span>
                  Phone Number Required
                </>
              ) : (
                <>
                  <FaWhatsapp className="whatsapp-icon" size={16} />
                  Send via WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error/Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
};

export default WhatsAppIntegration;