import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './context/ToastContext';
import API_BASE_URL from './config/api';
import './styles/AnalyticsDashboard.css';
import DashboardFilters from './components/analytics/DashboardFilters';
import SummaryCards from './components/analytics/SummaryCards';
import ClientGraphs from './components/analytics/ClientGraphs';
import AssociateGraphs from './components/analytics/AssociateGraphs';
import PercentageConfigGraphs from './components/analytics/PercentageConfigGraphs';
import ProfitMarginGraphs from './components/analytics/ProfitMarginGraphs';
import ProjectGraphs from './components/analytics/ProjectGraphs';
import PaymentGraphs from './components/analytics/PaymentGraphs';
import CrossComparisonGraphs from './components/analytics/CrossComparisonGraphs';
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    console.log('📊 [ANALYTICS DASHBOARD] Starting fetchFilterOptions');
    console.log('📊 [ANALYTICS DASHBOARD] Token:', token ? 'Present' : 'Missing');
    console.log('📊 [ANALYTICS DASHBOARD] API_BASE_URL:', API_BASE_URL);
    
    if (!token) {
      console.error('❌ [ANALYTICS DASHBOARD] No token available for API calls');
      setError('Authentication required. Please log in.');
      return;
    }
    
    try {
      console.log('📊 [ANALYTICS DASHBOARD] Making API calls to filter options...');
      
      const [clientsRes, projectsRes, associatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/filter-options/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/analytics/filter-options/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/analytics/filter-options/associates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('📊 [ANALYTICS DASHBOARD] API Response status:');
      console.log('   - Clients:', clientsRes.status, clientsRes.statusText);
      console.log('   - Projects:', projectsRes.status, projectsRes.statusText);
      console.log('   - Associates:', associatesRes.status, associatesRes.statusText);

      // Check for authentication errors
      if (clientsRes.status === 401 || projectsRes.status === 401 || associatesRes.status === 401) {
        console.error('❌ [ANALYTICS DASHBOARD] Authentication failed (401)');
        showError('Authentication failed. Please log in again.');
        return;
      }

      // Check for other errors
      if (!clientsRes.ok || !projectsRes.ok || !associatesRes.ok) {
        console.error('❌ [ANALYTICS DASHBOARD] API calls failed:');
        console.error('   - Clients:', !clientsRes.ok ? `${clientsRes.status} ${clientsRes.statusText}` : 'OK');
        console.error('   - Projects:', !projectsRes.ok ? `${projectsRes.status} ${projectsRes.statusText}` : 'OK');
        console.error('   - Associates:', !associatesRes.ok ? `${associatesRes.status} ${associatesRes.statusText}` : 'OK');
        throw new Error('Failed to fetch filter options');
      }

      const [clients, projects, associates] = await Promise.all([
        clientsRes.json(),
        projectsRes.json(),
        associatesRes.json()
      ]);
      
      console.log('📊 [ANALYTICS DASHBOARD] Filter data received:');
      console.log('   - Clients:', Array.isArray(clients) ? clients.length : 'Invalid data', clients);
      console.log('   - Projects:', Array.isArray(projects) ? projects.length : 'Invalid data', projects);
      console.log('   - Associates:', Array.isArray(associates) ? associates.length : 'Invalid data', associates);

      setFilterOptions({ 
        clients: Array.isArray(clients) ? clients : [], 
        projects: Array.isArray(projects) ? projects : [], 
        associates: Array.isArray(associates) ? associates : [] 
      });
      
      console.log('✅ [ANALYTICS DASHBOARD] Filter options loaded successfully');
    } catch (error) {
      console.error('❌ [ANALYTICS DASHBOARD] Error in fetchFilterOptions:', error);
      console.error('❌ [ANALYTICS DASHBOARD] Error stack:', error.stack);
      showError('Failed to load filter options');
    }
  };

  const fetchDashboardData = async () => {
    console.log('📊 [ANALYTICS DASHBOARD] Starting fetchDashboardData with filters:', filters);
    console.log('📊 [ANALYTICS DASHBOARD] Token available:', !!token);
    
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
      console.log('📊 [ANALYTICS DASHBOARD] Fetching dashboard data from:', dashboardUrl);

      const response = await fetch(dashboardUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📊 [ANALYTICS DASHBOARD] Dashboard response status:', response.status, response.statusText);

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
      console.log('📊 [ANALYTICS DASHBOARD] Dashboard data received:', data);
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
    console.log('Drill down:', type, id, data);
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
    <div className={`analytics-dashboard ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="analytics-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setFullScreen(!fullScreen)}
            title={fullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {fullScreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowExportModal(true)}
          >
            <FaDownload /> Export
          </button>
        </div>
      </div>

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
          
          <div className="dashboard-grid">
            <section className="dashboard-section">
              <h2>Client Analytics</h2>
              <ClientGraphs 
                data={dashboardData.clients} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Associate Analytics</h2>
              <AssociateGraphs 
                data={dashboardData.associates} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Percentage Configuration</h2>
              <PercentageConfigGraphs 
                data={dashboardData.percentageConfig} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Profit Margin Analysis</h2>
              <ProfitMarginGraphs 
                data={dashboardData.profitMargins} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Project Analytics</h2>
              <ProjectGraphs 
                data={dashboardData.projects} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Payment Analytics</h2>
              <PaymentGraphs 
                data={dashboardData.payments} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>

            <section className="dashboard-section">
              <h2>Cross Comparisons</h2>
              <CrossComparisonGraphs 
                data={dashboardData.crossComparisons} 
                onExport={handleExportChart}
                onDrillDown={handleDrillDown}
              />
            </section>
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
  );
};

export default AnalyticsDashboard;