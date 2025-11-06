import React, { useState } from 'react';
import Calendar from './Calendar';
import { useCompany } from './CompanyContext';
import ActionModal from './components/ActionModal';
import ActivitySection from './components/ActivitySection';
import './CRMDashboard.css';

const HomePage = () => {
  const { companyInfo } = useCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'Overview':
        return (
          <div className="overview-section">
            <div className="section-header">
              <h3>Overview</h3>
              <div className="section-actions">
                <button 
                  className="icon-btn"
                  onClick={() => alert('Chart view - Switch to graphical representation')}
                  title="Chart View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                </button>
                <button 
                  className="icon-btn"
                  onClick={() => alert('Settings - Configure overview display options')}
                  title="Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overview-content">
              <div className="progress-item">
                <span className="progress-label">Marketing management system and licenses</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '75%'}}></div>
                </div>
                <span className="progress-value">75%</span>
              </div>
              
              <div className="progress-item">
                <span className="progress-label">Marketing software solutions</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '60%'}}></div>
                </div>
                <span className="progress-value">60%</span>
              </div>
              
              <div className="overview-notes">
                <p><strong>Comments:</strong></p>
                <p>New client: First task, The client needs marketing system and licenses.</p>
              </div>
            </div>
          </div>
        );
      case 'Processing':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Processing Pipeline</h3>
            </div>
            <div className="processing-content">
              <div className="pipeline-stages">
                <div className="stage active">
                  <h4>Initial Contact</h4>
                  <p>3 leads in progress</p>
                  <div className="stage-progress" style={{width: '40%'}}></div>
                </div>
                <div className="stage">
                  <h4>Qualification</h4>
                  <p>2 leads being qualified</p>
                  <div className="stage-progress" style={{width: '60%'}}></div>
                </div>
                <div className="stage">
                  <h4>Proposal</h4>
                  <p>1 proposal pending</p>
                  <div className="stage-progress" style={{width: '80%'}}></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Opportunity stages':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Opportunity Stages</h3>
            </div>
            <div className="opportunity-content">
              <div className="opportunity-list">
                <div className="opportunity-item high-value">
                  <h4>TechCorp Enterprise License</h4>
                  <p>Value: $50,000 | Stage: Negotiation</p>
                  <div className="probability">Probability: 85%</div>
                </div>
                <div className="opportunity-item medium-value">
                  <h4>Marketing Software Suite</h4>
                  <p>Value: $25,000 | Stage: Proposal</p>
                  <div className="probability">Probability: 60%</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Products':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Product Catalog</h3>
            </div>
            <div className="products-content">
              <div className="product-grid">
                <div className="product-card">
                  <h4>CRM Software</h4>
                  <p>Advanced customer relationship management</p>
                  <div className="product-price">Starting at $99/month</div>
                </div>
                <div className="product-card">
                  <h4>Marketing Suite</h4>
                  <p>Complete marketing automation tools</p>
                  <div className="product-price">Starting at $149/month</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'History':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Activity History</h3>
            </div>
            <div className="history-content">
              <div className="history-timeline">
                <div className="history-item">
                  <div className="history-date">Oct 31, 2025</div>
                  <div className="history-action">Updated client information for TechCorp Solutions</div>
                </div>
                <div className="history-item">
                  <div className="history-date">Oct 30, 2025</div>
                  <div className="history-action">Generated quotation Q-1001</div>
                </div>
                <div className="history-item">
                  <div className="history-date">Oct 29, 2025</div>
                  <div className="history-action">Scheduled follow-up meeting</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'News':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Company News & Updates</h3>
            </div>
            <div className="news-content">
              <div className="news-list">
                <div className="news-item">
                  <div className="news-date">Oct 31, 2025</div>
                  <h4>New CRM Features Released</h4>
                  <p>Enhanced reporting capabilities and improved user interface now available.</p>
                </div>
                <div className="news-item">
                  <div className="news-date">Oct 28, 2025</div>
                  <h4>Q4 Sales Targets</h4>
                  <p>Updated quarterly targets and new incentive programs announced.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="crm-header">
        <div className="company-header">
          <div className="company-logo">
            {typeof companyInfo.logo === 'string' ? companyInfo.logo : companyInfo.logo}
          </div>
          <div className="company-info">
            {isEditingCompany ? (
              <div className="company-edit-form">
                <input 
                  type="text" 
                  defaultValue={companyInfo.name}
                  className="company-name-input"
                  placeholder="Company Name"
                />
                <input 
                  type="text" 
                  defaultValue={companyInfo.tagline}
                  className="company-tagline-input"
                  placeholder="Company Tagline"
                />
                <div className="edit-buttons">
                  <button 
                    className="save-btn"
                    onClick={() => {
                      setIsEditingCompany(false);
                      alert('Company information saved!');
                    }}
                  >
                    Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setIsEditingCompany(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="company-display" onClick={() => setIsEditingCompany(true)}>
                <h1 className="company-name">{companyInfo.name}</h1>
                <p className="company-tagline">{companyInfo.tagline}</p>
                <span className="edit-hint">Click to edit</span>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="header-search">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search clients, products, activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    alert(`Searching for: "${searchTerm}"`);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="crm-content">
        {/* Top Navigation Tabs */}
        <div className="crm-tabs">
          {['Overview', 'Processing', 'Opportunity stages', 'Products', 'History', 'News'].map(tab => (
            <div 
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ cursor: 'pointer' }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <div className="crm-dashboard">
          {/* Left Section - Calendar and Metrics */}
          <div className="dashboard-sidebar">
            <div className="calendar-section">
              <Calendar onDateSelect={handleDateSelect} />
            </div>
            
            <ActivitySection />
          </div>

          {/* Main Content Area */}
          <div className="dashboard-main">
            {/* Metric Cards */}
            <div className="metrics-grid">
              <div 
                className="metric-card blue" 
                onClick={() => alert('Days in funnel details - Navigate to detailed pipeline view')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Days in funnel</span>
                </div>
                <div className="metric-number">16</div>
                <div className="metric-footer">
                  <span>Marketing management...</span>
                  <span className="metric-status">Andrew Baker</span>
                </div>
              </div>

              <div 
                className="metric-card blue-dark"
                onClick={() => alert('Current stage details - View stage progression')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Days at current stage</span>
                </div>
                <div className="metric-number">14</div>
                <div className="metric-footer">
                  <span>Real-time</span>
                  <span className="metric-status">Andrew Baker</span>
                </div>
              </div>

              <div 
                className="metric-card orange"
                onClick={() => alert('Leads won - View success metrics and closed deals')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Leads won</span>
                </div>
                <div className="metric-number">6</div>
                <div className="metric-footer">
                  <span>Account</span>
                  <span className="metric-status">Corner</span>
                </div>
              </div>

              <div 
                className="metric-card green"
                onClick={() => alert('Call log details - View recent calls and schedule new ones')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Outgoing calls</span>
                </div>
                <div className="metric-number">4</div>
                <div className="metric-footer">
                  <span>6/1/2025 2:25 PM</span>
                  <span className="metric-status">Direct call</span>
                </div>
              </div>
            </div>

            {/* Dynamic Tab Content */}
            {renderTabContent()}

            {/* Next Steps */}
            <div className="next-steps">
              <h4>Next Steps</h4>
              <div className="step-item">
                <span className="step-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </span>
                <span>Assign opportunity owner</span>
              </div>
              <div className="step-item">
                <span className="step-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </span>
                <span>Real Peterson - 16.12.2021</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default HomePage;