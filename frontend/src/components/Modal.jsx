import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle, FaQuestion } from 'react-icons/fa';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  showCancel = false, 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  children 
}) => {
  
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="modal-icon-success" />;
      case 'error':
        return <FaTimesCircle className="modal-icon-error" />;
      case 'warning':
        return <FaExclamationTriangle className="modal-icon-warning" />;
      case 'confirm':
        return <FaQuestion className="modal-icon-confirm" />;
      default:
        return <FaInfoCircle className="modal-icon-info" />;
    }
  };

  const getModalClass = () => {
    switch (type) {
      case 'success':
        return 'modal-success';
      case 'error':
        return 'modal-error';
      case 'warning':
        return 'modal-warning';
      case 'confirm':
        return 'modal-confirm';
      default:
        return 'modal-info';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-dialog ${getModalClass()}`}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon">
              {getIcon()}
            </div>
            {title && <h3 className="modal-title">{title}</h3>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-content">
          {message && (
            <div className="modal-message">
              {message}
            </div>
          )}
          {children}
        </div>
        
        <div className="modal-footer">
          {showCancel && (
            <button 
              className="modal-btn modal-btn-cancel" 
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="modal-btn modal-btn-confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;