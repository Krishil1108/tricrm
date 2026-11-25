import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from './Calendar';
import { useCompany } from './CompanyContext';
import { useAuth } from './contexts/AuthContext';
import ActionModal from './components/ActionModal';
import ActivitySection from './components/ActivitySection';
import Watermark from './components/Watermark';
import axios from 'axios';
import API_BASE_URL from './config/api';
import clientCache from './utils/clientCache';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import './CRMDashboard.css';

const HomePage = () => {
  const { companyInfo } = useCompany();
  const { canViewStats, canViewAmounts, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tricrm_recent_searches') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [searchResults, setSearchResults] = useState({ clients: [], projects: [], associates: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [stats, setStats] = useState(() => {
    const cached = clientCache.get('home_dashboard_stats');
    if (cached) {
      return { ...cached, loading: false };
    }
    return {
      totalProjects: 0,
      totalClients: 0,
      totalAssociates: 0,
      totalExpenses: 0,
      loading: true
    };
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
    const fetchDashboardStats = async (forceRefresh = false) => {
      try {
        const token = localStorage.getItem('token');
        if (forceRefresh) {
          clientCache.invalidate('home_dashboard_stats');
        }
        
        // Use clientCache with SWR
        const data = await clientCache.fetchWithCache('home_dashboard_stats', async () => {
          const response = await axios.get(`${API_BASE_URL}/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            totalProjects: response.data.data.totalProjects || 0,
            totalClients: response.data.data.totalClients || 0,
            totalAssociates: response.data.data.totalAssociates || 0,
            totalExpenses: response.data.data.totalExpenses || 0
          };
        }, { force: forceRefresh });

        if (data) {
          setStats({
            ...data,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();

    // Real-time synchronization across modules
    const unsubClients = dataEventManager.subscribe(DATA_TYPES.CLIENTS, () => fetchDashboardStats(true));
    const unsubAssociates = dataEventManager.subscribe(DATA_TYPES.ASSOCIATES, () => fetchDashboardStats(true));
    const unsubProjects = dataEventManager.subscribe(DATA_TYPES.PROJECTS, () => fetchDashboardStats(true));
    const unsubExpenses = dataEventManager.subscribe(DATA_TYPES.EXPENSES, () => fetchDashboardStats(true));

    return () => {
      unsubClients();
      unsubAssociates();
      unsubProjects();
      unsubExpenses();
    };
  }, []);

  const handleSearch = async (query = searchTerm) => {
    const term = (query || '').trim();
    if (!term) {
      setShowSearchResults(false);
      return;
    }

    // Persist to recent searches (deduplicated, keep top 6)
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('tricrm_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');

      // Use optimized search endpoint - searches on backend instead of fetching all data
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { q: term },
        headers: { Authorization: `Bearer ${token}` }
      });

      setSearchResults({
        clients: response.data.data.clients || [],
        projects: response.data.data.projects || [],
        associates: response.data.data.associates || []
      });
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecentSearch = (term) => {
    setSearchTerm(term);
    handleSearch(term);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('tricrm_recent_searches');
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setShowSearchResults(false);
    }
  };

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
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Executive Snapshot</h3>
          <button
            type="button"
            onClick={() => navigate('/finance')}
            style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary, #4f46e5)', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
          >
            Open Finance Overview →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div className="ui-stat-card" onClick={() => navigate('/finance')} style={{ cursor: 'pointer' }}>
            <div className="ui-stat-top"><span className="ui-stat-label">Revenue Received</span></div>
            <div className="ui-stat-value tabular-nums" style={{ color: '#16a34a' }}>{formatCurrency(dashboardStats.totalRevenue)}</div>
            <div className="ui-stat-trend">{dashboardStats.totalProjects} projects tracked</div>
          </div>
          <div className="ui-stat-card" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="ui-stat-top"><span className="ui-stat-label">Pending Receipts</span></div>
            <div className="ui-stat-value tabular-nums" style={{ color: '#d97706' }}>{formatCurrency(dashboardStats.pendingAmount)}</div>
            <div className="ui-stat-trend">Awaiting client payments</div>
          </div>
          <div className="ui-stat-card" onClick={() => navigate('/associates')} style={{ cursor: 'pointer' }}>
            <div className="ui-stat-top"><span className="ui-stat-label">Active Associates</span></div>
            <div className="ui-stat-value tabular-nums">{dashboardStats.totalAssociates}</div>
            <div className="ui-stat-trend">Partner network</div>
          </div>
          <div className="ui-stat-card" onClick={() => navigate('/expenses')} style={{ cursor: 'pointer' }}>
            <div className="ui-stat-top"><span className="ui-stat-label">Expenses Logged</span></div>
            <div className="ui-stat-value tabular-nums" style={{ color: '#dc2626' }}>{formatCurrency(dashboardStats.totalExpenses)}</div>
            <div className="ui-stat-trend">{dashboardStats.totalClients} active clients</div>
          </div>
        </div>
      </div>
    );
  };

  // eslint-disable-next-line no-unused-vars
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
                placeholder="Search clients, projects, associates..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
              />
              {isSearching && (
                <div className="search-spinner">
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                </div>
              )}
            </div>

            {/* Recent Searches Chips */}
            {recentSearches.length > 0 && !showSearchResults && (
              <div className="recent-searches-chips" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Recent:</span>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectRecentSearch(term)}
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: '#334155'
                    }}
                  >
                    {term}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearRecentSearches}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '11px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="search-results-dropdown">
                {searchResults.clients.length === 0 && 
                 searchResults.projects.length === 0 && 
                 searchResults.associates.length === 0 ? (
                  <div className="search-no-results">No results found for "{searchTerm}"</div>
                ) : (
                  <>
                    {searchResults.clients.length > 0 && (
                      <div className="search-section">
                        <h4>Clients ({searchResults.clients.length})</h4>
                        {searchResults.clients.map(client => (
                          <div 
                            key={client._id} 
                            className="search-result-item"
                            onClick={() => {
                              navigate('/clients');
                              setShowSearchResults(false);
                              setSearchTerm('');
                            }}
                          >
                            <div className="result-icon">👤</div>
                            <div className="result-info">
                              <div className="result-name">{client.name}</div>
                              <div className="result-details">{client.company || client.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.projects.length > 0 && (
                      <div className="search-section">
                        <h4>Projects ({searchResults.projects.length})</h4>
                        {searchResults.projects.map(project => (
                          <div 
                            key={project._id} 
                            className="search-result-item"
                            onClick={() => {
                              navigate('/projects');
                              setShowSearchResults(false);
                              setSearchTerm('');
                            }}
                          >
                            <div className="result-icon">📁</div>
                            <div className="result-info">
                              <div className="result-name">{project.projectName}</div>
                              <div className="result-details">{project.projectNumber}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.associates.length > 0 && (
                      <div className="search-section">
                        <h4>Associates ({searchResults.associates.length})</h4>
                        {searchResults.associates.map(associate => (
                          <div 
                            key={associate._id} 
                            className="search-result-item"
                            onClick={() => {
                              navigate('/associates');
                              setShowSearchResults(false);
                              setSearchTerm('');
                            }}
                          >
                            <div className="result-icon">🤝</div>
                            <div className="result-info">
                              <div className="result-name">{associate.name}</div>
                              <div className="result-details">{associate.company || associate.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <button 
                  className="close-search-btn"
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchTerm('');
                  }}
                >
                  Close
                </button>
              </div>
            )}
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
            {canViewStats('home') && (
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

                {canViewAmounts('home') && (
                  <div 
                    className="metric-card green"
                    onClick={() => navigate('/expenses')}
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
                )}
              </div>
            )}

            {/* Quick Actions */}
            {hasPermission('home', 'quick_actions') && renderQuickActions()}
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