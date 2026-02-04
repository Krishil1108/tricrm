import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExpenseDistribution.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const ExpenseDistribution = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    drawing: 0,
    documents: 0,
    siteVisit: 0,
    marketingAndMisc: 0,
    officeManagement: 0,
    customFields: {}
  });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedView, setSelectedView] = useState('summary'); // summary, projects, clients
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('📊 Fetching expense distribution from:', `${API_BASE_URL}/analytics/expense-distribution`);
      const response = await axios.get(`${API_BASE_URL}/analytics/expense-distribution`, config);
      
      setSummary(response.data.summary);
      setProjects(response.data.projects);
      setClients(response.data.clients);
    } catch (err) {
      console.error('Error fetching expense data:', err);
      console.error('API URL:', `${API_BASE_URL}/analytics/expense-distribution`);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to load expense distribution data';
      
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend is running.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint not found. Please ensure backend is updated with latest changes.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getFieldLabel = (fieldKey) => {
    const labels = {
      drawing: 'Drawing',
      documents: 'Documents',
      siteVisit: 'Site Visit',
      marketingAndMisc: 'Marketing & Misc',
      officeManagement: 'Office Management'
    };
    return labels[fieldKey] || fieldKey;
  };

  const filteredProjects = projects.filter(project =>
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="expense-distribution-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading expense distribution data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expense-distribution-container">
        <div className="error-state">
          <p>❌ {error}</p>
          {error.includes('Network error') && (
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              💡 If you're on production, the backend may need to be redeployed with the latest changes.
            </p>
          )}
          <button onClick={fetchExpenseData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const totalExpenses = summary.drawing + summary.documents + summary.siteVisit + 
                        summary.marketingAndMisc + summary.officeManagement +
                        Object.values(summary.customFields).reduce((sum, val) => sum + val, 0);

  return (
    <div className="expense-distribution-container">
      <div className="page-header">
        <h1>💰 Expense Distribution</h1>
        <button onClick={fetchExpenseData} className="refresh-btn" disabled={loading}>
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="expense-summary-cards-grid">
        <div className="expense-summary-card total-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="card-amount">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">✏️</div>
          <div className="card-content">
            <h3>Drawing</h3>
            <p className="card-amount">{formatCurrency(summary.drawing)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.drawing / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">📄</div>
          <div className="card-content">
            <h3>Documents</h3>
            <p className="card-amount">{formatCurrency(summary.documents)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.documents / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">🏗️</div>
          <div className="card-content">
            <h3>Site Visit</h3>
            <p className="card-amount">{formatCurrency(summary.siteVisit)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.siteVisit / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">📢</div>
          <div className="card-content">
            <h3>Marketing & Misc</h3>
            <p className="card-amount">{formatCurrency(summary.marketingAndMisc)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.marketingAndMisc / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">🏢</div>
          <div className="card-content">
            <h3>Office Management</h3>
            <p className="card-amount">{formatCurrency(summary.officeManagement)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.officeManagement / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Custom Fields */}
        {Object.entries(summary.customFields).map(([fieldKey, amount]) => (
          <div key={fieldKey} className="expense-summary-card">
            <div className="card-icon">⭐</div>
            <div className="card-content">
              <h3>{getFieldLabel(fieldKey)}</h3>
              <p className="card-amount">{formatCurrency(amount)}</p>
              <p className="card-percentage">
                {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View Selector */}
      <div className="view-selector">
        <button
          className={`view-btn ${selectedView === 'summary' ? 'active' : ''}`}
          onClick={() => setSelectedView('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`view-btn ${selectedView === 'projects' ? 'active' : ''}`}
          onClick={() => setSelectedView('projects')}
        >
          🏗️ By Projects ({projects.length})
        </button>
        <button
          className={`view-btn ${selectedView === 'clients' ? 'active' : ''}`}
          onClick={() => setSelectedView('clients')}
        >
          👥 By Clients ({clients.length})
        </button>
      </div>

      {/* Search Bar */}
      {(selectedView === 'projects' || selectedView === 'clients') && (
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${selectedView}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {selectedView === 'summary' && (
          <div className="summary-view">
            <div className="breakdown-chart">
              <h2>Expense Breakdown</h2>
              <div className="breakdown-bars">
                {[
                  { label: 'Drawing', amount: summary.drawing, color: '#4CAF50' },
                  { label: 'Documents', amount: summary.documents, color: '#2196F3' },
                  { label: 'Site Visit', amount: summary.siteVisit, color: '#FF9800' },
                  { label: 'Marketing & Misc', amount: summary.marketingAndMisc, color: '#9C27B0' },
                  { label: 'Office Management', amount: summary.officeManagement, color: '#F44336' },
                  ...Object.entries(summary.customFields).map(([key, amount]) => ({
                    label: getFieldLabel(key),
                    amount,
                    color: '#607D8B'
                  }))
                ].map((item, index) => {
                  const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={index} className="breakdown-bar-item">
                      <div className="bar-label">
                        <span>{item.label}</span>
                        <span className="bar-amount">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                      <span className="bar-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'projects' && (
          <div className="projects-view">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project No.</th>
                    <th>Project Name</th>
                    <th>Drawing</th>
                    <th>Documents</th>
                    <th>Site Visit</th>
                    <th>Marketing & Misc</th>
                    <th>Office Mgmt</th>
                    {Object.keys(summary.customFields).map(key => (
                      <th key={key}>{getFieldLabel(key)}</th>
                    ))}
                    <th>Total Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="no-data">No projects found</td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const projectTotal = project.drawing + project.documents + project.siteVisit +
                                          project.marketingAndMisc + project.officeManagement +
                                          Object.values(project.customExpenses || {}).reduce((sum, val) => sum + val, 0);
                      return (
                        <tr key={project._id}>
                          <td>{project.projectNumber}</td>
                          <td className="project-name">{project.projectName}</td>
                          <td>{formatCurrency(project.drawing)}</td>
                          <td>{formatCurrency(project.documents)}</td>
                          <td>{formatCurrency(project.siteVisit)}</td>
                          <td>{formatCurrency(project.marketingAndMisc)}</td>
                          <td>{formatCurrency(project.officeManagement)}</td>
                          {Object.keys(summary.customFields).map(key => (
                            <td key={key}>{formatCurrency(project.customExpenses?.[key] || 0)}</td>
                          ))}
                          <td className="total-cell">{formatCurrency(projectTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedView === 'clients' && (
          <div className="clients-view">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Projects</th>
                    <th>Drawing</th>
                    <th>Documents</th>
                    <th>Site Visit</th>
                    <th>Marketing & Misc</th>
                    <th>Office Mgmt</th>
                    {Object.keys(summary.customFields).map(key => (
                      <th key={key}>{getFieldLabel(key)}</th>
                    ))}
                    <th>Total Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="no-data">No clients found</td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const clientTotal = client.drawing + client.documents + client.siteVisit +
                                         client.marketingAndMisc + client.officeManagement +
                                         Object.values(client.customExpenses || {}).reduce((sum, val) => sum + val, 0);
                      return (
                        <tr key={client._id}>
                          <td className="client-name">{client.clientName}</td>
                          <td>{client.projectCount}</td>
                          <td>{formatCurrency(client.drawing)}</td>
                          <td>{formatCurrency(client.documents)}</td>
                          <td>{formatCurrency(client.siteVisit)}</td>
                          <td>{formatCurrency(client.marketingAndMisc)}</td>
                          <td>{formatCurrency(client.officeManagement)}</td>
                          {Object.keys(summary.customFields).map(key => (
                            <td key={key}>{formatCurrency(client.customExpenses?.[key] || 0)}</td>
                          ))}
                          <td className="total-cell">{formatCurrency(clientTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDistribution;
