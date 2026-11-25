import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './ui.css';

/**
 * Accessible shared Modal with Escape-key closing, backdrop click, and focus management (Fix 4 & 17).
 */
const Modal = ({ isOpen, onClose, title, children, footer = null, maxWidth = '560px' }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="ui-modal-dialog"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-header">
          <h2 className="ui-modal-title">{title}</h2>
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  maxWidth: PropTypes.string
};

export default Modal;
