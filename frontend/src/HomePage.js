import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from './Calendar';
import { useCompany } from './CompanyContext';
import ActionModal from './components/ActionModal';
import ActivitySection from './components/ActivitySection';
import Watermark from './components/Watermark';
import axios from 'axios';
import './CRMDashboard.css';

const HomePage = () => {
  const { companyInfo } = useCompany();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalClients: 0,
    totalAssociates: 0,
    totalExpenses: 0,
    loading: true
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
        
        console.log('Fetching dashboard stats from:', API_BASE_URL);
        
        // Fetch all stats in parallel
        const [projectsRes, clientsRes, associatesRes, expensesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/finance/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/clients`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/associates`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/analytics/expense-distribution`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        console.log('Projects:', projectsRes.data);
        console.log('Clients:', clientsRes.data);
        console.log('Associates:', associatesRes.data);
        console.log('Expenses:', expensesRes.data);

        const totalExpenses = expensesRes.data.summary.drawing +
                             expensesRes.data.summary.documents +
                             expensesRes.data.summary.siteVisit +
                             expensesRes.data.summary.marketingAndMisc +
                             expensesRes.data.summary.officeManagement +
                             Object.values(expensesRes.data.summary.customFields).reduce((sum, val) => sum + val, 0);

        setStats({
          totalProjects: projectsRes.data.length || 0,
          totalClients: clientsRes.data.length || 0,
          totalAssociates: associatesRes.data.length || 0,
          totalExpenses: totalExpenses,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderQuickActions = () => {
    return (
      <div className="quick-actions-section">
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate('/clients')}>
            <div className="action-icon" style={{background: '#4CAF50'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <span>Manage Clients</span>
          </button>
          
          <button className="action-card" onClick={() => navigate('/projects')}>
            <div className="action-icon" style={{background: '#2196F3'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <span>View Projects</span>
          </button>
          
          <button className="action-card" onClick={() => navigate('/associates')}>
            <div className="action-icon" style={{background: '#FF9800'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span>Associates</span>
          </button>
          
          <button className="action-card" onClick={() => navigate('/analytics')}>
            <div className="action-icon" style={{background: '#9C27B0'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <span>Analytics</span>
          </button>
          
          <button className="action-card" onClick={() => navigate('/expense-distribution')}>
            <div className="action-icon" style={{background: '#F44336'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <span>Expenses</span>
          </button>
          
          <button className="action-card" onClick={() => navigate('/settings')}>
            <div className="action-icon" style={{background: '#607D8B'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>
            <span>Settings</span>
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    return null; // No tabs needed anymore
  };

  return (
    <div className="page-container">
      <div className="crm-header">
        <div className="company-header">
          <div className="company-logo">
            {companyInfo.logoUrl ? (
              <img src={companyInfo.logoUrl} alt={companyInfo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              typeof companyInfo.logo === 'string' ? companyInfo.logo : companyInfo.logo
            )}
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
            {/* Quick Stats Cards */}
            <div className="metrics-grid">
              <div 
                className="metric-card blue" 
                onClick={() => navigate('/projects')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Total Projects</span>
                </div>
                <div className="metric-number">{stats.loading ? '...' : stats.totalProjects}</div>
                <div className="metric-footer">
                  <span>Active & Completed</span>
                  <span className="metric-status">📁</span>
                </div>
              </div>

              <div 
                className="metric-card blue-dark"
                onClick={() => navigate('/clients')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Total Clients</span>
                </div>
                <div className="metric-number">{stats.loading ? '...' : stats.totalClients}</div>
                <div className="metric-footer">
                  <span>All Registered</span>
                  <span className="metric-status">👥</span>
                </div>
              </div>

              <div 
                className="metric-card orange"
                onClick={() => navigate('/associates')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Associates</span>
                </div>
                <div className="metric-number">{stats.loading ? '...' : stats.totalAssociates}</div>
                <div className="metric-footer">
                  <span>Active Associates</span>
                  <span className="metric-status">🤝</span>
                </div>
              </div>

              <div 
                className="metric-card green"
                onClick={() => navigate('/expense-distribution')}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-header">
                  <span className="metric-label">Total Expenses</span>
                </div>
                <div className="metric-number">{stats.loading ? '...' : formatCurrency(stats.totalExpenses).replace(/₹/, '')}</div>
                <div className="metric-footer">
                  <span>All Projects</span>
                  <span className="metric-status">💰</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {renderQuickActions()}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
      />
      
      {/* Watermark */}
      <Watermark />
    </div>
  );
};

export default HomePage;