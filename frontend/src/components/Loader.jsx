import React from 'react';
import './Loader.css';

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="modern-spinner" aria-hidden="true"></div>
        {message && <div className="loader-message">{message}</div>}
      </div>
    </div>
  );
};

export default Loader;