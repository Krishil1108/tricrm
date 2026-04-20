import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FinanceService from './services/FinanceService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import { FaCalendarAlt, FaChartBar, FaCheckCircle, FaClock, FaDownload, FaEdit, FaFileExcel, FaFilePdf, FaHistory, FaMoneyBillWave, FaUser, FaUsers } from 'react-icons/fa';
import { FiBarChart2, FiChevronDown, FiChevronUp, FiMinus } from 'react-icons/fi';
import useSortableData from './utils/useSortableData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    status: 'all',
    financialYear: 'all' // Add FY filter
  });
  const [activeView, setActiveView] = useState('owner'); // 'owner' or 'associate'
  const [availableFYs, setAvailableFYs] = useState([]); // Store available financial years
  
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

  // Recalculate stats when FY filter changes
  useEffect(() => {
    if (projects.length > 0) {
      calculateStats(projects, filters.financialYear);
    }
  }, [filters.financialYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAssociateProjects = async () => {
    try {
      showLoading();
      const projectsData = await FinanceService.getProjectsByAssociate(associateId);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      
      // Generate available FYs
      const fys = generateAvailableFYs(projectsData);
      setAvailableFYs(fys);
      
      // Calculate stats with current FY filter
      calculateStats(projectsData, filters.financialYear);
    } catch (error) {
      console.error('Error fetching associate projects:', error);
      showError('Failed to load associate projects');
      setProjects([]);
    } finally {
      hideLoading();
    }
  };

  const calculateStats = (projectsData, selectedFY = 'all') => {
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
          // Filter payments by FY if specified
          const fyPayments = filterPaymentsByFY(associateData.paymentTransactions, selectedFY);
          const fyAmountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
          
          // Calculate this associate's share of the project (based on received fees)
          const associateShare = Math.round((project.totalReceivedFees * (associateData.percentage || 0)) / 100);
          stats.totalAssociateAllocation += associateShare;
          stats.totalAssociatePaid += fyAmountPaid;
          stats.totalAssociatePending += (associateShare - fyAmountPaid);
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

  // Helper function to get FY date range
  const getFYDateRange = (fy) => {
    if (!fy || fy === 'all') return { start: null, end: null };
    
    const [startYear] = fy.split('-');
    const year = parseInt(startYear, 10);
    
    return {
      start: new Date(`${year}-04-01T00:00:00`),
      end: new Date(`${year + 1}-03-31T23:59:59`)
    };
  };

  // Helper function to filter payments by FY
  const filterPaymentsByFY = (payments, fy) => {
    if (!fy || fy === 'all' || !payments || !Array.isArray(payments)) {
      return payments || [];
    }
    
    const { start, end } = getFYDateRange(fy);
    if (!start || !end) return payments;
    
    return payments.filter(payment => {
      if (!payment.transactionDate) return false;
      const paymentDate = new Date(payment.transactionDate);
      return paymentDate >= start && paymentDate <= end;
    });
  };

  // Generate available financial years from project data
  const generateAvailableFYs = (projectsData) => {
    const fys = new Set();
    
    projectsData.forEach(project => {
      if (project.projectAssociates) {
        project.projectAssociates.forEach(assoc => {
          if (assoc.paymentTransactions) {
            assoc.paymentTransactions.forEach(payment => {
              if (payment.transactionDate) {
                const fy = getFinancialYear(payment.transactionDate);
                if (fy !== '-') fys.add(fy);
              }
            });
          }
        });
      }
    });
    
    // Convert to array and sort in descending order (most recent first)
    const fyArray = Array.from(fys).sort((a, b) => {
      const [yearA] = a.split('-').map(Number);
      const [yearB] = b.split('-').map(Number);
      return yearB - yearA;
    });
    
    return fyArray;
  };

  const handleBackToAssociates = () => {
    navigate('/associates');
  };

  // Helper function to calculate Indian Financial Year (April-March)
  const getFinancialYear = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const month = d.getMonth(); // 0-11 (0=Jan, 3=Apr, 11=Dec)
    const year = d.getFullYear();
    
    // If month is April (3) or later, FY is current year to next year
    // If month is Jan-Mar (0-2), FY is previous year to current year
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      if (filteredProjects.length === 0) {
        showError('No projects to export');
        return;
      }
      
      // ===== 1. Project Summary Data =====
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

      // ===== 2. Payment Entries Data =====
      const paymentEntries = [];
      filteredProjects.forEach(project => {
        const associateDataFromProject = project.projectAssociates?.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        if (associateDataFromProject?.paymentTransactions && associateDataFromProject.paymentTransactions.length > 0) {
          associateDataFromProject.paymentTransactions.forEach(transaction => {
            paymentEntries.push({
              'Project Number': project.projectNumber || '',
              'Project Name': project.projectName || '',
              'Transaction Date': transaction.transactionDate ? 
                new Date(transaction.transactionDate).toLocaleDateString('en-IN') : '-',
              'Financial Year': getFinancialYear(transaction.transactionDate),
              'Payment Mode': transaction.paymentMode || '-',
              'Cheque/NEFT Number': transaction.chequeNeftNumber || '-',
              'Amount (₹)': transaction.amount || 0,
              'Notes': transaction.notes || '-'
            });
          });
        }
      });

      // ===== 3. Financial Year Summary Data =====
      const fyMap = new Map();
      
      filteredProjects.forEach(project => {
        const associateDataFromProject = project.projectAssociates?.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        if (associateDataFromProject?.paymentTransactions && associateDataFromProject.paymentTransactions.length > 0) {
          associateDataFromProject.paymentTransactions.forEach(transaction => {
            const fy = getFinancialYear(transaction.transactionDate);
            
            if (!fyMap.has(fy)) {
              fyMap.set(fy, {
                totalReceived: 0,
                totalSettled: 0,
                transactionCount: 0,
                projectsSet: new Set()
              });
            }
            
            const fyData = fyMap.get(fy);
            fyData.totalSettled += (transaction.amount || 0);
            fyData.transactionCount += 1;
            fyData.projectsSet.add(project.projectNumber);
          });
        }
        
        // Calculate total received per FY based on project payment entries
        if (project.paymentEntries && project.paymentEntries.length > 0) {
          const associatePercentage = associateDataFromProject?.percentage || 0;
          
          project.paymentEntries.forEach(entry => {
            const fy = getFinancialYear(entry.paymentDate);
            const associateShare = Math.round((entry.amountReceived * associatePercentage) / 100);
            
            if (!fyMap.has(fy)) {
              fyMap.set(fy, {
                totalReceived: 0,
                totalSettled: 0,
                transactionCount: 0,
                projectsSet: new Set()
              });
            }
            
            fyMap.get(fy).totalReceived += associateShare;
          });
        }
      });

      // Convert fyMap to array and sort by FY (most recent first)
      const fySummary = Array.from(fyMap.entries())
        .map(([fy, data]) => ({
          'Financial Year': fy,
          'Total Payments Received (₹)': data.totalReceived,
          'Total Payments Settled (₹)': data.totalSettled,
          'Pending Amount (₹)': data.totalReceived - data.totalSettled,
          'Number of Transactions': data.transactionCount,
          'Number of Projects': data.projectsSet.size
        }))
        .sort((a, b) => b['Financial Year'].localeCompare(a['Financial Year']));

      // ===== 4. Create Excel Workbook =====
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Associate Projects Summary
      const worksheet = XLSX.utils.json_to_sheet(exportData);
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

      // Sheet 2: Payment Entries Detail
      if (paymentEntries.length > 0) {
        const paymentWorksheet = XLSX.utils.json_to_sheet(paymentEntries);
        const paymentColumnWidths = [
          { wch: 15 }, // Project Number
          { wch: 30 }, // Project Name
          { wch: 15 }, // Transaction Date
          { wch: 15 }, // Financial Year
          { wch: 15 }, // Payment Mode
          { wch: 20 }, // Cheque/NEFT Number
          { wch: 15 }, // Amount
          { wch: 30 }  // Notes
        ];
        paymentWorksheet['!cols'] = paymentColumnWidths;
        XLSX.utils.book_append_sheet(workbook, paymentWorksheet, 'Payment Entries');
      }

      // Sheet 3: Project-wise Financial Year Distribution
      const projectFYDistribution = [];
      
      filteredProjects.forEach(project => {
        const associateDataFromProject = project.projectAssociates?.find(
          assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
        );
        
        if (associateDataFromProject?.paymentTransactions && associateDataFromProject.paymentTransactions.length > 0) {
          // Group payments by financial year for this project
          const projectFYMap = new Map();
          
          associateDataFromProject.paymentTransactions.forEach(transaction => {
            const fy = getFinancialYear(transaction.transactionDate);
            if (!projectFYMap.has(fy)) {
              projectFYMap.set(fy, []);
            }
            projectFYMap.get(fy).push(transaction);
          });
          
          // Sort FY keys
          const sortedFYs = Array.from(projectFYMap.keys()).sort();
          
          // Add rows for each FY with payments
          sortedFYs.forEach((fy, index) => {
            const transactions = projectFYMap.get(fy);
            const fyTotal = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // First row for this FY shows project details
            if (index === 0) {
              projectFYDistribution.push({
                'Project Number': project.projectNumber || '',
                'Project Name': project.projectName || '',
                'Financial Year': fy,
                'Payments': transactions.map(t => 
                  `${new Date(t.transactionDate).toLocaleDateString('en-IN')}: ₹${(t.amount || 0).toLocaleString('en-IN')}`
                ).join(' | '),
                'FY Total (₹)': fyTotal,
                'Remarks': `${transactions.length} payment(s)`
              });
            } else {
              // Subsequent FYs for same project - leave project details blank
              projectFYDistribution.push({
                'Project Number': '',
                'Project Name': '',
                'Financial Year': fy,
                'Payments': transactions.map(t => 
                  `${new Date(t.transactionDate).toLocaleDateString('en-IN')}: ₹${(t.amount || 0).toLocaleString('en-IN')}`
                ).join(' | '),
                'FY Total (₹)': fyTotal,
                'Remarks': `${transactions.length} payment(s)`
              });
            }
          });
          
          // Add project total row
          const projectTotal = associateDataFromProject.paymentTransactions.reduce(
            (sum, t) => sum + (t.amount || 0), 0
          );
          projectFYDistribution.push({
            'Project Number': '',
            'Project Name': '',
            'Financial Year': 'PROJECT TOTAL',
            'Payments': '',
            'FY Total (₹)': projectTotal,
            'Remarks': `Total across ${sortedFYs.length} FY(s)`
          });
          
          // Add blank row for spacing
          projectFYDistribution.push({
            'Project Number': '',
            'Project Name': '',
            'Financial Year': '',
            'Payments': '',
            'FY Total (₹)': '',
            'Remarks': ''
          });
        }
      });
      
      // Add FY-wise grand totals at the bottom
      if (projectFYDistribution.length > 0) {
        const allFYTotals = new Map();
        
        filteredProjects.forEach(project => {
          const associateDataFromProject = project.projectAssociates?.find(
            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
          );
          
          if (associateDataFromProject?.paymentTransactions) {
            associateDataFromProject.paymentTransactions.forEach(transaction => {
              const fy = getFinancialYear(transaction.transactionDate);
              allFYTotals.set(fy, (allFYTotals.get(fy) || 0) + (transaction.amount || 0));
            });
          }
        });
        
        projectFYDistribution.push({
          'Project Number': '',
          'Project Name': '',
          'Financial Year': '═══════════════',
          'Payments': '',
          'FY Total (₹)': '',
          'Remarks': 'FINANCIAL YEAR TOTALS'
        });
        
        const sortedAllFYs = Array.from(allFYTotals.keys()).sort();
        sortedAllFYs.forEach(fy => {
          projectFYDistribution.push({
            'Project Number': '',
            'Project Name': '',
            'Financial Year': fy,
            'Payments': '',
            'FY Total (₹)': allFYTotals.get(fy),
            'Remarks': 'Grand Total'
          });
        });
        
        // Overall grand total
        const overallTotal = Array.from(allFYTotals.values()).reduce((sum, val) => sum + val, 0);
        projectFYDistribution.push({
          'Project Number': '',
          'Project Name': '',
          'Financial Year': 'OVERALL TOTAL',
          'Payments': '',
          'FY Total (₹)': overallTotal,
          'Remarks': 'All payments'
        });
      }
      
      if (projectFYDistribution.length > 0) {
        const projectFYWorksheet = XLSX.utils.json_to_sheet(projectFYDistribution);
        const projectFYColumnWidths = [
          { wch: 15 }, // Project Number
          { wch: 30 }, // Project Name
          { wch: 15 }, // Financial Year
          { wch: 60 }, // Payments
          { wch: 15 }, // FY Total
          { wch: 25 }  // Remarks
        ];
        projectFYWorksheet['!cols'] = projectFYColumnWidths;
        XLSX.utils.book_append_sheet(workbook, projectFYWorksheet, 'Project FY Distribution');
      }

      // Sheet 4: Financial Year Summary
      if (fySummary.length > 0) {
        const fyWorksheet = XLSX.utils.json_to_sheet(fySummary);
        const fyColumnWidths = [
          { wch: 15 }, // Financial Year
          { wch: 22 }, // Total Payments Received
          { wch: 22 }, // Total Payments Settled
          { wch: 18 }, // Pending Amount
          { wch: 20 }, // Number of Transactions
          { wch: 18 }  // Number of Projects
        ];
        fyWorksheet['!cols'] = fyColumnWidths;
        XLSX.utils.book_append_sheet(workbook, fyWorksheet, 'Financial Year Summary');
      }

      // Sheet 5: Overall Summary
      const summary = [
        { 'Field': 'Associate Name', 'Value': associateInfo.name },
        { 'Field': 'Company', 'Value': associateInfo.company || '-' },
        { 'Field': 'Export Date', 'Value': new Date().toLocaleString('en-IN') },
        { 'Field': 'Total Projects', 'Value': stats.totalProjects },
        { 'Field': 'Total Associate Allocation', 'Value': `₹${stats.totalAssociateAllocation.toLocaleString('en-IN')}` },
        { 'Field': 'Amount Paid to Associate', 'Value': `₹${stats.totalAssociatePaid.toLocaleString('en-IN')}` },
        { 'Field': 'Pending to Associate', 'Value': `₹${stats.totalAssociatePending.toLocaleString('en-IN')}` },
        { 'Field': 'Total Payment Entries', 'Value': paymentEntries.length }
      ];
      
      const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      const filename = `${associateInfo.name.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Use writeFileXLSX for better browser compatibility
      XLSX.writeFileXLSX(workbook, filename, {
        compression: true,
        bookType: 'xlsx'
      });
      showSuccess(`Statement exported successfully as ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      console.error('Error stack:', error.stack);
      showError(`Failed to export statement to Excel: ${error.message}`);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      if (filteredProjects.length === 0) {
        showError('No projects to export');
        return;
      }
      
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
      autoTable(doc, {
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
      console.error('Error stack:', error.stack);
      showError(`Failed to export statement to PDF: ${error.message}`);
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
    const associateAmount = Math.round((project.totalReceivedFees * (associateData?.percentage || 0)) / 100);
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
      
      // Refresh the projects list and payment history in background
      fetchAssociateProjects();
      if (showPaymentHistoryModal) {
        handleViewPayments(selectedProject, selectedAssociate);
      }
      
      // Close modal and reset form immediately
      setShowPaymentModal(false);
      setSelectedProject(null);
      setSelectedAssociate(null);
      setSelectedAssociateData(null);
      setEditingTransactionId(null);
      
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Failed to add payment transaction');
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
    if (window.confirm('Are you sure you want to delete this payment transaction?')) {
      try {
        // Optimistically remove from UI
        const updatedHistory = paymentHistory.filter((_, i) => i !== index);
        setPaymentHistory(updatedHistory);
        
        const response = await FinanceService.deleteAssociatePaymentTransaction(
          selectedProject._id, 
          associateId, 
          payment._id
        );

        if (response.success) {
          // Update the project data in background
          fetchAssociateProjects();
          showSuccess('Payment transaction deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting payment transaction:', error);
        showError('Failed to delete payment transaction. Please try again.');
        // Restore on error
        handleViewPayments(selectedProject, selectedAssociate);
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
  }, [filters.search, filters.status, filters.financialYear]);

  return (
    <div className="project-page">
      {/* Hero Header */}
      <div className="project-hero">
        <div className="hero-left">
          <div className="hero-breadcrumb">
            <button className="hero-breadcrumb-btn" onClick={handleBackToAssociates}>
              Associates
            </button>
            <span className="hero-breadcrumb-sep">›</span>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              {associateInfo.name}{associateInfo.company ? ` (${associateInfo.company})` : ''}
            </span>
          </div>
          <h1 className="hero-title">Associate Projects</h1>
          <p className="hero-subtitle">
            <strong style={{ color: '#fff' }}>{associateInfo.name}</strong>
            {associateInfo.company && <span> · {associateInfo.company}</span>}
            {stats.totalProjects > 0 && <span> · {stats.totalProjects} project{stats.totalProjects !== 1 ? 's' : ''}</span>}
            {filters.financialYear !== 'all' && (
              <span 
                style={{
                  marginLeft: '8px',
                  padding: '3px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                FY {filters.financialYear}
              </span>
            )}
          </p>
        </div>
        <div className="hero-actions">
          <button
            className="project-btn project-btn-success"
            onClick={exportToExcel}
            title="Download Excel"
          >
            <FaFileExcel /> Export Excel
          </button>
          <button
            className="project-btn project-btn-danger"
            onClick={exportToPDF}
            title="Download PDF"
          >
            <FaFilePdf /> Export PDF
          </button>
          <button
            className="project-btn project-btn-primary"
            onClick={() => navigate('/projects', { state: { associateId: associateId } })}
          >
            <i className="bi bi-plus-lg"></i> Add Project
          </button>
          <button
            className="project-btn project-btn-secondary"
            onClick={handleBackToAssociates}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
        </div>
      </div>

      <div className="page-body">

      {/* FY Filter Banner - Shows when specific FY is selected */}
      {filters.financialYear !== 'all' && canViewStats('associates') && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaCalendarAlt style={{ color: '#fff', fontSize: '20px' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                Financial Year {filters.financialYear}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                Showing payments from April {filters.financialYear.split('-')[0]} to March {parseInt(filters.financialYear.split('-')[0]) + 1}
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, financialYear: 'all' }))}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            Show All Time
          </button>
        </div>
      )}

      {/* Stats Cards - Role-based visibility */}
      {canViewStats('associates') && (
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
              <div className="stat-number">{formatCurrency(stats.totalReceived)}</div>
              <div className="stat-label">Total Received by Owner</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalAssociateAllocation)}</div>
              <div className="stat-label">Total Associate Allocation</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalAssociatePaid)}</div>
              <div className="stat-label">
                {filters.financialYear !== 'all' ? `Paid in FY ${filters.financialYear}` : 'Amount Paid to Associate'}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.totalAssociatePending)}</div>
              <div className="stat-label">
                {filters.financialYear !== 'all' ? `Pending (FY ${filters.financialYear})` : 'Pending to Associate'}
              </div>
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
            value={filters.financialYear} 
            onChange={(e) => setFilters(prev => ({ ...prev, financialYear: e.target.value }))}
            className="filter-select"
            title="Filter by Financial Year"
          >
            <option value="all">All Time</option>
            {availableFYs.map(fy => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>
          
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
                    <th aria-sort={projectSortConfig?.key === 'associatePercentage' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'associatePercentage' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('associatePercentage', (project) => {
                          const associateDataFromProject = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          return associateDataFromProject?.percentage || 0;
                        })}
                      >
                        Associate Share %
                        {renderSortIcon('associatePercentage')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'associateAmount' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'associateAmount' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('associateAmount', (project) => {
                          const associateDataFromProject = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const associatePercentage = associateDataFromProject?.percentage || 0;
                          return Math.round((project.totalReceivedFees * associatePercentage) / 100);
                        })}
                      >
                        Associate Amount
                        {renderSortIcon('associateAmount')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'amountPaid' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'amountPaid' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('amountPaid', (project) => {
                          const associateDataFromProject = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const fyPayments = filterPaymentsByFY(associateDataFromProject?.paymentTransactions, filters.financialYear);
                          return fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                        })}
                      >
                        Amount Paid to Associate
                        {renderSortIcon('amountPaid')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'pendingAmount' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'pendingAmount' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('pendingAmount', (project) => {
                          const associateDataFromProject = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const associatePercentage = associateDataFromProject?.percentage || 0;
                          const receivedBasedAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                          const fyPayments = filterPaymentsByFY(associateDataFromProject?.paymentTransactions, filters.financialYear);
                          const amountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                          return receivedBasedAmount - amountPaid;
                        })}
                      >
                        Pending to Associate
                        {renderSortIcon('pendingAmount')}
                      </button>
                    </th>
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
                    const finalizedShareAmount = Math.round(((project.finalizedFees || 0) * associatePercentage) / 100);
                    const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                    
                    // Calculate FY-specific amounts
                    const fyPayments = filterPaymentsByFY(associateDataFromProject?.paymentTransactions, filters.financialYear);
                    const amountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                    const pendingAmount = associateAmount - amountPaid;
                    
                    return (
                      <tr key={project._id}>
                        <td>{project.projectNumber}</td>
                        <td>
                          <div className="project-name">
                            <strong>{project.projectName}</strong>
                          </div>
                        </td>
                        <td style={{ 
                          color: (project.finalizedFees || 0) === 0 ? 'red' : 'inherit',
                          fontWeight: (project.finalizedFees || 0) === 0 ? 'bold' : 'normal'
                        }}>
                          {formatCurrency(project.finalizedFees)}
                        </td>
                        <td>
                          {associatePercentage > 0 ? (
                            <span className="percentage-badge">
                              {associatePercentage}% ({formatCurrency(finalizedShareAmount)})
                            </span>
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
                    <th aria-sort={projectSortConfig?.key === 'associatePercentage' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'associatePercentage' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('associatePercentage', (project) => {
                          const associateData = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          return associateData?.percentage || 0;
                        })}
                      >
                        Associate Share %
                        {renderSortIcon('associatePercentage')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'associateAmount' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'associateAmount' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('associateAmount', (project) => {
                          const associateData = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const associatePercentage = associateData?.percentage || 0;
                          return Math.round((project.totalReceivedFees * associatePercentage) / 100);
                        })}
                      >
                        Allocated Amount
                        {renderSortIcon('associateAmount')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'paymentStatus' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'paymentStatus' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('paymentStatus', (project) => {
                          const associateData = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const associatePercentage = associateData?.percentage || 0;
                          const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                          const fyPayments = filterPaymentsByFY(associateData?.paymentTransactions, filters.financialYear);
                          const amountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                          const pendingAmount = associateAmount - amountPaid;
                          return pendingAmount === 0 ? 'Completed' : amountPaid > 0 ? 'Partial' : 'Pending';
                        })}
                      >
                        Payment Status
                        {renderSortIcon('paymentStatus')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'amountPaid' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'amountPaid' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('amountPaid', (project) => {
                          const associateData = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const fyPayments = filterPaymentsByFY(associateData?.paymentTransactions, filters.financialYear);
                          return fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                        })}
                      >
                        Paid Amount
                        {renderSortIcon('amountPaid')}
                      </button>
                    </th>
                    <th aria-sort={projectSortConfig?.key === 'pendingAmount' ? projectSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${projectSortConfig?.key === 'pendingAmount' ? 'active' : ''}`}
                        onClick={() => requestProjectSort('pendingAmount', (project) => {
                          const associateData = project.projectAssociates?.find(
                            assoc => assoc.associateId === associateId || assoc.associateId?._id === associateId
                          );
                          const associatePercentage = associateData?.percentage || 0;
                          const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                          const fyPayments = filterPaymentsByFY(associateData?.paymentTransactions, filters.financialYear);
                          const amountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                          return associateAmount - amountPaid;
                        })}
                      >
                        Pending Amount
                        {renderSortIcon('pendingAmount')}
                      </button>
                    </th>
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
                    const finalizedShareAmount = Math.round(((project.finalizedFees || 0) * associatePercentage) / 100);
                    const associateAmount = Math.round((project.totalReceivedFees * associatePercentage) / 100);
                    
                    // Calculate FY-specific amounts
                    const fyPayments = filterPaymentsByFY(associateData?.paymentTransactions, filters.financialYear);
                    const amountPaid = fyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
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
                            <span className="percentage-badge">
                              {associatePercentage}% ({formatCurrency(finalizedShareAmount)})
                            </span>
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
      </div>{/* end page-body */}

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
