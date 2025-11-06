import React from 'react';
import './PageContent.css';

const ServicesPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Our Services</h1>
        <p>Comprehensive solutions for your business needs</p>
      </div>
      
      <div className="page-content">
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">💻</div>
            <h3>Web Development</h3>
            <p>
              Custom web applications built with modern technologies like React, 
              Node.js, and MongoDB. Responsive, fast, and user-friendly designs.
            </p>
            <ul>
              <li>Frontend Development</li>
              <li>Backend APIs</li>
              <li>Database Design</li>
              <li>Performance Optimization</li>
            </ul>
          </div>
          
          <div className="service-card">
            <div className="service-icon">📱</div>
            <h3>Mobile Apps</h3>
            <p>
              Native and cross-platform mobile applications for iOS and Android. 
              Beautiful interfaces with seamless user experiences.
            </p>
            <ul>
              <li>iOS Development</li>
              <li>Android Development</li>
              <li>React Native</li>
              <li>App Store Deployment</li>
            </ul>
          </div>
          
          <div className="service-card">
            <div className="service-icon">☁️</div>
            <h3>Cloud Solutions</h3>
            <p>
              Scalable cloud infrastructure and deployment solutions. 
              Reliable, secure, and cost-effective hosting.
            </p>
            <ul>
              <li>AWS Deployment</li>
              <li>Docker Containers</li>
              <li>CI/CD Pipelines</li>
              <li>Monitoring & Analytics</li>
            </ul>
          </div>
          
          <div className="service-card">
            <div className="service-icon">🔧</div>
            <h3>Consulting</h3>
            <p>
              Technical consulting and architecture planning. 
              Expert guidance for your technology decisions.
            </p>
            <ul>
              <li>System Architecture</li>
              <li>Technology Selection</li>
              <li>Code Reviews</li>
              <li>Best Practices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;