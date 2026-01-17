import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import { FaMoneyBillWave, FaEdit, FaHistory, FaChartBar, FaUser, FaFileExcel, FaFilePdf, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './ClientProjectsPage.css';

const AssociateProjectsPage = () => {
  const { associateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewStats } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showError, showSuccess } = useToast();
  
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [selectedAssociateData, setSelectedAssociateData] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
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

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredProjects.map(project => {
        const associateDataFromProject = project.projectAssociates?.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        const associatePercentage = associateDataFromProject?.percentage || 0;
        const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
        const amountPaid = associateDataFromProject?.amountPaid || 0;
        const pendingAmount = associateAmount - amountPaid;
        
        return {
          'Project Number': project.projectNumber || '',
          'Project Name': project.projectName || '',
          'Project Location': project.projectLocation || '',
          'Associate Amount (₹)': associateAmount,
          'Amount Paid (₹)': amountPaid,
          'Pending Amount (₹)': pendingAmount,
          'Status': project.status || ''
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Project Number
        { wch: 30 }, // Project Name
        { wch: 25 }, // Project Location
        { wch: 18 }, // Associate Amount
        { wch: 18 }, // Amount Paid
        { wch: 18 }, // Pending Amount
        { wch: 12 }  // Status
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Associate Projects');

      // Add summary sheet
      const summary = [
        { 'Field': 'Associate Name', 'Value': associateInfo.name },
        { 'Field': 'Company', 'Value': associateInfo.company || '-' },
        { 'Field': 'Export Date', 'Value': new Date().toLocaleString('en-IN') },
        { 'Field': 'Total Projects', 'Value': stats.totalProjects },
        { 'Field': 'Total Associate Allocation', 'Value': `₹${stats.totalAssociateAllocation.toLocaleString('en-IN')}` },
        { 'Field': 'Amount Paid to Associate', 'Value': `₹${stats.totalAssociatePaid.toLocaleString('en-IN')}` },
        { 'Field': 'Pending to Associate', 'Value': `₹${stats.totalAssociatePending.toLocaleString('en-IN')}` }
      ];
      
      const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      const filename = `${associateInfo.name.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);

      showSuccess(`Statement exported successfully as ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Failed to export statement to Excel');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Add header
      doc.setFontSize(18);
      doc.text('Associate Project Statement', 14, 15);
      
      doc.setFontSize(11);
      doc.text(`Associate: ${associateInfo.name}`, 14, 23);
      if (associateInfo.company) {
        doc.text(`Company: ${associateInfo.company}`, 14, 29);
      }
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, associateInfo.company ? 35 : 29);
      
      // Add summary section
      const startY = associateInfo.company ? 43 : 37;
      doc.setFontSize(12);
      doc.text('Summary:', 14, startY);
      
      doc.setFontSize(10);
      const summaryY = startY + 6;
      doc.text(`Total Projects: ${stats.totalProjects}`, 14, summaryY);
      doc.text(`Total Associate Allocation: ₹${stats.totalAssociateAllocation.toLocaleString('en-IN')}`, 80, summaryY);
      doc.text(`Amount Paid: ₹${stats.totalAssociatePaid.toLocaleString('en-IN')}`, 160, summaryY);
      doc.text(`Pending Amount: ₹${stats.totalAssociatePending.toLocaleString('en-IN')}`, 220, summaryY);
      
      // Prepare table data
      const tableData = filteredProjects.map(project => {
        const associateDataFromProject = project.projectAssociates?.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        const associatePercentage = associateDataFromProject?.percentage || 0;
        const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
        const amountPaid = associateDataFromProject?.amountPaid || 0;
        const pendingAmount = associateAmount - amountPaid;
        
        return [
          project.projectNumber || '',
          project.projectName || '',
          project.projectLocation || '',
          `₹${associateAmount.toLocaleString('en-IN')}`,
          `₹${amountPaid.toLocaleString('en-IN')}`,
          `₹${pendingAmount.toLocaleString('en-IN')}`,
          project.status || ''
        ];
      });
      
      // Add table
      doc.autoTable({
        startY: summaryY + 8,
        head: [['Project No.', 'Project Name', 'Location', 'Associate Amount', 'Amount Paid', 'Pending Amount', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 45 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
          5: { cellWidth: 35, halign: 'right' },
          6: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      const filename = `${associateInfo.name.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      showSuccess(`Statement exported successfully as ${filename}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showError('Failed to export statement to PDF');
    }
  };

  const handleEditProject = (projectId) => {
    navigate('/projects', { state: { editProjectId: projectId } });
  };

  // Payment handling functions
  const handleAddPayment = (project, associateData) => {
    setSelectedProject(project);
    setSelectedAssociate(associateData);
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
    
    // Reset editing state
    setEditingTransactionId(null);
    
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      showLoading(editingTransactionId ? 'Updating payment transaction...' : 'Adding payment transaction...');
      
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
      
      if (editingTransactionId) {
        // Update existing transaction
        await FinanceService.updateAssociatePaymentTransaction(
          selectedProject._id,
          associateId,
          editingTransactionId,
          paymentData
        );
        showSuccess('Payment transaction updated successfully!');
      } else {
        // Add new transaction
        await FinanceService.addAssociatePaymentTransaction(paymentData);
        showSuccess('Payment transaction added successfully!');
      }
      
      // Refresh the projects list and payment history
      await fetchAssociateProjects();
      if (showPaymentHistoryModal) {
        await handleViewPayments(selectedProject, selectedAssociate);
      }
      
      // Close modal and reset form
      setShowPaymentModal(false);
      setSelectedProject(null);
      setSelectedAssociate(null);
      setSelectedAssociateData(null);
      setEditingTransactionId(null);
      
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

  // Edit transaction handler
  const handleEditTransaction = (index, payment) => {
    setSelectedProject(selectedProject);
    setSelectedAssociate(selectedAssociate);
    setPaymentFormData({
      transactionDate: payment.transactionDate.split('T')[0],
      paymentMode: payment.paymentMode,
      amount: payment.amount,
      percentageShare: payment.percentageShare,
      chequeNeftNumber: payment.chequeNeftNumber || '',
      notes: payment.notes || ''
    });
    setEditingTransactionId(payment._id);
    setShowPaymentModal(true);
    setShowPaymentHistoryModal(false);
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (index, payment) => {
    console.log('Delete transaction data:', {
      projectId: selectedProject._id,
      associateId: associateId,
      transactionId: payment._id,
      payment: payment,
      paymentKeys: Object.keys(payment)
    });
    
    if (window.confirm('Are you sure you want to delete this payment transaction?')) {
      try {
        showLoading('Deleting payment transaction...');
        const response = await FinanceService.deleteAssociatePaymentTransaction(
          selectedProject._id, 
          associateId, 
          payment._id
        );

        if (response.success) {
          // Remove the transaction from local state
          const updatedHistory = paymentHistory.filter((_, i) => i !== index);
          setPaymentHistory(updatedHistory);
          
          // Update the project data
          fetchAssociateProjects();
          
          showSuccess('Payment transaction deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting payment transaction:', error);
        showError('Failed to delete payment transaction. Please try again.');
      } finally {
        hideLoading();
      }
    }
  };

  // WhatsApp share handler
  const handleShareWhatsApp = () => {
    if (!selectedProject || !selectedAssociate || !paymentHistory.length) {
      alert('No payment data to share');
      return;
    }

    const projectName = selectedProject.projectName;
    const associateName = selectedAssociate.name;
    const associateShare = selectedAssociate.percentage;
    const totalPaid = formatCurrency(selectedAssociateData?.amountPaid || 0);
    
    let message = `*Payment Transaction Details*\n\n`;
    message += `*Project:* ${projectName}\n`;
    message += `*Associate:* ${associateName}\n`;
    message += `*Share Percentage:* ${associateShare}%\n`;
    message += `*Total Amount Paid:* ${totalPaid}\n\n`;
    message += `*Transaction History:*\n`;
    
    paymentHistory.forEach((payment, index) => {
      message += `${index + 1}. *Date:* ${formatDate(payment.transactionDate)}\n`;
      message += `   *Mode:* ${payment.paymentMode}\n`;
      if (payment.chequeNeftNumber) {
        message += `   *Ref No:* ${payment.chequeNeftNumber}\n`;
      }
      message += `   *Amount:* ${formatCurrency(payment.amount)}\n`;
      if (payment.notes) {
        message += `   *Notes:* ${payment.notes}\n`;
      }
      message += '\n';
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewPayments = async (project, associateData) => {
    try {
      showLoading();
      setSelectedProject(project);
      setSelectedAssociate(associateData);
      setSelectedAssociateData(associateData);
      
      // Fetch payment history for this associate in this project
      const response = await FinanceService.getAssociatePaymentTransactions(project._id, associateId);
      console.log('Payment history response:', response);
      console.log('Transactions:', response.data.transactions);
      if (response.data.transactions && response.data.transactions.length > 0) {
        console.log('First transaction sample:', response.data.transactions[0]);
        console.log('First transaction keys:', Object.keys(response.data.transactions[0]));
      }
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

  // Pagination calculations
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status]);

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <button 
                className="project-btn"
                onClick={exportToExcel}
                style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                title="Download Excel"
              >
                <FaFileExcel /> Excel
              </button>
              <button 
                className="project-btn"
                onClick={exportToPDF}
                style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                title="Download PDF"
              >
                <FaFilePdf /> PDF
              </button>
            </div>
          </div>
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
        <div className="animated-tabs">
          <input 
            type="radio" 
            id="owner-tab" 
            name="view-tabs" 
            checked={activeView === 'owner'}
            onChange={() => setActiveView('owner')}
          />
          <label className="tab" htmlFor="owner-tab">
            <FaChartBar style={{ marginRight: '8px' }} /> Owner View
          </label>
          
          <input 
            type="radio" 
            id="associate-tab" 
            name="view-tabs" 
            checked={activeView === 'associate'}
            onChange={() => setActiveView('associate')}
          />
          <label className="tab" htmlFor="associate-tab">
            <FaUser style={{ marginRight: '8px' }} /> Associate Details
          </label>
          
          <span className="glider"></span>
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
                    <th>Project Number</th>
                    <th>Project Name</th>
                    <th>Finalized Fees</th>
                    <th>Associate Share %</th>
                    <th>Associate Amount</th>
                    <th>Amount Paid to Associate</th>
                    <th>Pending to Associate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.map((project, index) => {
                    // Find this specific associate's data from projectAssociates array
                    const associateDataFromProject = project.projectAssociates?.find(
                      assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                    );
                    
                    const associatePercentage = associateDataFromProject?.percentage || 0;
                    const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                    const amountPaid = associateDataFromProject?.amountPaid || 0;
                    const pendingAmount = associateAmount - amountPaid;
                    
                    return (
                      <tr key={project._id}>
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
                          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleAddPayment(project, associateDataFromProject)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              style={{ padding: '5px', color: '#16a34a', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              title="Add Payment"
                              disabled={pendingAmount <= 0}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FaMoneyBillWave className="w-5 h-5" style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => handleViewPayments(project, associateDataFromProject)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              style={{ padding: '5px', color: '#9333ea', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              title="View Payment History"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ff'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FaHistory className="w-5 h-5" style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => handleEditProject(project._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              style={{ padding: '5px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              title="Edit Project"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FaEdit className="w-5 h-5" style={{ width: '16px', height: '16px' }} />
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
                    <th>Project Number</th>
                    <th>Project Name</th>
                    <th>Associate Share %</th>
                    <th>Allocated Amount</th>
                    <th>Payment Status</th>
                    <th>Paid Amount</th>
                    <th>Pending Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.map((project, index) => {
                    // Find this specific associate's data from projectAssociates array
                    const associateData = project.projectAssociates?.find(
                      assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                    );
                    
                    const associatePercentage = associateData?.percentage || 0;
                    const associateAmount = Math.round((project.finalizedFees * associatePercentage) / 100);
                    const amountPaid = associateData?.amountPaid || 0;
                    const pendingAmount = associateAmount - amountPaid;
                    const paymentStatus = pendingAmount === 0 ? 'Completed' : amountPaid > 0 ? 'Partial' : 'Pending';
                    
                    return (
                      <tr key={project._id}>
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
                          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditProject(project._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              style={{ padding: '5px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              title="Edit Project"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FaEdit className="w-5 h-5" style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {filteredProjects.length > 0 && totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-pages">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`pagination-page ${currentPage === pageNumber ? 'active' : ''}`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransactionId ? 'Edit Payment Transaction' : 'Add Payment Transaction'}</h3>
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
                <div className="payment-info-header">
                  <div>
                    <h4>{selectedProject?.projectName}</h4>
                    <p><strong>Project Number:</strong> {selectedProject?.projectNumber}</p>
                    <p><strong>Associate Share:</strong> {selectedAssociateData?.percentage}%</p>
                    <p><strong>Total Paid:</strong> {formatCurrency(selectedAssociateData?.amountPaid || 0)}</p>
                  </div>
                  <button 
                    className="btn-whatsapp"
                    onClick={() => handleShareWhatsApp()}
                    title="Share via WhatsApp"
                  >
                    📱 Share WhatsApp
                  </button>
                </div>
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <tr key={payment._id || index}>
                          <td>{formatDate(payment.transactionDate)}</td>
                          <td>
                            <span className={`payment-mode-badge ${payment.paymentMode.toLowerCase()}`}>
                              {payment.paymentMode}
                            </span>
                          </td>
                          <td>{payment.chequeNeftNumber || '-'}</td>
                          <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                          <td>{payment.notes || '-'}</td>
                          <td>
                            <div className="transaction-actions">
                              <button
                                className="action-btn btn-edit-small"
                                onClick={() => handleEditTransaction(index, payment)}
                                title="Edit Transaction"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                              </button>
                              <button
                                className="action-btn btn-delete-small"
                                onClick={() => handleDeleteTransaction(index, payment)}
                                title="Delete Transaction"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                              </button>
                            </div>
                          </td>
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
