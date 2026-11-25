import React from 'react';
import './Watermark.css';

const Watermark = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="arviz-watermark">
      © {currentYear} Arviz Intelligence (AI). All rights reserved.
    </div>
  );
};

export default Watermark;