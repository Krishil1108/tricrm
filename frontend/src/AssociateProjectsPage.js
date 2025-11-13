import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import './ClientProjectsPage.css';

const AssociateProjectsPage = () => {
  const { associateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { showError } = useToast();
  
  const [projects, setProjects] = useState([]);
  const [associateInfo] = useState({
    name: location.state?.associateName || '',
    company: location.state?.associateCompany || ''
  });
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalContractValue: 0,
    totalReceived: 0,
    totalAssociateAllocation: 0,
    totalAssociatePaid: 0,
    totalAssociatePending: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [activeView, setActiveView] = useState('owner'); // 'owner' or 'associate'

  useEffect(() => {
    fetchAssociateProjects();
  }, [associateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAssociateProjects = async () => {
    try {
      showLoading();
      const projectsData = await FinanceService.getProjectsByAssociate(associateId);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      calculateStats(projectsData);
    } catch (error) {
      console.error('Error fetching associate projects:', error);
      showError('Failed to load associate projects');
      setProjects([]);
    } finally {
      hideLoading();
    }
  };

  const calculateStats = (projectsData) => {
    const projects = Array.isArray(projectsData) ? projectsData : [];
    const stats = {
      totalProjects: projects.length,
      totalContractValue: projects.reduce((sum, project) => sum + (project.finalizedFees || 0), 0),
      totalReceived: projects.reduce((sum, project) => sum + (project.totalReceivedFees || 0), 0),
      totalAssociateAllocation: 0,
      totalAssociatePaid: 0,
      totalAssociatePending: 0
    };
    
    // Calculate associate-specific totals from projectAssociates array
    projects.forEach(project => {
      if (project.projectAssociates && project.projectAssociates.length > 0) {
        // Find this specific associate's data in the project
        const associateData = project.projectAssociates.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        if (associateData) {
          // Calculate this associate's share of the project
          const associateShare = Math.round((project.totalReceivedFees * (associateData.percentage || 0)) / 100);
          stats.totalAssociateAllocation += associateShare;
          stats.totalAssociatePaid += (associateData.amountPaid || 0);
          stats.totalAssociatePending += (associateShare - (associateData.amountPaid || 0));
        }
      }
    });
    
    setStats(stats);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBackToAssociates = () => {
    navigate('/associates');
  };

  const handleEditProject = (projectId) => {
    navigate('/projects', { state: { editProjectId: projectId } });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         project.projectNumber?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || project.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="project-page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button 
          className="breadcrumb-link" 
          onClick={handleBackToAssociates}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#007bff', 
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit'
          }}
        >
          Associates
        </button>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-current">
          {associateInfo.name} {associateInfo.company ? `(${associateInfo.company})` : ''} - Projects
        </span>
      </div>

      {/* Header */}
      <div className="project-header">
        <div className="header-left">
          <h1>Associate Projects</h1>
          <p className="client-info">
            <strong>{associateInfo.name}</strong>
            {associateInfo.company && <span> - {associateInfo.company}</span>}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="project-btn project-btn-primary"
            onClick={() => navigate('/projects', { state: { associateId: associateId } })}
          >
            <i className="bi bi-plus-lg"></i> Add New Project
          </button>
          <button 
            className="project-btn project-btn-secondary"
            onClick={handleBackToAssociates}
          >
            <i className="bi bi-arrow-left"></i> Back to Associates
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-number">{formatCurrency(stats.totalReceived)}</div>
            <div className="stat-label">Total Received by Owner</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{formatCurrency(stats.totalAssociateAllocation)}</div>
            <div className="stat-label">Total Associate Allocation</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{formatCurrency(stats.totalAssociatePaid)}</div>
            <div className="stat-label">Amount Paid to Associate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{formatCurrency(stats.totalAssociatePending)}</div>
            <div className="stat-label">Pending to Associate</div>
          </div>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="project-controls">
        <div className="view-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            className={`project-btn ${activeView === 'owner' ? 'project-btn-primary' : 'project-btn-secondary'}`}
            onClick={() => setActiveView('owner')}
            style={{ flex: 1 }}
          >
            📊 Owner View
          </button>
          <button 
            className={`project-btn ${activeView === 'associate' ? 'project-btn-primary' : 'project-btn-secondary'}`}
            onClick={() => setActiveView('associate')}
            style={{ flex: 1 }}
          >
            👤 Associate Details
          </button>
        </div>
        <div className="search-controls">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="project-content">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No projects found</h3>
            <p>
              {projects.length === 0 
                ? "This associate doesn't have any projects yet" 
                : "No projects match your current filters"
              }
            </p>
            <button 
              className="project-btn project-btn-primary"
              onClick={() => navigate('/projects', { state: { associateId: associateId } })}
            >
              Add First Project
            </button>
          </div>
        ) : (
          <div className="project-table-container">
            {activeView === 'owner' ? (
              // Owner View Table - Shows owner's perspective
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Project Number</th>
                    <th>Project Name</th>
                    <th>Finalized Fees</th>
                    <th>Received Fees</th>
                    <th>Associate Share %</th>
                    <th>Associate Amount</th>
                    <th>Amount Paid to Associate</th>
                    <th>Pending to Associate</th>
                    <th>Payment Given Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => {
                    // Find this specific associate's data from projectAssociates array
                    const associateData = project.projectAssociates?.find(
                      assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                    );
                    
                    const associatePercentage = associateData?.percentage || 0;
                    const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                    const amountPaid = associateData?.amountPaid || 0;
                    const pendingAmount = associateAmount - amountPaid;
                    const paymentDate = associateData?.paymentGivenDate;
                    
                    return (
                      <tr key={project._id}>
                        <td>{project.srNo || index + 1}</td>
                        <td>{project.projectNumber}</td>
                        <td>
                          <div className="project-name">
                            <strong>{project.projectName}</strong>
                          </div>
                        </td>
                        <td>{formatCurrency(project.finalizedFees)}</td>
                        <td>{formatCurrency(project.totalReceivedFees)}</td>
                        <td>
                          {associatePercentage > 0 ? (
                            <span className="percentage-badge">{associatePercentage}%</span>
                          ) : (
                            <span className="no-allocation">-</span>
                          )}
                        </td>
                        <td className="highlight-amount">{formatCurrency(associateAmount)}</td>
                        <td className="success-text">{formatCurrency(amountPaid)}</td>
                        <td className={pendingAmount > 0 ? 'pending-amount' : 'completed-amount'}>
                          {formatCurrency(pendingAmount)}
                        </td>
                        <td>
                          <span className={paymentDate ? 'payment-date' : 'no-payment-date'}>
                            {formatDate(paymentDate)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn btn-edit"
                              onClick={() => handleEditProject(project._id)}
                              title="Edit Project"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              // Associate Details Table - Shows associate's perspective
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Project Number</th>
                    <th>Project Name</th>
                    <th>Total Received</th>
                    <th>Associate Share %</th>
                    <th>Allocated Amount</th>
                    <th>Payment Status</th>
                    <th>Paid Amount</th>
                    <th>Pending Amount</th>
                    <th>Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => {
                    // Find this specific associate's data from projectAssociates array
                    const associateData = project.projectAssociates?.find(
                      assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                    );
                    
                    const associatePercentage = associateData?.percentage || 0;
                    const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                    const amountPaid = associateData?.amountPaid || 0;
                    const pendingAmount = associateAmount - amountPaid;
                    const paymentDate = associateData?.paymentGivenDate;
                    const paymentStatus = pendingAmount === 0 ? 'Completed' : amountPaid > 0 ? 'Partial' : 'Pending';
                    
                    return (
                      <tr key={project._id}>
                        <td>{project.srNo || index + 1}</td>
                        <td>{project.projectNumber}</td>
                        <td>
                          <div className="project-name">
                            <strong>{project.projectName}</strong>
                          </div>
                        </td>
                        <td>{formatCurrency(project.totalReceivedFees)}</td>
                        <td>
                          {associatePercentage > 0 ? (
                            <span className="percentage-badge">{associatePercentage}%</span>
                          ) : (
                            <span className="no-allocation">-</span>
                          )}
                        </td>
                        <td className="highlight-amount">{formatCurrency(associateAmount)}</td>
                        <td>
                          <span className={`status-badge status-${paymentStatus.toLowerCase()}`}>
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="success-text">{formatCurrency(amountPaid)}</td>
                        <td className={pendingAmount > 0 ? 'pending-amount' : 'completed-amount'}>
                          {formatCurrency(pendingAmount)}
                        </td>
                        <td>
                          <span className={paymentDate ? 'payment-date' : 'no-payment-date'}>
                            {formatDate(paymentDate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociateProjectsPage;
