import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './context/ToastContext';
import API_BASE_URL from './config/api';
import './styles/AnalyticsDashboard.css';
import './styles/AnalyticsChartsGrid.css';
import './PageContent.css';
import './styles/ClientsPageEnhanced.css';
import DashboardFilters from './components/analytics/DashboardFilters';
import SummaryCards from './components/analytics/SummaryCards';
import AnalyticsChart from './components/analytics/AnalyticsChart';
import LoadingSkeleton from './components/analytics/LoadingSkeleton';
import ExportModal from './components/analytics/ExportModal';
import { FaDownload, FaExpand, FaCompress } from 'react-icons/fa';

const AnalyticsDashboard = () => {
  const { token } = useAuth();
  const { showError } = useToast();
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: null,
    endDate: null,
    clientIds: [],
    projectIds: [],
    associateIds: [],
    status: 'all'
  });

  // Data states
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    clients: {},
    associates: {},
    percentageConfig: {},
    profitMargins: {},
    projects: {},
    payments: {},
    crossComparisons: {}
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);

  // Fetch options for filters
  const [filterOptions, setFilterOptions] = useState({
    clients: [],
    projects: [],
    associates: []
  });

  useEffect(() => {
    fetchFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchFilterOptions = async () => {
    if (!token) {
      console.error('❌ [ANALYTICS DASHBOARD] No token available for API calls');
      setError('Authentication required. Please log in.');
      return;
    }
    
    try {
      // Make individual API calls with error handling for each
      const fetchClient = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/analytics/filter-options/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
          return [];
        } catch (error) {
          console.error('❌ [ANALYTICS DASHBOARD] Clients API error:', error);
          return [];
        }
      };

      const fetchProjects = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/analytics/filter-options/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
          return [];
        } catch (error) {
          console.error('❌ [ANALYTICS DASHBOARD] Projects API error:', error);
          return [];
        }
      };

      const fetchAssociates = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/analytics/filter-options/associates`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
          return [];
        } catch (error) {
          console.error('❌ [ANALYTICS DASHBOARD] Associates API error:', error);
          return [];
        }
      };

      // Fetch all data concurrently
      const [clients, projects, associates] = await Promise.all([
        fetchClient(),
        fetchProjects(),
        fetchAssociates()
      ]);

      setFilterOptions({ clients, projects, associates });
    } catch (error) {
      console.error('❌ [ANALYTICS DASHBOARD] Error in fetchFilterOptions:', error);
      console.error('❌ [ANALYTICS DASHBOARD] Error stack:', error.stack);
      showError('Failed to load filter options: ' + error.message);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) {
      console.error('❌ [ANALYTICS DASHBOARD] No token for dashboard data fetch');
      setError('Authentication required');
      return;
    }
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter params
      Object.keys(filters).forEach(key => {
        if (filters[key] && (Array.isArray(filters[key]) ? filters[key].length > 0 : true)) {
          if (Array.isArray(filters[key])) {
            queryParams.append(key, filters[key].join(','));
          } else {
            queryParams.append(key, filters[key]);
          }
        }
      });

      const dashboardUrl = `${API_BASE_URL}/analytics/dashboard?${queryParams}`;

      const response = await fetch(dashboardUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ [ANALYTICS DASHBOARD] Dashboard authentication failed (401)');
          setError('Authentication failed. Please log in again.');
          return;
        }
        const errorText = await response.text();
        console.error('❌ [ANALYTICS DASHBOARD] Dashboard API error:', errorText);
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('❌ [ANALYTICS DASHBOARD] Error fetching dashboard data:', error);
      setError(error.message);
      showError('Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExportChart = (chartRef, chartTitle) => {
    setSelectedChart({ ref: chartRef, title: chartTitle });
    setShowExportModal(true);
  };

  const handleDrillDown = (type, id, data) => {
    // Handle drill-down navigation
    // Implement navigation to detailed view
  };

  if (error) {
    return (
      <div className="analytics-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`analytics-page-enhanced${fullScreen ? ' fullscreen' : ''}`}>
      <div className="modern-page-header">
        <div className="header-content-enhanced">
          <div className="header-title-section">
            <div className="title-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="header-icon">
                <path d="M3 13h8V3H9v6H5V3H3v10zm0 8h8v-6H9v2H5v-2H3v6zm10 0h8V11h-2v6h-4v-6h-2v10zm0-18v6h8V3h-8z"/>
              </svg>
              <h1 className="page-title-enhanced">Analytics Dashboard</h1>
            </div>
          </div>
          <div className="header-actions-enhanced">
            <button
              className="btn-secondary-modern fullscreen-btn"
              onClick={() => setFullScreen(!fullScreen)}
              title={fullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <div className="btn-icon-wrapper">
                {fullScreen ? <FaCompress /> : <FaExpand />}
              </div>
            </button>
            <button
              className="btn-primary-modern export-enhanced"
              onClick={() => setShowExportModal(true)}
            >
              <div className="btn-icon-wrapper">
                <FaDownload />
              </div>
              <span className="btn-text">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`analytics-content-wrapper${fullScreen ? ' fullscreen-content' : ''}`}>
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        options={filterOptions}
        loading={loading}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <SummaryCards data={dashboardData.summary} />
          
          <div className="analytics-charts-grid">
            <AnalyticsChart 
              chartType="clients"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="projects"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="revenue"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="netprofit"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="expenses"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />

            <AnalyticsChart 
              chartType="expenseComparison"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="associates"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
            
            <AnalyticsChart 
              chartType="payments"
              token={token}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
        </>
      )}

      {showExportModal && (
        <ExportModal
          chartRef={selectedChart?.ref}
          chartTitle={selectedChart?.title}
          onClose={() => setShowExportModal(false)}
        />
      )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;