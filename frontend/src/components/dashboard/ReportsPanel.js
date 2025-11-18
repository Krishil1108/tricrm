import React from 'react';
import ClientReports from './ClientReports';
import AssociateReports from './AssociateReports';
import ProjectReports from './ProjectReports';

const ReportsPanel = ({
  activeTab,
  onTabChange,
  graphType,
  timeGrouping,
  clientData,
  inventoryData,
  associateData,
  projectData,
  dateRange,
  clientFilters,
  inventoryFilters,
  loading,
  error
}) => {
  
  const tabs = [
    { id: 'clients', label: 'Client Reports', icon: '👥' },
    { id: 'associates', label: 'Associate Reports', icon: '🤝' },
    { id: 'projects', label: 'Project Reports', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="reports-panel">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-panel">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-panel">
      {/* Tab Navigation */}
      <div className="reports-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Status Indicator */}
      {(clientFilters?.status !== 'all' || clientFilters?.type !== 'all') && (
        <div className="filter-status">
          <span className="filter-indicator">🔍 Filters Applied:</span>
          <>
            {clientFilters?.status !== 'all' && (
              <span className="filter-tag">Status: {clientFilters.status}</span>
            )}
            {clientFilters?.type !== 'all' && (
              <span className="filter-tag">Type: {clientFilters.type}</span>
            )}
          </>
        </div>
      )}

      {/* Tab Content */}
      <div className="reports-content">
        {activeTab === 'clients' && (
          <ClientReports
            data={clientData}
            graphType={graphType}
            timeGrouping={timeGrouping}
            dateRange={dateRange}
          />
        )}
        {activeTab === 'associates' && (
          <AssociateReports
            data={associateData}
            graphType={graphType}
            timeGrouping={timeGrouping}
            dateRange={dateRange}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectReports
            data={projectData}
            graphType={graphType}
            timeGrouping={timeGrouping}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Reports Summary */}
      <div className="reports-summary">
        <div className="summary-stats">
          {activeTab === 'clients' && (
            <>
              <div className="stat-item">
                <span className="stat-value">{clientData?.totalClients || 0}</span>
                <span className="stat-label">
                  {clientFilters?.status !== 'all' ? `${clientFilters.status.charAt(0).toUpperCase() + clientFilters.status.slice(1)} Clients` : 'Total Clients'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.activeClients || 0}</span>
                <span className="stat-label">Active Clients</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.newClientsThisMonth || 0}</span>
                <span className="stat-label">New This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.growthRate || '0%'}</span>
                <span className="stat-label">Growth Rate</span>
              </div>
            </>
          )}
          {activeTab === 'associates' && (
            <>
              <div className="stat-item">
                <span className="stat-value">{associateData?.totalAssociates || 0}</span>
                <span className="stat-label">Total Associates</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{associateData?.totalProjects || 0}</span>
                <span className="stat-label">Total Projects</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{associateData?.avgProjectsPerAssociate || 0}</span>
                <span className="stat-label">Avg Projects/Associate</span>
              </div>
            </>
          )}
          {activeTab === 'projects' && (
            <>
              <div className="stat-item">
                <span className="stat-value">{projectData?.totalProjects || 0}</span>
                <span className="stat-label">Total Projects</span>
              </div>
              {projectData?.statusBreakdown && Object.entries(projectData.statusBreakdown).map(([status, count]) => (
                <div className="stat-item" key={status}>
                  <span className="stat-value">{count}</span>
                  <span className="stat-label">{status}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;