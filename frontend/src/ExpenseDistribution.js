import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

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

  // Generate available financial years (April to March)
  const getFinancialYears = () => {
    const years = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // If current month is Jan-Mar, we're in previous year's FY
    const startYear = currentMonth < 3 ? currentYear - 5 : currentYear - 4;
    const endYear = currentMonth < 3 ? currentYear : currentYear + 1;
    
    for (let year = startYear; year <= endYear; year++) {
      const fyValue = `${year}-${(year + 1).toString().slice(-2)}`;
      years.push({
        value: fyValue,
        label: `FY ${year}-${(year + 1).toString().slice(-2)}`
      });
    }
    
    return years.reverse(); // Most recent first
  };

  // Get financial year from a date (April to March)
  const getFinancialYearFromDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    
    // If month is Jan-Mar (0-2), FY is (year-1)-year (last 2 digits)
    // If month is Apr-Dec (3-11), FY is year-(year+1) (last 2 digits)
    if (month < 3) {
      return `${year - 1}-${year.toString().slice(-2)}`;
    } else {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    }
  };

  // Export to Excel with financial year data
  const exportToExcel = async () => {
    if (!selectedFinancialYear) {
      alert('Please select a financial year to export');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all projects and associates data
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [projectsRes, associatesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/finance/projects`, config),
        axios.get(`${API_BASE_URL}/associates`, config)
      ]);

      // Handle different response structures
      const allProjects = projectsRes.data.data || projectsRes.data || [];
      const allAssociates = associatesRes.data.data || associatesRes.data || [];

      console.log('Total projects fetched:', allProjects.length);
      console.log('Selected FY:', selectedFinancialYear);

      // Aggregate projects and payments by financial year
      const fyAggregation = {};
      
      allProjects.forEach(project => {
        if (project.payments && project.payments.length > 0) {
          project.payments.forEach(payment => {
            const paymentFY = getFinancialYearFromDate(payment.date);
            
            if (!fyAggregation[paymentFY]) {
              fyAggregation[paymentFY] = {
                projects: new Map(),
                totalAmount: 0,
                totalExpenses: {
                  drawing: 0,
                  documents: 0,
                  siteVisit: 0,
                  marketingAndMisc: 0,
                  officeManagement: 0
                },
                payments: []
              };
            }

            // Track unique projects
            if (!fyAggregation[paymentFY].projects.has(project._id)) {
              fyAggregation[paymentFY].projects.set(project._id, {
                projectNumber: project.projectNumber,
                projectName: project.projectName,
                clientName: project.clientName,
                finalizedFees: project.finalizedFees || 0,
                totalPaid: 0,
                expenses: project.expenses || {},
                paymentsInFY: []
              });
            }

            // Add payment to project
            const projectData = fyAggregation[paymentFY].projects.get(project._id);
            projectData.totalPaid += payment.amount || 0;
            projectData.paymentsInFY.push({
              date: payment.date,
              amount: payment.amount,
              mode: payment.paymentMode,
              transactionId: payment.transactionId,
              remarks: payment.remarks
            });

            // Add to FY totals
            fyAggregation[paymentFY].totalAmount += payment.amount || 0;
            fyAggregation[paymentFY].payments.push({
              projectNumber: project.projectNumber,
              projectName: project.projectName,
              ...payment
            });
          });
        }
      });

      // Calculate expense distribution for selected FY
      if (fyAggregation[selectedFinancialYear]) {
        fyAggregation[selectedFinancialYear].projects.forEach(project => {
          const expenses = project.expenses || {};
          fyAggregation[selectedFinancialYear].totalExpenses.drawing += expenses.drawing || 0;
          fyAggregation[selectedFinancialYear].totalExpenses.documents += expenses.documents || 0;
          fyAggregation[selectedFinancialYear].totalExpenses.siteVisit += expenses.siteVisit || 0;
          fyAggregation[selectedFinancialYear].totalExpenses.marketingAndMisc += expenses.marketingAndMisc || 0;
          fyAggregation[selectedFinancialYear].totalExpenses.officeManagement += expenses.officeManagement || 0;
        });
      }

      const selectedFYData = fyAggregation[selectedFinancialYear];
      
      if (!selectedFYData || selectedFYData.projects.size === 0) {
        const confirmExport = window.confirm(
          `No payment entries found for Financial Year ${selectedFinancialYear}.\n\nDo you still want to generate an empty report?`
        );
        if (!confirmExport) {
          setLoading(false);
          return;
        }
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      const fyProjects = selectedFYData ? Array.from(selectedFYData.projects.values()) : [];
      const totalReceived = selectedFYData ? selectedFYData.totalAmount : 0;
      const totalExpensesAmount = selectedFYData ? Object.values(selectedFYData.totalExpenses).reduce((sum, val) => sum + val, 0) : 0;

      // Sheet 1: Summary
      const summaryData = [
        ['FINANCIAL YEAR REPORT'],
        [`Financial Year: ${selectedFinancialYear}`],
        [`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`],
        [],
        ['SUMMARY STATISTICS'],
        ['Total Projects with Payments in FY', fyProjects.length],
        ['Total Payments Received in FY', totalReceived],
        ['Total Expenses Allocated', totalExpensesAmount],
        ['Available Balance', totalReceived - totalExpensesAmount],
        [],
        ['EXPENSE DISTRIBUTION'],
        ['Category', 'Amount', 'Percentage', 'Allocated %'],
        ['Drawing', 
         selectedFYData?.totalExpenses.drawing || 0,
         totalReceived > 0 ? ((selectedFYData?.totalExpenses.drawing || 0) / totalReceived * 100).toFixed(2) + '%' : '0%',
         '40%'
        ],
        ['Documents',
         selectedFYData?.totalExpenses.documents || 0,
         totalReceived > 0 ? ((selectedFYData?.totalExpenses.documents || 0) / totalReceived * 100).toFixed(2) + '%' : '0%',
         '30%'
        ],
        ['Site Visit',
         selectedFYData?.totalExpenses.siteVisit || 0,
         totalReceived > 0 ? ((selectedFYData?.totalExpenses.siteVisit || 0) / totalReceived * 100).toFixed(2) + '%' : '0%',
         '10%'
        ],
        ['Marketing & Misc',
         selectedFYData?.totalExpenses.marketingAndMisc || 0,
         totalReceived > 0 ? ((selectedFYData?.totalExpenses.marketingAndMisc || 0) / totalReceived * 100).toFixed(2) + '%' : '0%',
         '2%'
        ],
        ['Office Management',
         selectedFYData?.totalExpenses.officeManagement || 0,
         totalReceived > 0 ? ((selectedFYData?.totalExpenses.officeManagement || 0) / totalReceived * 100).toFixed(2) + '%' : '0%',
         '3%'
        ],
        ['TOTAL EXPENSES', totalExpensesAmount, '100%', '85%'],
        [],
        ['FINANCIAL YEAR COMPARISON'],
        ['Financial Year', 'Total Payments', 'Total Projects', 'Avg Payment per Project'],
      ];

      // Add FY comparison data
      Object.keys(fyAggregation).sort().forEach(fy => {
        const fyData = fyAggregation[fy];
        summaryData.push([
          `FY ${fy}`,
          fyData.totalAmount,
          fyData.projects.size,
          fyData.projects.size > 0 ? (fyData.totalAmount / fyData.projects.size).toFixed(2) : 0
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summarySheet['!cols'] = [
        { wch: 30 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Sheet 2: Projects with Payments in Selected FY
      const projectHeaders = [
        'Project Number',
        'Project Name',
        'Client Name',
        'Total Finalized Fees',
        'Payments in FY',
        'Drawing',
        'Documents',
        'Site Visit',
        'Marketing & Misc',
        'Office Management',
        'Total Expenses',
        'Number of Payments'
      ];

      const projectRows = fyProjects.map(project => {
        const totalExpenses = (project.expenses?.drawing || 0) +
                             (project.expenses?.documents || 0) +
                             (project.expenses?.siteVisit || 0) +
                             (project.expenses?.marketingAndMisc || 0) +
                             (project.expenses?.officeManagement || 0);
        
        return [
          project.projectNumber || '',
          project.projectName || '',
          project.clientName || '',
          project.finalizedFees || 0,
          project.totalPaid || 0,
          project.expenses?.drawing || 0,
          project.expenses?.documents || 0,
          project.expenses?.siteVisit || 0,
          project.expenses?.marketingAndMisc || 0,
          project.expenses?.officeManagement || 0,
          totalExpenses,
          project.paymentsInFY?.length || 0
        ];
      });

      // Add totals row
      const totalRow = [
        '',
        'TOTAL',
        '',
        fyProjects.reduce((sum, p) => sum + (p.finalizedFees || 0), 0),
        fyProjects.reduce((sum, p) => sum + (p.totalPaid || 0), 0),
        selectedFYData?.totalExpenses.drawing || 0,
        selectedFYData?.totalExpenses.documents || 0,
        selectedFYData?.totalExpenses.siteVisit || 0,
        selectedFYData?.totalExpenses.marketingAndMisc || 0,
        selectedFYData?.totalExpenses.officeManagement || 0,
        totalExpensesAmount,
        fyProjects.reduce((sum, p) => sum + (p.paymentsInFY?.length || 0), 0)
      ];

      const projectData = [projectHeaders, ...projectRows, totalRow];
      const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
      
      projectSheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 25 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 }
      ];

      XLSX.utils.book_append_sheet(wb, projectSheet, 'Projects in FY');

      // Sheet 3: All Payment Entries in Selected FY
      const paymentHeaders = [
        'S.No.',
        'Payment Date',
        'Project Number',
        'Project Name',
        'Amount',
        'Payment Mode',
        'Cheque/NEFT Number',
        'Transaction ID',
        'Remarks',
        'Cumulative Total'
      ];

      let cumulativeTotal = 0;
      const paymentRows = selectedFYData ? selectedFYData.payments
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((payment, index) => {
          cumulativeTotal += payment.amount || 0;
          return [
            index + 1,
            payment.date ? new Date(payment.date).toLocaleDateString('en-IN') : '',
            payment.projectNumber || '',
            payment.projectName || '',
            payment.amount || 0,
            payment.paymentMode || '',
            payment.chequeNumber || payment.neftNumber || '',
            payment.transactionId || '',
            payment.remarks || '',
            cumulativeTotal
          ];
        }) : [];

      // Add summary row
      if (paymentRows.length > 0) {
        paymentRows.push([
          '',
          'TOTAL',
          '',
          '',
          selectedFYData.totalAmount,
          '',
          '',
          '',
          `${paymentRows.length} Payments`,
          ''
        ]);
      }

      const paymentData = [paymentHeaders, ...paymentRows];
      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      
      paymentSheet['!cols'] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 25 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payment Entries');

      // Sheet 4: Detailed Expense Distribution by Project
      const expenseDetailHeaders = [
        'Project Number',
        'Project Name',
        'Payments in FY',
        'Profit Margin (40%)',
        'Drawing (30%)',
        'Documents (2%)',
        'Site Visit (10%)',
        'Marketing & Misc (2%)',
        'Office Management (3%)',
        'Total Allocated (85%)',
        'Remaining (15%)'
      ];

      const expenseDetailRows = fyProjects.map(project => {
        const paidAmount = project.totalPaid || 0;
        const profitMargin = paidAmount * 0.40;
        const drawing = paidAmount * 0.30;
        const documents = paidAmount * 0.02;
        const siteVisit = paidAmount * 0.10;
        const marketing = paidAmount * 0.02;
        const officeManagement = paidAmount * 0.03;
        const totalAllocated = paidAmount * 0.85;
        const remaining = paidAmount * 0.15;

        return [
          project.projectNumber || '',
          project.projectName || '',
          paidAmount,
          profitMargin,
          drawing,
          documents,
          siteVisit,
          marketing,
          officeManagement,
          totalAllocated,
          remaining
        ];
      });

      // Add totals
      const totalPaidInFY = fyProjects.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
      expenseDetailRows.push([
        '',
        'TOTAL',
        totalPaidInFY,
        totalPaidInFY * 0.40,
        totalPaidInFY * 0.30,
        totalPaidInFY * 0.02,
        totalPaidInFY * 0.10,
        totalPaidInFY * 0.02,
        totalPaidInFY * 0.03,
        totalPaidInFY * 0.85,
        totalPaidInFY * 0.15
      ]);

      const expenseDetailData = [expenseDetailHeaders, ...expenseDetailRows];
      const expenseDetailSheet = XLSX.utils.aoa_to_sheet(expenseDetailData);
      
      expenseDetailSheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, expenseDetailSheet, 'Expense Allocation');

      // Sheet 5: Project-wise Payment Breakdown
      const projectPaymentHeaders = [
        'Project Number',
        'Project Name',
        'Payment #',
        'Payment Date',
        'Amount',
        'Mode',
        'Transaction/Cheque No.',
        'Running Total'
      ];

      const projectPaymentRows = [];
      fyProjects.forEach(project => {
        let runningTotal = 0;
        if (project.paymentsInFY && project.paymentsInFY.length > 0) {
          project.paymentsInFY
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach((payment, idx) => {
              runningTotal += payment.amount || 0;
              projectPaymentRows.push([
                idx === 0 ? (project.projectNumber || '') : '',
                idx === 0 ? (project.projectName || '') : '',
                idx + 1,
                payment.date ? new Date(payment.date).toLocaleDateString('en-IN') : '',
                payment.amount || 0,
                payment.mode || '',
                payment.transactionId || '',
                runningTotal
              ]);
            });
          
          // Add project subtotal
          projectPaymentRows.push([
            '',
            'Subtotal',
            '',
            '',
            runningTotal,
            '',
            '',
            ''
          ]);
        }
      });

      const projectPaymentData = [projectPaymentHeaders, ...projectPaymentRows];
      const projectPaymentSheet = XLSX.utils.aoa_to_sheet(projectPaymentData);
      
      projectPaymentSheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, projectPaymentSheet, 'Payment Breakdown');

      // Sheet 6: Month-wise Payment Analysis
      const monthHeaders = [
        'Month',
        'Number of Payments',
        'Total Amount',
        'Avg Payment',
        'Projects Involved'
      ];

      const monthlyData = {};
      if (selectedFYData) {
        selectedFYData.payments.forEach(payment => {
          const date = new Date(payment.date);
          const monthKey = `${date.toLocaleString('en-IN', { month: 'short' })} ${date.getFullYear()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              count: 0,
              total: 0,
              projects: new Set()
            };
          }
          
          monthlyData[monthKey].count++;
          monthlyData[monthKey].total += payment.amount || 0;
          monthlyData[monthKey].projects.add(payment.projectNumber);
        });
      }

      const monthRows = Object.entries(monthlyData)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([month, data]) => [
          month,
          data.count,
          data.total,
          data.count > 0 ? (data.total / data.count).toFixed(2) : 0,
          data.projects.size
        ]);

      const monthData = [monthHeaders, ...monthRows];
      const monthSheet = XLSX.utils.aoa_to_sheet(monthData);
      
      monthSheet['!cols'] = [
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, monthSheet, 'Monthly Analysis');

      // Sheet 7: Associate Distribution (if applicable)
      const associateHeaders = [
        'Associate Name',
        'Company',
        'Total Funds Allocated',
        'Total Funds Received',
        'Remaining Balance',
        'Number of Projects'
      ];

      const associateDistribution = {};
      
      allProjects.forEach(project => {
        if (project.projectAssociates && project.projectAssociates.length > 0) {
          // Check if this project has payments in selected FY
          const hasPaymentInFY = project.payments?.some(p => 
            getFinancialYearFromDate(p.date) === selectedFinancialYear
          );
          
          if (hasPaymentInFY) {
            project.projectAssociates.forEach(assoc => {
              const key = assoc.associateId || assoc.name;
              if (!associateDistribution[key]) {
                associateDistribution[key] = {
                  name: assoc.name || '',
                  company: assoc.company || '',
                  totalAllocated: 0,
                  totalReceived: 0,
                  projects: new Set()
                };
              }
              associateDistribution[key].totalAllocated += assoc.percentage || 0;
              associateDistribution[key].totalReceived += assoc.totalDistributed || 0;
              associateDistribution[key].projects.add(project.projectNumber);
            });
          }
        }
      });

      const associateRows = Object.values(associateDistribution).map(assoc => [
        assoc.name,
        assoc.company,
        assoc.totalAllocated,
        assoc.totalReceived,
        assoc.totalAllocated - assoc.totalReceived,
        assoc.projects.size
      ]);

      if (associateRows.length > 0) {
        const associateData = [associateHeaders, ...associateRows];
        const associateSheet = XLSX.utils.aoa_to_sheet(associateData);
        
        associateSheet['!cols'] = [
          { wch: 25 },
          { wch: 25 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(wb, associateSheet, 'Associate Distribution');
      }

      // Generate and download
      const [startYear, endYear] = selectedFinancialYear.split('-');
      const fileName = `Financial_Report_FY${startYear}-${endYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setShowExportModal(false);
      alert('Excel file downloaded successfully!');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = selectedView === 'projects' 
    ? Math.ceil(filteredProjects.length / itemsPerPage)
    : selectedView === 'clients'
    ? Math.ceil(filteredClients.length / itemsPerPage)
    : 0;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search term changes or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedView]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ⏮️ First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ◀️ Prev
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="pagination-btn">1</button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button onClick={() => handlePageChange(totalPages)} className="pagination-btn">{totalPages}</button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next ▶️
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Last ⏭️
        </button>
        
        <span className="pagination-info">
          Page {currentPage} of {totalPages} ({selectedView === 'projects' ? filteredProjects.length : filteredClients.length} total)
        </span>
      </div>
    );
  };

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
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Expense Distribution
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowExportModal(true)} 
            className="export-excel-btn"
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Export Financial Year Report
          </button>
          <button onClick={fetchExpenseData} className="refresh-btn" disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Export Financial Year Report
              </h2>
              <button className="close-btn" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Select a financial year (April to March) to export a comprehensive Excel report including:
              </p>
              <ul style={{ marginBottom: '20px', color: '#666', paddingLeft: '20px' }}>
                <li>Project details and payment status</li>
                <li>Incoming payments and remaining amounts</li>
                <li>Expense distribution across categories</li>
                <li>Funds allocated to associates</li>
                <li>Detailed payment transactions</li>
              </ul>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1f2937' }}>
                  Financial Year:
                </label>
                <select
                  value={selectedFinancialYear}
                  onChange={(e) => setSelectedFinancialYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  <option value="">Select Financial Year</option>
                  {getFinancialYears().map(fy => (
                    <option key={fy.value} value={fy.value}>{fy.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowExportModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={!selectedFinancialYear || loading}
                  style={{
                    padding: '10px 20px',
                    background: selectedFinancialYear && !loading ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedFinancialYear && !loading ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Generating...' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="expense-summary-cards-grid">
        <div className="expense-summary-card total-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="card-amount">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Drawing</h3>
            <p className="card-amount">{formatCurrency(summary.drawing)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.drawing / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Documents</h3>
            <p className="card-amount">{formatCurrency(summary.documents)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.documents / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Site Visit</h3>
            <p className="card-amount">{formatCurrency(summary.siteVisit)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.siteVisit / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Marketing & Misc</h3>
            <p className="card-amount">{formatCurrency(summary.marketingAndMisc)}</p>
            <p className="card-percentage">
              {totalExpenses > 0 ? ((summary.marketingAndMisc / totalExpenses) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="expense-summary-card">
          <div className="card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="8" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="16" y2="14"/>
              <line x1="8" y1="18" x2="12" y2="18"/>
            </svg>
          </div>
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
            <div className="card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Summary
        </button>
        <button
          className={`view-btn ${selectedView === 'projects' ? 'active' : ''}`}
          onClick={() => setSelectedView('projects')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          By Projects ({projects.length})
        </button>
        <button
          className={`view-btn ${selectedView === 'clients' ? 'active' : ''}`}
          onClick={() => setSelectedView('clients')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          By Clients ({clients.length})
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
            {renderPagination()}
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
                  {currentProjects.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="no-data">No projects found</td>
                    </tr>
                  ) : (
                    currentProjects.map((project) => {
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
            {renderPagination()}
          </div>
        )}

        {selectedView === 'clients' && (
          <div className="clients-view">
            {renderPagination()}
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
                  {currentClients.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="no-data">No clients found</td>
                    </tr>
                  ) : (
                    currentClients.map((client) => {
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
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDistribution;
