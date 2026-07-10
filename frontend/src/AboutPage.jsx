import React from 'react';
import './PageContent.css';

const AboutPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>About Us</h1>
        <p>Learn more about our company and mission</p>
      </div>
      
      <div className="page-content">
        <div className="content-section">
          <h2>Our Story</h2>
          <p>
            We are a modern technology company focused on creating innovative solutions 
            that help businesses grow and succeed in the digital age. Our team is passionate 
            about delivering exceptional experiences through cutting-edge technology.
          </p>
        </div>
        
        <div className="content-section">
          <h2>Our Mission</h2>
          <p>
            To empower businesses with intuitive, scalable, and reliable software solutions 
            that drive productivity and growth. We believe in the power of technology to 
            transform the way people work and live.
          </p>
        </div>
        
        <div className="content-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">🚀</div>
              <h3>Innovation</h3>
              <p>Always pushing boundaries and exploring new possibilities</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🤝</div>
              <h3>Collaboration</h3>
              <p>Working together to achieve extraordinary results</p>
            </div>
            <div className="value-item">
              <div className="value-icon">💎</div>
              <h3>Quality</h3>
              <p>Delivering excellence in everything we do</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🌟</div>
              <h3>Growth</h3>
              <p>Continuous learning and improvement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;