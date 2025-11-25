import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import ExcelExportService from './services/ExcelExportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ClientProjectsPage.css';

const ClientProjectsPage = () => {
  const { clientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewStats } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showError } = useToast();
  
  const [projects, setProjects] = useState([]);
  const [clientInfo, setClientInfo] = useState({
    name: location.state?.clientName || '',
    company: location.state?.clientCompany || ''
  });
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalContractValue: 0,
    totalReceived: 0,
    outstandingAmount: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchClientProjects();
  }, [clientId]);

  const fetchClientProjects = async () => {
    try {
      showLoading();
      const projectsData = await FinanceService.getProjectsByClient(clientId);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      calculateStats(projectsData);
    } catch (error) {
      console.error('Error fetching client projects:', error);
      showError('Failed to load client projects');
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
      outstandingAmount: 0
    };
    stats.outstandingAmount = stats.totalContractValue - stats.totalReceived;
    setStats(stats);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleBackToClients = () => {
    navigate('/clients');
  };

  const handleEditProject = (projectId) => {
    navigate('/projects', { state: { editProjectId: projectId } });
  };

  const handleViewDistribution = (project) => {
    setSelectedProject(project);
    setShowDistributionModal(true);
  };

  const calculatePaymentDistribution = (payment, project) => {
    const amount = payment.amount || 0;
    const allocations = [
      { label: 'Profit Margin', percent: project.profitMarginPercent || 0 },
      { label: 'Drawing', percent: project.drawingPercent || 0 },
      { label: 'Documents', percent: project.documentsPercent || 0 },
      { label: 'Site Visit', percent: project.siteVisitPercent || 0 },
      { label: 'Marketing & Misc', percent: project.marketingAndMiscPercent || 0 },
      { label: 'Office Management', percent: project.officeManagementPercent || 0 }
    ];
    
    return allocations.map(allocation => ({
      ...allocation,
      amount: (amount * allocation.percent) / 100
    }));
  };

  const handleCloseDistribution = () => {
    setShowDistributionModal(false);
    setSelectedProject(null);
  };

  // WhatsApp share handler for distribution
  const handleShareDistributionWhatsApp = () => {
    if (!selectedProject || !selectedProject.payments || selectedProject.payments.length === 0) {
      alert('No payment data to share');
      return;
    }

    const projectName = selectedProject.projectName;
    const projectNumber = selectedProject.projectNumber;
    const totalContract = formatCurrency(selectedProject.finalizedFees);
    const totalReceived = formatCurrency(selectedProject.totalReceivedFees);
    const pending = formatCurrency((selectedProject.finalizedFees || 0) - (selectedProject.totalReceivedFees || 0));
    
    let message = `*Payment Distribution Report*\n\n`;
    message += `*Project:* ${projectName}\n`;
    message += `*Project No:* ${projectNumber}\n`;
    message += `*Total Contract:* ${totalContract}\n`;
    message += `*Total Received:* ${totalReceived}\n`;
    message += `*Pending Amount:* ${pending}\n\n`;
    message += `*Payment History & Distribution:*\n\n`;
    
    selectedProject.payments.forEach((payment, index) => {
      const distribution = calculatePaymentDistribution(payment, selectedProject);
      message += `*Payment #${index + 1}*\n`;
      message += `Date: ${new Date(payment.date).toLocaleDateString()}\n`;
      message += `Amount: ${formatCurrency(payment.amount)}\n`;
      message += `Mode: ${payment.mode}\n`;
      if (payment.chequeNeftNumber) {
        message += `Ref: ${payment.chequeNeftNumber}\n`;
      }
      message += `\nDistribution Breakdown:\n`;
      distribution.forEach(item => {
        message += `• ${item.label}: ${item.percent}% - ${formatCurrency(item.amount)}\n`;
      });
      message += '\n';
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Export to Excel handler
  const handleExportToExcel = () => {
    try {
      const exportData = filteredProjects.map((project, index) => ({
        'S.No': index + 1,
        'Project Number': project.projectNumber || '',
        'Project Name': project.projectName || '',
        'Client Name': clientInfo.name || '',
        'Company': clientInfo.company || '',
        'Finalized Fees': project.finalizedFees || 0,
        'Received Fees': project.totalReceivedFees || 0,
        'Pending Amount': (project.finalizedFees || 0) - (project.totalReceivedFees || 0),
        'Total Payments': project.payments?.length || 0,
        'Status': project.status || '',
        'Created Date': project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN') : ''
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Project Number
        { wch: 30 }, // Project Name
        { wch: 20 }, // Client Name
        { wch: 20 }, // Company
        { wch: 15 }, // Finalized Fees
        { wch: 15 }, // Received Fees
        { wch: 15 }, // Pending Amount
        { wch: 12 }, // Total Payments
        { wch: 12 }, // Status
        { wch: 15 }  // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

      const filename = `${clientInfo.name}_projects_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Failed to export to Excel');
    }
  };

  // Export to PDF handler
  const handleExportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Client Projects Report', 14, 20);
      
      // Add client info
      doc.setFontSize(12);
      doc.text(`Client: ${clientInfo.name}${clientInfo.company ? ' - ' + clientInfo.company : ''}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 38);
      
      // Add summary stats
      doc.setFontSize(10);
      doc.text(`Total Projects: ${stats.totalProjects}`, 14, 48);
      doc.text(`Total Contract Value: ${formatCurrency(stats.totalContractValue)}`, 14, 54);
      doc.text(`Total Received: ${formatCurrency(stats.totalReceived)}`, 14, 60);
      doc.text(`Outstanding: ${formatCurrency(stats.outstandingAmount)}`, 14, 66);
      
      // Prepare table data
      const tableData = filteredProjects.map((project, index) => [
        index + 1,
        project.projectNumber || '',
        project.projectName || '',
        formatCurrency(project.finalizedFees),
        formatCurrency(project.totalReceivedFees),
        formatCurrency((project.finalizedFees || 0) - (project.totalReceivedFees || 0)),
        project.payments?.length || 0,
        project.status || ''
      ]);
      
      // Add table
      doc.autoTable({
        startY: 75,
        head: [['S.No', 'Project No', 'Project Name', 'Finalized Fees', 'Received', 'Pending', 'Payments', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 15 },
          7: { cellWidth: 18 }
        }
      });
      
      const filename = `${clientInfo.name}_projects_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showError('Failed to export to PDF');
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
          onClick={handleBackToClients}
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
          Clients
        </button>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-current">
          {clientInfo.name} {clientInfo.company ? `(${clientInfo.company})` : ''} - Projects
        </span>
      </div>

      {/* Header */}
      <div className="project-header">
        <div className="header-left">
          <h1>Client Projects</h1>
          <p className="client-info">
            <strong>{clientInfo.name}</strong>
            {clientInfo.company && <span> - {clientInfo.company}</span>}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="project-btn project-btn-success"
            onClick={handleExportToExcel}
            title="Export projects to Excel spreadsheet"
          >
            📊 Export to Excel
          </button>
          <button 
            className="project-btn project-btn-danger"
            onClick={handleExportToPDF}
            title="Export projects to PDF document"
          >
            📄 Export to PDF
          </button>
          <button 
            className="project-btn project-btn-primary"
            onClick={() => navigate('/projects', { state: { clientId: clientId } })}
          >
            <i className="bi bi-plus-lg"></i> Add New Project
          </button>
          <button 
            className="project-btn project-btn-secondary"
            onClick={handleBackToClients}
          >
            <i className="bi bi-arrow-left"></i> Back to Clients
          </button>
        </div>
      </div>

      {/* Stats Cards - Role-based visibility */}
      {canViewStats('clients') && (
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
              <div className="stat-number">{formatCurrency(stats.totalContractValue)}</div>
              <div className="stat-label">Total Contract Value</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalReceived)}</div>
              <div className="stat-label">Total Received</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.outstandingAmount)}</div>
              <div className="stat-label">Outstanding Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="project-controls">
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
                ? "This client doesn't have any projects yet" 
                : "No projects match your current filters"
              }
            </p>
            <button 
              className="project-btn project-btn-primary"
              onClick={() => navigate('/projects', { state: { clientId: clientId } })}
            >
              Add First Project
            </button>
          </div>
        ) : (
          <div className="project-table-container">
            <table className="project-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Project Number</th>
                  <th>Project Name</th>
                  <th>Finalized Fees</th>
                  <th>Received Fees</th>
                  <th>Pending Amount</th>
                  <th>Payments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  const pendingAmount = (project.finalizedFees || 0) - (project.totalReceivedFees || 0);
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
                      <td className={pendingAmount > 0 ? 'pending-amount' : 'completed-amount'}>
                        {formatCurrency(pendingAmount)}
                      </td>
                      <td>
                        <div className="payments-info">
                          <span className="payment-count">
                            {project.payments?.length || 0} payments
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${project.status?.toLowerCase()}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn btn-view"
                            onClick={() => handleViewDistribution(project)}
                            title="View Payment Distribution"
                          >
                            📊 Distribution
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
          </div>
        )}
      </div>

      {/* Payment Distribution Modal */}
      {showDistributionModal && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseDistribution}>
          <div className="client-distribution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Payment Distribution - {selectedProject.projectName}</h3>
              <button className="modal-close" onClick={handleCloseDistribution}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Project Summary */}
              <div className="project-summary">
                <div className="summary-card">
                  <h4>Project Details</h4>
                  <div className="detail-row">
                    <span>Project Number:</span>
                    <strong>{selectedProject.projectNumber}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Total Contract:</span>
                    <strong>{formatCurrency(selectedProject.finalizedFees)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Total Received:</span>
                    <strong className="success-text">{formatCurrency(selectedProject.totalReceivedFees)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Pending Amount:</span>
                    <strong className="danger-text">
                      {formatCurrency((selectedProject.finalizedFees || 0) - (selectedProject.totalReceivedFees || 0))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment History with Distribution */}
              <div className="payment-history">
                <h4>💳 Payment History & Distribution</h4>
                {selectedProject.payments && selectedProject.payments.length > 0 ? (
                  <div className="payments-container">
                    {selectedProject.payments.map((payment, index) => {
                      const distribution = calculatePaymentDistribution(payment, selectedProject);
                      return (
                        <div key={index} className="payment-item">
                          <div className="payment-header">
                            <div className="payment-info">
                              <h5>Payment #{index + 1}</h5>
                              <div className="payment-details">
                                <span>Date: {new Date(payment.date).toLocaleDateString()}</span>
                                <span>Amount: {formatCurrency(payment.amount)}</span>
                                <span>Mode: {payment.mode}</span>
                                {payment.chequeNeftNumber && <span>Ref: {payment.chequeNeftNumber}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="payment-distribution">
                            <h6>Distribution Breakdown</h6>
                            <div className="distribution-grid">
                              {distribution.map((item, idx) => (
                                <div key={idx} className="distribution-item">
                                  <div className="distribution-category">{item.label}</div>
                                  <div className="distribution-values">
                                    <span className="distribution-percent">{item.percent}%</span>
                                    <span className="distribution-amount">{formatCurrency(item.amount)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-payments">No payments recorded yet</p>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDistribution}>
                Close
              </button>
              <button 
                className="btn btn-whatsapp"
                onClick={handleShareDistributionWhatsApp}
                title="Share distribution via WhatsApp"
              >
                📱 Share WhatsApp
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleEditProject(selectedProject._id)}
              >
                Edit Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectsPage;