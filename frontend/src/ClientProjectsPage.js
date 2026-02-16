import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCompany } from './CompanyContext';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import ExcelExportService from './services/ExcelExportService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaChartBar, FaCheckCircle, FaClock, FaCreditCard, FaEdit, FaFileExcel, FaFilePdf, FaLink, FaMoneyBillWave, FaTrash, FaWhatsapp } from 'react-icons/fa';
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiMinus, FiInfo } from 'react-icons/fi';
import { FiBarChart2 } from 'react-icons/fi';
import useSortableData from './utils/useSortableData';
import './ClientProjectsPage.css';
import './styles/ActionButtons.css';

const ClientProjectsPage = () => {
  const { clientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewStats } = useAuth();
  const { companyInfo } = useCompany();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

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
    navigate('/projects', { state: { editProjectId: projectId, clientId: clientId } });
  };

  const handleViewDistribution = (project) => {
    setSelectedProject(project);
    setShowDistributionModal(true);
  };

  const calculatePaymentDistribution = (payment, project) => {
    const amount = payment.amount || 0;
    
    // Calculate total associate percentage from all associates
    const totalAssociatePercent = project.projectAssociates && project.projectAssociates.length > 0
      ? project.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
      : 0;
    
    // Deduct associate share before calculating expenses
    const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
    const amountAfterAssociate = amount - associateShare;
    
    const allocations = [];
    
    // Add associate share first if applicable
    if (totalAssociatePercent > 0) {
      allocations.push({
        label: 'Associate Share',
        percent: totalAssociatePercent,
        amount: associateShare
      });
    }
    
    // Calculate expense allocations on remaining amount after associate deduction
    const expenseAllocations = [
      { label: 'Profit Margin', percent: project.profitMarginPercent || 0 },
      { label: 'Drawing', percent: project.drawingPercent || 0 },
      { label: 'Documents', percent: project.documentsPercent || 0 },
      { label: 'Site Visit', percent: project.siteVisitPercent || 0 },
      { label: 'Marketing & Misc', percent: project.marketingAndMiscPercent || 0 },
      { label: 'Office Management', percent: project.officeManagementPercent || 0 }
    ];
    
    const expenseAmounts = expenseAllocations.map(allocation => ({
      ...allocation,
      amount: Math.floor((amountAfterAssociate * allocation.percent) / 100)
    }));
    
    return [...allocations, ...expenseAmounts];
  };

  const handleCloseDistribution = () => {
    setShowDistributionModal(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleConfirmDelete = async (deleteOption) => {
    if (!projectToDelete) return;
    
    try {
      showLoading();
      
      if (deleteOption === 'client') {
        // Remove project from this client only
        await FinanceService.removeProjectFromClient(clientId, projectToDelete._id);
        showError('Project removed from this client successfully', 'success');
      } else if (deleteOption === 'everywhere') {
        // Delete project completely from all clients and projects
        await FinanceService.deleteProject(projectToDelete._id);
        showError('Project deleted completely from all clients and projects', 'success');
      }
      
      // Refresh the projects list
      await fetchClientProjects();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting project:', error);
      showError('Failed to delete project');
    } finally {
      hideLoading();
    }
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
    message += `*Project Details:*\n`;
    message += `Project: ${projectName}\n`;
    message += `Project No: ${projectNumber}\n`;
    message += `Total Contract: ${totalContract}\n`;
    message += `Total Received: ${totalReceived}\n`;
    message += `Pending Amount: ${pending}\n\n`;
    
    // Add associate info if applicable
    const totalAssociatePercent = selectedProject.projectAssociates && selectedProject.projectAssociates.length > 0
      ? selectedProject.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
      : 0;
    
    if (totalAssociatePercent > 0) {
      message += `*Associate Information:*\n`;
      message += `Total Associate Share: ${totalAssociatePercent}%\n`;
      selectedProject.projectAssociates.forEach((assoc, idx) => {
        const associateData = assoc.associateId || assoc.associate || assoc;
        const associateName = associateData?.name || assoc.associateName || assoc.name || `Associate ${idx + 1}`;
        const associateCompany = associateData?.company || assoc.associateCompany || assoc.company || '';
        message += `- ${associateName} (${associateCompany || 'N/A'}): ${assoc.percentage}%\n`;
      });
      message += `\nNote: Associate share is deducted first, then expenses are calculated on remaining amount.\n\n`;
    }
    
    message += `*Payment History & Distribution:*\n\n`;
    
    selectedProject.payments.forEach((payment, index) => {
      const amount = payment.amount || 0;
      const hasAssociates = selectedProject.projectAssociates && selectedProject.projectAssociates.length > 0;
      const totalAssociatePercent = hasAssociates
        ? selectedProject.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
        : 0;
      const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
      const amountAfterAssociate = amount - associateShare;
      
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `*Payment #${index + 1}*\n`;
      message += `Date: ${new Date(payment.date).toLocaleDateString()}\n`;
      message += `Amount Received: ${formatCurrency(payment.amount)}\n`;
      message += `Mode: ${payment.mode}\n`;
      if (payment.chequeNeftNumber) {
        message += `Ref: ${payment.chequeNeftNumber}\n`;
      }
      message += `\n`;
      
      // Associate Share Breakdown
      if (hasAssociates) {
        message += `*Associate Share Deductions:*\n`;
        selectedProject.projectAssociates.forEach((assoc, idx) => {
          const assocAmount = Math.floor((amount * (parseFloat(assoc.percentage) || 0)) / 100);
          const associateData = assoc.associateId || assoc.associate || assoc;
          const associateName = associateData?.name || assoc.associateName || assoc.name || `Associate ${idx + 1}`;
          const associateCompany = associateData?.company || assoc.associateCompany || assoc.company || '';
          message += `• ${associateName}`;
          if (associateCompany) {
            message += ` (${associateCompany})`;
          }
          message += `: ${assoc.percentage}% = ${formatCurrency(assocAmount)}\n`;
        });
        message += `Total Associate Share: ${formatCurrency(associateShare)}\n\n`;
        message += `*Remaining Amount for Expenses:* ${formatCurrency(amountAfterAssociate)}\n\n`;
      }
      
      // Expense Distribution
      message += `*Expense Distribution${hasAssociates ? ` (on ${formatCurrency(amountAfterAssociate)})` : ''}:*\n`;
      const expenses = [
        { label: 'Profit Margin', percent: selectedProject.profitMarginPercent || 0 },
        { label: 'Drawing', percent: selectedProject.drawingPercent || 0 },
        { label: 'Documents', percent: selectedProject.documentsPercent || 0 },
        { label: 'Site Visit', percent: selectedProject.siteVisitPercent || 0 },
        { label: 'Marketing & Misc', percent: selectedProject.marketingAndMiscPercent || 0 },
        { label: 'Office Management', percent: selectedProject.officeManagementPercent || 0 }
      ];
      
      expenses.forEach(expense => {
        const expenseAmount = Math.floor((amountAfterAssociate * expense.percent) / 100);
        message += `• ${expense.label}: ${expense.percent}% = ${formatCurrency(expenseAmount)}\n`;
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
      const exportData = filteredProjects.map((project, index) => {
        // Get last payment date if any payments exist
        let lastPaymentDate = '-';
        if (project.payments && project.payments.length > 0) {
          const sortedPayments = [...project.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
          lastPaymentDate = new Date(sortedPayments[0].date).toLocaleDateString('en-IN');
        }
        
        return {
          'Project Number': project.projectNumber || '',
          'Project Name': project.projectName || '',
          'Client Name': clientInfo.name || '',
          'Company': clientInfo.company || '',
          'Finalized Fees': project.finalizedFees || 0,
          'Received Fees': project.totalReceivedFees || 0,
          'Pending Amount': (project.finalizedFees || 0) - (project.totalReceivedFees || 0),
          'Total Payments': project.payments?.length || 0,
          'Status': project.status || '',
          'Last Payment Date': lastPaymentDate
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 15 }, // Project Number
        { wch: 30 }, // Project Name
        { wch: 20 }, // Client Name
        { wch: 20 }, // Company
        { wch: 15 }, // Finalized Fees
        { wch: 15 }, // Received Fees
        { wch: 15 }, // Pending Amount
        { wch: 12 }, // Total Payments
        { wch: 12 }, // Status
        { wch: 18 }  // Last Payment Date
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
  const handleExportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Helper function to format currency for PDF (without rupee symbol)
      const formatCurrencyForPDF = (amount) => {
        return 'Rs ' + new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount || 0);
      };
      
      // Add company logo if uploaded
      if (companyInfo.logoUrl) {
        try {
          doc.addImage(companyInfo.logoUrl, 'PNG', 14, 8, 20, 20);
        } catch (error) {
          console.error('Error adding logo:', error);
        }
      }
      
      // Add company name and tagline
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 123, 255);
      doc.text(companyInfo.name || 'Trimity Consultant', 38, 14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(companyInfo.tagline || 'Innovation, Precision, Excellence', 38, 20);
      
      // Add a horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 32, pageWidth - 14, 32);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Projects Report', pageWidth / 2, 42, { align: 'center' });
      
      // Add client info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${clientInfo.name}${clientInfo.company ? ' - ' + clientInfo.company : ''}`, 14, 52);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 52, { align: 'right' });
      
      // Add summary stats box with better alignment
      const boxY = 58;
      doc.setFillColor(245, 247, 250);
      doc.rect(14, boxY, pageWidth - 28, 16, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Projects:', 18, boxY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${stats.totalProjects}`, 51, boxY + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Total Contract Value:', 18, boxY + 11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatCurrencyForPDF(stats.totalContractValue)}`, 67, boxY + 11);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Total Received:', 105, boxY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatCurrencyForPDF(stats.totalReceived)}`, 146, boxY + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Outstanding:', 105, boxY + 11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatCurrencyForPDF(stats.outstandingAmount)}`, 141, boxY + 11);
      
      // Prepare table data
      const tableData = filteredProjects.map((project, index) => {
        // Get last payment date if any payments exist
        let lastPaymentDate = '-';
        if (project.payments && project.payments.length > 0) {
          const sortedPayments = [...project.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
          lastPaymentDate = new Date(sortedPayments[0].date).toLocaleDateString('en-IN');
        }
        
        return [
          project.projectNumber || '',
          project.projectName || '',
          formatCurrencyForPDF(project.finalizedFees),
          formatCurrencyForPDF(project.totalReceivedFees),
          formatCurrencyForPDF((project.finalizedFees || 0) - (project.totalReceivedFees || 0)),
          project.payments?.length || 0,
          project.status || '',
          lastPaymentDate
        ];
      });
      
      // Add table with optimized column widths to fit all columns
      autoTable(doc, {
        startY: 79,
        head: [['Project No', 'Project Name', 'Finalized\nFees', 'Received', 'Pending', 'Pay', 'Status', 'Last\nPayment']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 7.5,
          cellPadding: 1.8,
          font: 'helvetica',
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          halign: 'left',
          valign: 'middle',
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          valign: 'middle',
          cellPadding: 2.5
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 22, halign: 'left' },
          2: { cellWidth: 38, halign: 'left' },
          3: { cellWidth: 24, halign: 'right' },
          4: { cellWidth: 24, halign: 'right' },
          5: { cellWidth: 24, halign: 'right' },
          6: { cellWidth: 10, halign: 'center' },
          7: { cellWidth: 15, halign: 'center' },
          8: { cellWidth: 19, halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'wrap',
        didDrawPage: function (data) {
          // Footer
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
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

  const {
    items: sortedProjects,
    requestSort: requestProjectSort,
    sortConfig: projectSortConfig
  } = useSortableData(filteredProjects, { key: 'projectNumber', direction: 'asc' });

  // Pagination calculations
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = sortedProjects.slice(startIndex, endIndex);

  const renderSortIcon = (key) => {
    if (!projectSortConfig || projectSortConfig.key !== key) {
      return <FiMinus className="sort-icon" />;
    }
    return projectSortConfig.direction === 'asc'
      ? <FiChevronUp className="sort-icon" />
      : <FiChevronDown className="sort-icon" />;
  };

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
            <FaFileExcel className="inline-icon" />Export to Excel
          </button>
          <button 
            className="project-btn project-btn-danger"
            onClick={handleExportToPDF}
            title="Export projects to PDF document"
          >
            <FaFilePdf className="inline-icon" />Export to PDF
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
            <div className="stat-icon"><FaChartBar /></div>
            <div className="stat-info">
              <div className="stat-number">{stats.totalProjects}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaMoneyBillWave /></div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalContractValue)}</div>
              <div className="stat-label">Total Contract Value</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalReceived)}</div>
              <div className="stat-label">Total Received</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaClock /></div>
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
            <div className="empty-state-icon"><FiBarChart2 /></div>
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
            <table className="project-table table-sticky">
              <thead>
                <tr>
                  <th aria-sort={projectSortConfig?.key === 'projectNumber' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'projectNumber' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('projectNumber')}
                    >
                      Project Number
                      {renderSortIcon('projectNumber')}
                    </button>
                  </th>
                  <th aria-sort={projectSortConfig?.key === 'projectName' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'projectName' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('projectName')}
                    >
                      Project Name
                      {renderSortIcon('projectName')}
                    </button>
                  </th>
                  <th aria-sort={projectSortConfig?.key === 'finalizedFees' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'finalizedFees' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('finalizedFees')}
                    >
                      Finalized Fees
                      {renderSortIcon('finalizedFees')}
                    </button>
                  </th>
                  <th aria-sort={projectSortConfig?.key === 'totalReceivedFees' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'totalReceivedFees' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('totalReceivedFees')}
                    >
                      Received Fees
                      {renderSortIcon('totalReceivedFees')}
                    </button>
                  </th>
                  <th aria-sort={projectSortConfig?.key === 'pendingAmount' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'pendingAmount' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('pendingAmount', (project) => (project.finalizedFees || 0) - (project.totalReceivedFees || 0))}
                    >
                      Pending Amount
                      {renderSortIcon('pendingAmount')}
                    </button>
                  </th>
                  <th>Payments</th>
                  <th aria-sort={projectSortConfig?.key === 'status' ? projectSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${projectSortConfig?.key === 'status' ? 'active' : ''}`}
                      onClick={() => requestProjectSort('status')}
                    >
                      Status
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProjects.map((project, index) => {
                  const pendingAmount = (project.finalizedFees || 0) - (project.totalReceivedFees || 0);
                  return (
                    <tr key={project._id}>
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
                        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDistribution(project)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#9333ea', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="View Payment Distribution"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaChartBar className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                          <button
                            onClick={() => handleEditProject(project._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Edit Project"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaEdit className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Delete Project"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaTrash className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
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

        {/* Pagination Controls */}
        {filteredProjects.length > 0 && totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} projects
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`pagination-number ${currentPage === i ? 'active' : ''}`}
                        onClick={() => handlePageChange(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Distribution Modal */}
      {showDistributionModal && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseDistribution}>
          <div className="client-distribution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaMoneyBillWave className="inline-icon" />Payment Distribution - {selectedProject.projectName}</h3>
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
                <h4><FaCreditCard className="inline-icon" />Payment History & Distribution</h4>
                {selectedProject.projectAssociates && selectedProject.projectAssociates.length > 0 && (
                  <div className="associate-notice" style={{
                    padding: '12px',
                    marginBottom: '16px',
                    backgroundColor: '#e8f4fd',
                    borderLeft: '4px solid #0066cc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                      <FiInfo style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      <strong>Note:</strong> Associate share ({selectedProject.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)}%) is deducted first from each payment, then expense distributions are calculated on the remaining amount.
                    </p>
                  </div>
                )}
                {selectedProject.payments && selectedProject.payments.length > 0 ? (
                  <div className="payments-container">
                    {selectedProject.payments.map((payment, index) => {
                      const amount = payment.amount || 0;
                      const hasAssociates = selectedProject.projectAssociates && selectedProject.projectAssociates.length > 0;
                      const totalAssociatePercent = hasAssociates
                        ? selectedProject.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
                        : 0;
                      const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
                      const amountAfterAssociate = amount - associateShare;
                      
                      return (
                        <div key={index} className="payment-item">
                          <div className="payment-header">
                            <div className="payment-info">
                              <h5>Payment #{index + 1}</h5>
                              <div className="payment-details">
                                <span>Date: {new Date(payment.date).toLocaleDateString()}</span>
                                <span>Amount Received: {formatCurrency(payment.amount)}</span>
                                <span>Mode: {payment.mode}</span>
                                {payment.chequeNeftNumber && <span>Ref: {payment.chequeNeftNumber}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="payment-distribution">
                            <h6>Distribution Breakdown</h6>
                            
                            {/* Associate Share Section */}
                            {hasAssociates && (() => {
                              return (
                                <div className="distribution-section associate-section" style={{
                                  backgroundColor: '#fff3cd',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  marginBottom: '12px',
                                  border: '1px solid #ffc107'
                                }}>
                                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#856404' }}>
                                    Associate Share Deductions:
                                  </div>
                                  {selectedProject.projectAssociates.map((assoc, assocIdx) => {
                                    const assocAmount = Math.floor((amount * (parseFloat(assoc.percentage) || 0)) / 100);
                                    // Get associate data from populated associateId field
                                    const associateData = assoc.associateId || assoc.associate || assoc;
                                    const associateName = associateData?.name || assoc.associateName || assoc.name || `Associate ${assocIdx + 1}`;
                                    const associateCompany = associateData?.company || assoc.associateCompany || assoc.company || '';
                                    
                                    return (
                                      <div key={assocIdx} style={{ 
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        marginBottom: '6px',
                                        backgroundColor: 'transparent',
                                        borderRadius: '4px'
                                      }}>
                                        <div style={{ 
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: '#856404',
                                          flex: 1
                                        }}>
                                          • {associateName} {associateCompany ? `(${associateCompany})` : ''}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                          <span style={{ fontWeight: '600', color: '#856404', fontSize: '13px', minWidth: '40px', textAlign: 'right' }}>
                                            {assoc.percentage}%
                                          </span>
                                          <span style={{ fontWeight: '600', color: '#28a745', fontSize: '13px', minWidth: '80px', textAlign: 'right' }}>
                                            {formatCurrency(assocAmount)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div style={{
                                    borderTop: '1px solid #ffc107',
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    color: '#856404'
                                  }}>
                                    <span>Total Associate Share:</span>
                                    <span>{formatCurrency(associateShare)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* Remaining Amount */}
                            {hasAssociates && (
                              <div style={{
                                backgroundColor: '#d1ecf1',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                marginBottom: '12px',
                                border: '1px solid #bee5eb',
                                fontWeight: '600',
                                display: 'flex',
                                justifyContent: 'space-between',
                                color: '#0c5460'
                              }}>
                                <span>Remaining Amount for Expenses:</span>
                                <span>{formatCurrency(amountAfterAssociate)}</span>
                              </div>
                            )}
                            
                            {/* Expense Distribution Section */}
                            <div className="distribution-section expense-section" style={{
                              backgroundColor: '#f8f9fa',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                                Expense Distribution {hasAssociates ? `(on ${formatCurrency(amountAfterAssociate)})` : ''}:
                              </div>
                              <div className="distribution-grid">
                                {[
                                  { label: 'Profit Margin', percent: selectedProject.profitMarginPercent || 0 },
                                  { label: 'Drawing', percent: selectedProject.drawingPercent || 0 },
                                  { label: 'Documents', percent: selectedProject.documentsPercent || 0 },
                                  { label: 'Site Visit', percent: selectedProject.siteVisitPercent || 0 },
                                  { label: 'Marketing & Misc', percent: selectedProject.marketingAndMiscPercent || 0 },
                                  { label: 'Office Management', percent: selectedProject.officeManagementPercent || 0 }
                                ].map((item, idx) => {
                                  const expenseAmount = Math.floor((amountAfterAssociate * item.percent) / 100);
                                  return (
                                    <div key={idx} className="distribution-item">
                                      <div className="distribution-category">{item.label}</div>
                                      <div className="distribution-values">
                                        <span className="distribution-percent">{item.percent}%</span>
                                        <span className="distribution-amount">{formatCurrency(expenseAmount)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
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
                <FaWhatsapp /> Share WhatsApp
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaTrash className="inline-icon" />Delete Project - {projectToDelete.projectName}</h3>
              <button className="modal-close" onClick={handleCloseDeleteModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon"><FiAlertTriangle /></div>
                <p><strong>Warning:</strong> You are about to delete this project. Please choose an option:</p>
              </div>
              
              <div className="delete-options">
                <div className="delete-option">
                  <h4><FaLink className="inline-icon" />Remove from Client Only</h4>
                  <p>Remove this project from <strong>{clientInfo.name}</strong> only. The project will still exist in the system and can be linked to other clients.</p>
                  <button 
                    className="btn btn-warning delete-option-btn"
                    onClick={() => handleConfirmDelete('client')}
                  >
                    Remove from {clientInfo.name} Only
                  </button>
                </div>
                
                <div className="delete-option danger">
                  <h4><FaTrash className="inline-icon" />Delete Completely</h4>
                  <p><strong>Danger:</strong> Delete this project completely from all clients and the entire system. This action cannot be undone!</p>
                  <button 
                    className="btn btn-danger delete-option-btn"
                    onClick={() => handleConfirmDelete('everywhere')}
                  >
                    Delete Everywhere (Permanent)
                  </button>
                </div>
              </div>
              
              <div className="project-details">
                <h5>Project Details:</h5>
                <div className="detail-row">
                  <span>Project Number:</span>
                  <strong>{projectToDelete.projectNumber}</strong>
                </div>
                <div className="detail-row">
                  <span>Contract Value:</span>
                  <strong>{formatCurrency(projectToDelete.finalizedFees)}</strong>
                </div>
                <div className="detail-row">
                  <span>Payments Recorded:</span>
                  <strong>{projectToDelete.payments?.length || 0}</strong>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDeleteModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectsPage;