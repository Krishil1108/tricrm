import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './context/ToastContext';
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
    try {
      const [clientsRes, projectsRes, associatesRes] = await Promise.all([
        fetch('/api/analytics/filter-options/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/filter-options/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/filter-options/associates', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [clients, projects, associates] = await Promise.all([
        clientsRes.json(),
        projectsRes.json(),
        associatesRes.json()
      ]);

      setFilterOptions({ clients, projects, associates });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      showError('Failed to load filter options');
    }
  };

  const fetchDashboardData = async () => {
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

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      showError('Failed to load dashboard data');
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