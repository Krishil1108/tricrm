import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import './ClientProjectsPage.css';

const AssociateProjectsPage = () => {
  const { associateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewStats } = useAuth();
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
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAssociateData, setSelectedAssociateData] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cheque',
    chequeNeftNumber: '',
    amount: '',
    notes: ''
  });

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

  // Payment handling functions
  const handleAddPayment = (project, associateData) => {
    setSelectedProject(project);
    setSelectedAssociateData(associateData);
    
    // Calculate suggested amount based on percentage
    const associateAmount = Math.round((project.finalizedFees * (associateData?.percentage || 0)) / 100);
    const amountPaid = associateData?.amountPaid || 0;
    const pendingAmount = associateAmount - amountPaid;
    
    setPaymentFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cheque',
      chequeNeftNumber: '',
      amount: pendingAmount > 0 ? pendingAmount : '',
      percentageShare: associateData?.percentage || 0,
      notes: ''
    });
    
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      showLoading();
      
      const paymentData = {
        projectId: selectedProject._id,
        associateId: associateId,
        transactionDate: paymentFormData.transactionDate,
        paymentMode: paymentFormData.paymentMode,
        chequeNeftNumber: paymentFormData.chequeNeftNumber,
        amount: parseFloat(paymentFormData.amount),
        percentageShare: paymentFormData.percentageShare,
        notes: paymentFormData.notes
      };
      
      // Call API to add payment transaction
      await FinanceService.addAssociatePaymentTransaction(paymentData);
      
      // Refresh the projects list
      await fetchAssociateProjects();
      
      // Close modal and reset form
      setShowPaymentModal(false);
      setSelectedProject(null);
      setSelectedAssociateData(null);
      
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Failed to add payment transaction');
    } finally {
      hideLoading();
    }
  };

  const handlePaymentInputChange = (field, value) => {
    setPaymentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewPayments = async (project, associateData) => {
    try {
      showLoading();
      setSelectedProject(project);
      setSelectedAssociateData(associateData);
      
      // Fetch payment history for this associate in this project
      const response = await FinanceService.getAssociatePaymentTransactions(project._id, associateId);
      setPaymentHistory(response.data.transactions || []);
      setShowPaymentHistoryModal(true);
      
    } catch (error) {
      console.error('Error fetching payment history:', error);
      showError('Failed to load payment history');
      setPaymentHistory([]);
    } finally {
      hideLoading();
    }
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

      {/* Stats Cards - Role-based visibility */}
      {canViewStats('associates') && (
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
      )}

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
                    const associateAmount = Math.round((project.finalizedFees * associatePercentage) / 100);
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
                              className="action-btn btn-payment"
                              onClick={() => handleAddPayment(project, associateData)}
                              title="Add Payment"
                              disabled={pendingAmount <= 0}
                            >
                              💳 Add Payment
                            </button>
                            <button
                              className="action-btn btn-view-payments"
                              onClick={() => handleViewPayments(project, associateData)}
                              title="View Payment History"
                            >
                              📋 Payments
                            </button>
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
                    <th>Associate Share %</th>
                    <th>Allocated Amount</th>
                    <th>Payment Status</th>
                    <th>Paid Amount</th>
                    <th>Pending Amount</th>
                    <th>Payment Date</th>
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
                    const associateAmount = Math.round((project.finalizedFees * associatePercentage) / 100);
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
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Payment Transaction</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="payment-info">
                <h4>{selectedProject?.projectName}</h4>
                <p><strong>Project Number:</strong> {selectedProject?.projectNumber}</p>
                <p><strong>Associate Share:</strong> {paymentFormData.percentageShare}%</p>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="transactionDate">Transaction Date *</label>
                    <input
                      type="date"
                      id="transactionDate"
                      value={paymentFormData.transactionDate}
                      onChange={(e) => handlePaymentInputChange('transactionDate', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="paymentMode">Payment Mode *</label>
                    <select
                      id="paymentMode"
                      value={paymentFormData.paymentMode}
                      onChange={(e) => handlePaymentInputChange('paymentMode', e.target.value)}
                      required
                    >
                      <option value="Cheque">Cheque</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="DD">DD</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="chequeNeftNumber">Cheque/NEFT Number</label>
                    <input
                      type="text"
                      id="chequeNeftNumber"
                      value={paymentFormData.chequeNeftNumber}
                      onChange={(e) => handlePaymentInputChange('chequeNeftNumber', e.target.value)}
                      placeholder="Enter cheque or transaction number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="amount">Amount *</label>
                    <input
                      type="number"
                      id="amount"
                      value={paymentFormData.amount}
                      onChange={(e) => handlePaymentInputChange('amount', e.target.value)}
                      placeholder="Enter payment amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    value={paymentFormData.notes}
                    onChange={(e) => handlePaymentInputChange('notes', e.target.value)}
                    placeholder="Add any notes about this payment"
                    rows="3"
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentHistoryModal(false)}>
          <div className="modal-content payment-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment History</h3>
              <button className="modal-close" onClick={() => setShowPaymentHistoryModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="payment-info">
                <h4>{selectedProject?.projectName}</h4>
                <p><strong>Project Number:</strong> {selectedProject?.projectNumber}</p>
                <p><strong>Associate Share:</strong> {selectedAssociateData?.percentage}%</p>
                <p><strong>Total Paid:</strong> {formatCurrency(selectedAssociateData?.amountPaid || 0)}</p>
              </div>
              
              {paymentHistory.length > 0 ? (
                <div className="payment-history-table">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Mode</th>
                        <th>Cheque/Ref No.</th>
                        <th>Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <tr key={index}>
                          <td>{formatDate(payment.transactionDate)}</td>
                          <td>
                            <span className={`payment-mode-badge ${payment.paymentMode.toLowerCase()}`}>
                              {payment.paymentMode}
                            </span>
                          </td>
                          <td>{payment.chequeNeftNumber || '-'}</td>
                          <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                          <td>{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="payment-summary">
                    <p><strong>Total Transactions:</strong> {paymentHistory.length}</p>
                    <p><strong>Total Amount Paid:</strong> {formatCurrency(paymentHistory.reduce((sum, payment) => sum + payment.amount, 0))}</p>
                  </div>
                </div>
              ) : (
                <div className="no-payments">
                  <p>No payment transactions found for this associate in this project.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociateProjectsPage;
