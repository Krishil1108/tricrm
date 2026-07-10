import React from 'react';
import './HamburgerMenu.css';

const HamburgerMenu = ({ isOpen, toggleSidebar }) => {
  return (
    <button 
      className={`hamburger ${isOpen ? 'open' : ''} ${isOpen ? 'expanded-position' : 'collapsed-position'}`}
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
    </button>
  );
};

export default HamburgerMenu;