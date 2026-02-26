import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './YearlyDistributionTable.css';
// xlsx, jsPDF and jspdf-autotable are loaded on-demand inside exportToExcel / exportToPDF
// to avoid adding ~250 KiB to the initial JS bundle.

const YearlyDistributionTable = ({ 
  projectData, 
  showTitle = true, 
  compact = false,
  associateConfig = null,
  customFields = [],
  fieldVisibility = {},
  isEditable = false,
  onSave = null,
  onAddPayment = null,
  onEditPayment = null,
  onDeletePayment = null,
  autoOpenAddPayment = false
}) => {
  const location = useLocation();
  const shouldAutoOpen = autoOpenAddPayment || new URLSearchParams(location.search).get('addPayment') === 'true';
  const autoOpenFiredRef = useRef(false);
  
  // State for edit mode
  const [editedData, setEditedData] = useState({
    profitMarginPercent: projectData.profitMarginPercent || 0,
    drawingPercent: projectData.drawingPercent || 0,
    documentsPercent: projectData.documentsPercent || 0,
    siteVisitPercent: projectData.siteVisitPercent || 0,
    marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
    officeManagementPercent: projectData.officeManagementPercent || 0,
  });

  // State for storing manually edited amounts (overrides calculated values)
  const [editedAmounts, setEditedAmounts] = useState({});

  // State for Add Payment Modal
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    chequeNeftNumber: '',
    mode: 'Cash',
    useDefaultPercentages: true
  });
  const [customPercentages, setCustomPercentages] = useState({
    profitMarginPercent: projectData.profitMarginPercent || 0,
    drawingPercent: projectData.drawingPercent || 0,
    documentsPercent: projectData.documentsPercent || 0,
    siteVisitPercent: projectData.siteVisitPercent || 0,
    marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
    officeManagementPercent: projectData.officeManagementPercent || 0,
  });

  // State for Edit Payment Modal
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentIndex, setEditingPaymentIndex] = useState(null);

  // State for Inline Editing
  const [inlineEditingIndex, setInlineEditingIndex] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({
    amount: '',
    date: '',
    chequeNeftNumber: '',
    mode: 'Cash',
    profitAmount: 0,
    drawingAmount: 0,
    documentsAmount: 0,
    siteVisitAmount: 0,
    marketingAmount: 0,
    officeAmount: 0,
    customFieldAmounts: {}
  });

  // Update editedData when projectData changes
  useEffect(() => {
    setEditedData({
      profitMarginPercent: projectData.profitMarginPercent || 0,
      drawingPercent: projectData.drawingPercent || 0,
      documentsPercent: projectData.documentsPercent || 0,
      siteVisitPercent: projectData.siteVisitPercent || 0,
      marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
      officeManagementPercent: projectData.officeManagementPercent || 0,
    });
    setEditedAmounts({});
  }, [projectData]);

  // Auto-open Add Payment modal when navigated with ?addPayment=true
  useEffect(() => {
    if (shouldAutoOpen && onAddPayment && projectData && projectData._id && !autoOpenFiredRef.current) {
      autoOpenFiredRef.current = true;
      handleOpenAddPaymentModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoOpen, onAddPayment, projectData?._id]);
  
  // CRITICAL: Use project's config snapshot if available
  // For projects without snapshot (legacy projects before versioning):
  // - Show ALL default fields (all visible by default for backward compatibility)
  // - Don't show any custom fields (they didn't exist when project was created)
  const hasSnapshot = projectData.configSnapshot && Object.keys(projectData.configSnapshot).length > 0;

  const _snapshotFV = hasSnapshot ? (projectData.configSnapshot.fieldVisibility || {}) : {};
  const effectiveFieldVisibility = hasSnapshot ? {
    profitMargin:     _snapshotFV.profitMargin     !== false,
    drawing:          _snapshotFV.drawing          !== false,
    documents:        _snapshotFV.documents        !== false,
    siteVisit:        _snapshotFV.siteVisit        !== false,
    marketingAndMisc: _snapshotFV.marketingAndMisc !== false,
    officeManagement: _snapshotFV.officeManagement !== false,
  } : {
    profitMargin: true,
    drawing: true,
    documents: true,
    siteVisit: true,
    marketingAndMisc: true,
    officeManagement: true,
  };
  const effectiveConfig = hasSnapshot ? projectData.configSnapshot : {};
  const effectiveCustomFields = effectiveConfig.customFields || [];

  // Filter visible custom fields based on visibility flag
  const visibleCustomFields = effectiveCustomFields.filter(field => field.visible);
  
  // Helper function to get custom field value - supports both old and new data formats
  const getCustomFieldValue = (fieldName, type = 'percentage') => {
    // First try to get from top-level project data (old format)
    const topLevelValue = projectData[fieldName];
    if (topLevelValue !== undefined && topLevelValue !== null) {
      return topLevelValue;
    }
    
    // Then try to get from customFields array (new format)
    if (projectData.customFields && Array.isArray(projectData.customFields)) {
      const customField = projectData.customFields.find(field => field.fieldName === fieldName);
      if (customField) {
        return type === 'percentage' ? customField.percentage : customField.amount;
      }
    }
    
    // Try customFieldsMetadata as fallback
    if (projectData.customFieldsMetadata && Array.isArray(projectData.customFieldsMetadata)) {
      const customField = projectData.customFieldsMetadata.find(field => field.fieldName === fieldName);
      if (customField) {
        return type === 'percentage' ? customField.percentage : customField.amount;
      }
    }
    
    return 0;
  };
  
  const formatCurrency = (amount) => {
    return 'Rs ' + new Intl.NumberFormat('en-IN').format(amount || 0);
  };

  // Handler to open Add Payment Modal
  const handleOpenAddPaymentModal = () => {
    setPaymentFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      chequeNeftNumber: '',
      mode: 'Cash',
      useDefaultPercentages: true
    });
    setCustomPercentages({
      profitMarginPercent: projectData.profitMarginPercent || 0,
      drawingPercent: projectData.drawingPercent || 0,
      documentsPercent: projectData.documentsPercent || 0,
      siteVisitPercent: projectData.siteVisitPercent || 0,
      marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
      officeManagementPercent: projectData.officeManagementPercent || 0,
    });
    setShowAddPaymentModal(true);
  };

  // Handler to close Add Payment Modal
  const handleCloseAddPaymentModal = () => {
    setShowAddPaymentModal(false);
  };

  // Handler for form input changes
  const handlePaymentFormChange = (field, value) => {
    setPaymentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for custom percentage changes
  const handleCustomPercentageChange = (field, value) => {
    setCustomPercentages(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Handler to submit new payment
  const handleSubmitPayment = () => {
    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!paymentFormData.date) {
      alert('Please select a payment date');
      return;
    }

    // Construct the new payment object
    const newPayment = {
      amount: parseFloat(paymentFormData.amount),
      date: paymentFormData.date,
      chequeNeftNumber: paymentFormData.chequeNeftNumber,
      mode: paymentFormData.mode
    };

    // Pass the payment and percentages to parent component
    if (onAddPayment) {
      const percentagesToUse = paymentFormData.useDefaultPercentages 
        ? {
            profitMarginPercent: projectData.profitMarginPercent || 0,
            drawingPercent: projectData.drawingPercent || 0,
            documentsPercent: projectData.documentsPercent || 0,
            siteVisitPercent: projectData.siteVisitPercent || 0,
            marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
            officeManagementPercent: projectData.officeManagementPercent || 0,
          }
        : customPercentages;

      onAddPayment(newPayment, percentagesToUse);
      handleCloseAddPaymentModal();
    }
  };

  // Handler to open Edit Payment Modal
  const handleOpenEditPaymentModal = (index) => {
    const payment = projectData.payments[index];
    setEditingPaymentIndex(index);
    setPaymentFormData({
      amount: payment.amount.toString(),
      date: new Date(payment.date).toISOString().split('T')[0],
      chequeNeftNumber: payment.chequeNeftNumber || '',
      mode: payment.mode || 'Cash',
      useDefaultPercentages: true
    });
    setCustomPercentages({
      profitMarginPercent: projectData.profitMarginPercent || 0,
      drawingPercent: projectData.drawingPercent || 0,
      documentsPercent: projectData.documentsPercent || 0,
      siteVisitPercent: projectData.siteVisitPercent || 0,
      marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
      officeManagementPercent: projectData.officeManagementPercent || 0,
    });
    setShowEditPaymentModal(true);
  };

  // Handler to start inline editing
  const handleStartInlineEdit = (index) => {
    const payment = projectData.payments[index];
    const amount = parseInt(payment.amount) || 0;
    
    // Calculate distribution amounts based on current percentages
    const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
      ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
      : 0;
    const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
    const amountAfterAssociate = amount - associateShare;
    
    const profitAmount = Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100);
    const drawingAmount = Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100);
    const documentsAmount = Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100);
    const siteVisitAmount = Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100);
    const marketingAmount = Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100);
    const officeAmount = Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100);
    
    // Calculate custom field amounts
    const customFieldAmounts = {};
    if (visibleCustomFields && visibleCustomFields.length > 0) {
      visibleCustomFields.forEach(customField => {
        const percentage = getCustomFieldValue(customField.fieldName, 'percentage');
        customFieldAmounts[customField.fieldName] = Math.floor((amountAfterAssociate * percentage) / 100);
      });
    }
    
    setInlineEditingIndex(index);
    setInlineEditData({
      amount: payment.amount.toString(),
      date: new Date(payment.date).toISOString().split('T')[0],
      chequeNeftNumber: payment.chequeNeftNumber || '',
      mode: payment.mode || 'Cash',
      profitAmount,
      drawingAmount,
      documentsAmount,
      siteVisitAmount,
      marketingAmount,
      officeAmount,
      customFieldAmounts
    });
  };

  // Handler to save inline edit
  const handleSaveInlineEdit = () => {
    if (inlineEditingIndex !== null && onEditPayment) {
      // Calculate back-computed percentages from the edited amounts
      const amount = parseFloat(inlineEditData.amount) || 0;
      const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
        ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
        : 0;
      const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
      const amountAfterAssociate = amount - associateShare;
      
      // Calculate percentages from edited amounts
      const percentages = {
        profitMarginPercent: amountAfterAssociate > 0 ? (inlineEditData.profitAmount / amountAfterAssociate) * 100 : 0,
        drawingPercent: amountAfterAssociate > 0 ? (inlineEditData.drawingAmount / amountAfterAssociate) * 100 : 0,
        documentsPercent: amountAfterAssociate > 0 ? (inlineEditData.documentsAmount / amountAfterAssociate) * 100 : 0,
        siteVisitPercent: amountAfterAssociate > 0 ? (inlineEditData.siteVisitAmount / amountAfterAssociate) * 100 : 0,
        marketingAndMiscPercent: amountAfterAssociate > 0 ? (inlineEditData.marketingAmount / amountAfterAssociate) * 100 : 0,
        officeManagementPercent: amountAfterAssociate > 0 ? (inlineEditData.officeAmount / amountAfterAssociate) * 100 : 0
      };
      
      const updatedPayment = {
        amount: amount,
        date: inlineEditData.date,
        chequeNeftNumber: inlineEditData.chequeNeftNumber,
        mode: inlineEditData.mode,
        percentages: percentages
      };
      onEditPayment(inlineEditingIndex, updatedPayment);
      setInlineEditingIndex(null);
    }
  };

  // Handler to cancel inline edit
  const handleCancelInlineEdit = () => {
    setInlineEditingIndex(null);
    setInlineEditData({
      amount: '',
      date: '',
      chequeNeftNumber: '',
      mode: 'Cash'
    });
  };

  // Handler to close Edit Payment Modal
  const handleCloseEditPaymentModal = () => {
    setShowEditPaymentModal(false);
    setEditingPaymentIndex(null);
  };

  // Handler to submit edited payment
  const handleSubmitEditPayment = () => {
    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!paymentFormData.date) {
      alert('Please select a payment date');
      return;
    }

    // Construct the updated payment object
    const updatedPayment = {
      amount: parseFloat(paymentFormData.amount),
      date: paymentFormData.date,
      chequeNeftNumber: paymentFormData.chequeNeftNumber,
      mode: paymentFormData.mode
    };

    // Pass the payment, index, and percentages to parent component
    if (onEditPayment) {
      const percentagesToUse = paymentFormData.useDefaultPercentages 
        ? {
            profitMarginPercent: projectData.profitMarginPercent || 0,
            drawingPercent: projectData.drawingPercent || 0,
            documentsPercent: projectData.documentsPercent || 0,
            siteVisitPercent: projectData.siteVisitPercent || 0,
            marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
            officeManagementPercent: projectData.officeManagementPercent || 0,
          }
        : customPercentages;

      onEditPayment(editingPaymentIndex, updatedPayment, percentagesToUse);
      handleCloseEditPaymentModal();
    }
  };

  // Handler to delete payment
  const handleDeletePayment = (index) => {
    const payment = projectData.payments[index];
    if (window.confirm(`Are you sure you want to delete Payment ${index + 1} (${formatCurrency(payment.amount)})?`)) {
      if (onDeletePayment) {
        onDeletePayment(index);
      }
    }
  };


  const exportToExcel = async () => {
    const XLSX = (await import('xlsx')).default || await import('xlsx');
    const yearlyDistribution = projectData.yearlyDistribution || 
      calculateYearlyDistribution(projectData.payments);

    // Prepare data for Excel export
    const excelData = [];
    
    // Header row with project info
    excelData.push(['Payment Distribution - ' + projectData.projectName]);
    excelData.push(['Finalized Fees:', projectData.finalizedFees || 0]);
    excelData.push(['Total Received:', projectData.totalReceivedFees || 0]);
    excelData.push(['Pending:', (projectData.finalizedFees || 0) - (projectData.totalReceivedFees || 0)]);
    excelData.push([]); // Empty row
    
    // Table headers - dynamically built based on visibility
    const headers = [
      'Descriptions',
      'Amount',
      'Date', 
      'Cheque number/NEFT number',
      'Mode'
    ];
    
    // Add visible default field headers
    if (effectiveFieldVisibility.profitMargin) headers.push('Profit Margin');
    if (effectiveFieldVisibility.drawing) headers.push('Drawing');
    if (effectiveFieldVisibility.documents) headers.push('Documents');
    if (effectiveFieldVisibility.siteVisit) headers.push('Site Visit');
    if (effectiveFieldVisibility.marketingAndMisc) headers.push('Marketing and Misc.');
    if (effectiveFieldVisibility.officeManagement) headers.push('Office Management');
    
    // Add visible custom field headers
    if (visibleCustomFields && visibleCustomFields.length > 0) {
      visibleCustomFields.forEach(field => {
        headers.push(field.name);
      });
    }
    
    excelData.push(headers);
    
    // Percentage row - dynamically built based on visibility
    const percentageRow = [
      'Percentage will vary project',
      '-',
      '-',
      '-',
      '-'
    ];
    
    if (effectiveFieldVisibility.profitMargin) percentageRow.push(`${projectData.profitMarginPercent || 0}%`);
    if (effectiveFieldVisibility.drawing) percentageRow.push(`${projectData.drawingPercent || 0}%`);
    if (effectiveFieldVisibility.documents) percentageRow.push(`${projectData.documentsPercent || 0}%`);
    if (effectiveFieldVisibility.siteVisit) percentageRow.push(`${projectData.siteVisitPercent || 0}%`);
    if (effectiveFieldVisibility.marketingAndMisc) percentageRow.push(`${projectData.marketingAndMiscPercent || 0}%`);
    if (effectiveFieldVisibility.officeManagement) percentageRow.push(`${projectData.officeManagementPercent || 0}%`);
    
    // Add visible custom field percentages
    if (visibleCustomFields && visibleCustomFields.length > 0) {
      visibleCustomFields.forEach(field => {
        percentageRow.push(`${getCustomFieldValue(field.fieldName, 'percentage')}%`);
      });
    }
    
    excelData.push(percentageRow);
    
    // Payment data with exact calculations (no rounding issues)
    if (projectData.payments && projectData.payments.length > 0) {
      projectData.payments.forEach((payment, index) => {
        const amount = parseInt(payment.amount) || 0; // Use parseInt to avoid decimal issues
        // Calculate total associate percentage from all associates
        const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
          ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
          : 0;
        // Deduct associate share before calculating expenses
        const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
        const amountAfterAssociate = amount - associateShare;
        const profitMarginAmount = Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100);
        const drawingAmount = Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100);
        const documentsAmount = Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100);
        const siteVisitAmount = Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100);
        const marketingAmount = Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100);
        const officeAmount = Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100);
        
        const paymentRow = [
          `Payment ${index + 1}`,
          amount,
          payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : '-',
          payment.chequeNumber || payment.referenceNumber || '-',
          payment.mode || 'NEFT'
        ];
        
        // Add visible default field amounts
        if (effectiveFieldVisibility.profitMargin) paymentRow.push(profitMarginAmount);
        if (effectiveFieldVisibility.drawing) paymentRow.push(drawingAmount);
        if (effectiveFieldVisibility.documents) paymentRow.push(documentsAmount > 0 ? documentsAmount : '-');
        if (effectiveFieldVisibility.siteVisit) paymentRow.push(siteVisitAmount);
        if (effectiveFieldVisibility.marketingAndMisc) paymentRow.push(marketingAmount);
        if (effectiveFieldVisibility.officeManagement) paymentRow.push(officeAmount);
        
        // Add visible custom field amounts
        if (visibleCustomFields && visibleCustomFields.length > 0) {
          visibleCustomFields.forEach(field => {
            const customAmount = Math.floor((amountAfterAssociate * (getCustomFieldValue(field.fieldName, 'percentage'))) / 100);
            paymentRow.push(customAmount > 0 ? customAmount : '-');
          });
        }
        
        excelData.push(paymentRow);
      });
    }
    
    // Yearly totals with exact calculations
    Object.keys(yearlyDistribution).forEach(year => {
      const amount = parseInt(yearlyDistribution[year]) || 0;
      // Calculate total associate percentage from all associates
      const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
        ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
        : 0;
      // Deduct associate share before calculating expenses
      const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
      const amountAfterAssociate = amount - associateShare;
      const yearlyRow = [
        `${year} Total`,
        amount,
        '-',
        '-',
        '-'
      ];
      
      // Add visible default field yearly totals
      if (effectiveFieldVisibility.profitMargin) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100));
      if (effectiveFieldVisibility.drawing) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100));
      if (effectiveFieldVisibility.documents) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100));
      if (effectiveFieldVisibility.siteVisit) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100));
      if (effectiveFieldVisibility.marketingAndMisc) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100));
      if (effectiveFieldVisibility.officeManagement) yearlyRow.push(Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100));
      
      // Add visible custom field yearly totals
      if (visibleCustomFields && visibleCustomFields.length > 0) {
        visibleCustomFields.forEach(field => {
          const customYearlyAmount = Math.floor((amountAfterAssociate * (getCustomFieldValue(field.fieldName, 'percentage'))) / 100);
          yearlyRow.push(customYearlyAmount > 0 ? customYearlyAmount : '-');
        });
      }
      
      excelData.push(yearlyRow);
    });
    
    // Grand total row
    const grandTotalRow = [
      'Grand Total',
      projectData.totalReceivedFees || 0,
      '-',
      '-',
      '-'
    ];
    
    // Calculate grand total with associate deduction
    const totalReceived = projectData.totalReceivedFees || 0;
    const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
      ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
      : 0;
    const associateShare = Math.floor((totalReceived * totalAssociatePercent) / 100);
    const amountAfterAssociate = totalReceived - associateShare;
    
    // Add visible default field grand totals
    if (effectiveFieldVisibility.profitMargin) grandTotalRow.push(Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100));
    if (effectiveFieldVisibility.drawing) grandTotalRow.push(Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100));
    if (effectiveFieldVisibility.documents) {
      const documentsTotal = Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100);
      grandTotalRow.push(documentsTotal > 0 ? documentsTotal : '-');
    }
    if (effectiveFieldVisibility.siteVisit) grandTotalRow.push(Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100));
    if (effectiveFieldVisibility.marketingAndMisc) grandTotalRow.push(Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100));
    if (effectiveFieldVisibility.officeManagement) grandTotalRow.push(Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100));
    
    // Add visible custom field grand totals
    if (visibleCustomFields && visibleCustomFields.length > 0) {
      visibleCustomFields.forEach(field => {
        const percentage = getCustomFieldValue(field.fieldName, 'percentage');
        const customGrandTotal = Math.floor((amountAfterAssociate * percentage) / 100);
        grandTotalRow.push(customGrandTotal > 0 ? customGrandTotal : '-');
      });
    }
    
    excelData.push(grandTotalRow);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Descriptions
      { wch: 15 }, // Amount
      { wch: 12 }, // Date
      { wch: 18 }, // Cheque/NEFT
      { wch: 8 },  // Mode
      { wch: 15 }, // Profit Margin
      { wch: 12 }, // Drawing
      { wch: 12 }, // Documents
      { wch: 12 }, // Site Visit
      { wch: 18 }, // Marketing
      { wch: 18 }  // Office Management
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Distribution');
    
    // Save file
    const filename = `Payment_Distribution_${projectData.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Payment Distribution - ${projectData.projectName}`, 40, 50);
    
    // Project summary - properly spaced
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // First row of summary
    doc.text(`Finalized Fees: Rs ${(projectData.finalizedFees || 0).toLocaleString('en-IN')}`, 40, 80);
    doc.text(`Total Received: Rs ${(projectData.totalReceivedFees || 0).toLocaleString('en-IN')}`, 280, 80);
    doc.text(`Pending: Rs ${((projectData.finalizedFees || 0) - (projectData.totalReceivedFees || 0)).toLocaleString('en-IN')}`, 520, 80);
    
    // Add a separator line
    doc.setLineWidth(1);
    doc.line(40, 95, pageWidth - 40, 95);
    
    // Prepare table data
    const yearlyDistribution = projectData.yearlyDistribution || 
      calculateYearlyDistribution(projectData.payments);
      
    const tableData = [];
    
    // Percentage row
    tableData.push([
      'Percentage will vary project',
      '-',
      '-',
      '-',
      '-',
      `${projectData.profitMarginPercent || 0}%`,
      `${projectData.drawingPercent || 0}%`,
      `${projectData.documentsPercent || 0}%`,
      `${projectData.siteVisitPercent || 0}%`,
      `${projectData.marketingAndMiscPercent || 0}%`,
      `${projectData.officeManagementPercent || 0}%`
    ]);
    
    // Payment data with exact calculations
    if (projectData.payments && projectData.payments.length > 0) {
      projectData.payments.forEach((payment, index) => {
        const amount = parseInt(payment.amount) || 0; // Use parseInt to avoid decimal issues
        // Calculate total associate percentage from all associates
        const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
          ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
          : 0;
        // Deduct associate share before calculating expenses
        const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
        const amountAfterAssociate = amount - associateShare;
        const profitMarginAmount = Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100);
        const drawingAmount = Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100);
        const documentsAmount = Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100);
        const siteVisitAmount = Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100);
        const marketingAmount = Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100);
        const officeAmount = Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100);
        
        tableData.push([
          `Payment ${index + 1}`,
          amount.toLocaleString('en-IN'),
          payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : '-',
          payment.chequeNumber || payment.referenceNumber || '-',
          payment.mode || 'NEFT',
          profitMarginAmount.toLocaleString('en-IN'),
          drawingAmount.toLocaleString('en-IN'),
          documentsAmount > 0 ? documentsAmount.toLocaleString('en-IN') : '-',
          siteVisitAmount.toLocaleString('en-IN'),
          marketingAmount.toLocaleString('en-IN'),
          officeAmount.toLocaleString('en-IN')
        ]);
      });
    }
    
    // Yearly totals with exact calculations
    Object.keys(yearlyDistribution).forEach(year => {
      const amount = parseInt(yearlyDistribution[year]) || 0;
      // Calculate total associate percentage from all associates
      const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
        ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
        : 0;
      // Deduct associate share before calculating expenses
      const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
      const amountAfterAssociate = amount - associateShare;
      tableData.push([
        `${year} Total`,
        amount.toLocaleString('en-IN'),
        '-',
        '-',
        '-',
        Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100).toLocaleString('en-IN')
      ]);
    });
    
    // Grand total with associate deduction
    const totalReceived = projectData.totalReceivedFees || 0;
    const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
      ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
      : 0;
    const associateShare = Math.floor((totalReceived * totalAssociatePercent) / 100);
    const amountAfterAssociate = totalReceived - associateShare;
    
    const grandTotalRow = [
      'Grand Total',
      totalReceived.toLocaleString('en-IN'),
      '-',
      '-',
      '-',
      Math.floor((amountAfterAssociate * (projectData.profitMarginPercent || 0)) / 100).toLocaleString('en-IN'),
      Math.floor((amountAfterAssociate * (projectData.drawingPercent || 0)) / 100).toLocaleString('en-IN'),
      (() => {
        const documentsTotal = Math.floor((amountAfterAssociate * (projectData.documentsPercent || 0)) / 100);
        return documentsTotal > 0 ? documentsTotal.toLocaleString('en-IN') : '-';
      })(),
      Math.floor((amountAfterAssociate * (projectData.siteVisitPercent || 0)) / 100).toLocaleString('en-IN'),
      Math.floor((amountAfterAssociate * (projectData.marketingAndMiscPercent || 0)) / 100).toLocaleString('en-IN'),
      Math.floor((amountAfterAssociate * (projectData.officeManagementPercent || 0)) / 100).toLocaleString('en-IN')
    ];
    
    // Add custom field grand totals to PDF
    if (customFields && customFields.length > 0) {
      customFields.forEach(field => {
        const percentage = getCustomFieldValue(field.fieldName, 'percentage');
        const customGrandTotal = Math.floor((amountAfterAssociate * percentage) / 100);
        grandTotalRow.push(customGrandTotal > 0 ? customGrandTotal.toLocaleString('en-IN') : '-');
      });
    }
    
    tableData.push(grandTotalRow);
    
    // Create table using autoTable function
    autoTable(doc, {
      head: [[
        'Descriptions',
        'Amount',
        'Date',
        'Cheque/NEFT Number',
        'Mode',
        'Profit Margin',
        'Drawing',
        'Documents',
        'Site Visit',
        'Marketing & Misc.',
        'Office Management'
      ]],
      body: tableData,
      startY: 110,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        halign: 'center'
      },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 85 },
        1: { halign: 'right', cellWidth: 65 },
        2: { halign: 'center', cellWidth: 55 },
        3: { halign: 'center', cellWidth: 75 },
        4: { halign: 'center', cellWidth: 45 },
        5: { halign: 'right', cellWidth: 65 },
        6: { halign: 'right', cellWidth: 55 },
        7: { halign: 'right', cellWidth: 55 },
        8: { halign: 'right', cellWidth: 55 },
        9: { halign: 'right', cellWidth: 75 },
        10: { halign: 'right', cellWidth: 75 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { top: 110, left: 40, right: 40 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, doc.internal.pageSize.getHeight() - 30);
    doc.text(`Page 1 of ${pageCount}`, pageWidth - 120, doc.internal.pageSize.getHeight() - 30);
    
    // Save file
    const filename = `Payment_Distribution_${projectData.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  // Expose functions globally for modal use
  useEffect(() => {
    window.exportDistributionExcel = exportToExcel;
    window.exportDistributionPDF = exportToPDF;
    
    return () => {
      delete window.exportDistributionExcel;
      delete window.exportDistributionPDF;
    };
  }, [projectData]);

  const calculateYearlyDistribution = (payments) => {
    const distribution = {};
    
    if (!payments || payments.length === 0) return distribution;
    
    payments.forEach(payment => {
      if (payment.date && payment.amount) {
        const paymentDate = new Date(payment.date);
        const year = paymentDate.getFullYear();
        
        // Create financial year (April to March)
        let financialYear;
        if (paymentDate.getMonth() >= 3) { // April = month 3 (0-indexed)
          financialYear = `${year}-${(year + 1).toString().slice(-2)}`;
        } else {
          financialYear = `${year - 1}-${year.toString().slice(-2)}`;
        }
        
        if (!distribution[financialYear]) {
          distribution[financialYear] = 0;
        }
        distribution[financialYear] += parseInt(payment.amount) || 0; // Use parseInt to avoid decimal issues
      }
    });
    
    return distribution;
  };

  const yearlyDistribution = projectData.yearlyDistribution || 
    calculateYearlyDistribution(projectData.payments);

  const hasNoPayments = !yearlyDistribution || Object.keys(yearlyDistribution).length === 0;

  const tableClass = compact ? 'distribution-table compact' : 'distribution-table';

  // Use edited percentages when in edit mode, otherwise use project data
  const activePercentages = isEditable ? editedData : {
    profitMarginPercent: projectData.profitMarginPercent || 0,
    drawingPercent: projectData.drawingPercent || 0,
    documentsPercent: projectData.documentsPercent || 0,
    siteVisitPercent: projectData.siteVisitPercent || 0,
    marketingAndMiscPercent: projectData.marketingAndMiscPercent || 0,
    officeManagementPercent: projectData.officeManagementPercent || 0,
  };

  // Expose save function to parent
  if (isEditable && onSave) {
    window.saveDistributionChanges = () => onSave({
      ...editedData,
      editedAmounts: editedAmounts
    });
  }

  return (
    <div className="yearly-distribution-wrapper">
      {/* Associate Share Notice - Always visible when project has associates */}
      {((projectData.projectAssociates && projectData.projectAssociates.length > 0) || projectData.associateId) && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <strong style={{
            fontSize: '15px',
            color: '#856404',
            fontWeight: '700',
            display: 'block',
            letterSpacing: '0.3px'
          }}>
            ⚠️ IMPORTANT: EXPENSE DISTRIBUTION IS CALCULATED AFTER DEDUCTING ASSOCIATE SHARE
          </strong>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#856404',
            fontWeight: '500'
          }}>
            For associate share percentage details, go to "Associate Share Distribution" button
          </p>
        </div>
      )}
      
      {showTitle && (
        <div className="distribution-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>📊 Yearly Payment Distribution - {projectData.projectName}</h3>
            {onAddPayment && (
              <button
                onClick={handleOpenAddPaymentModal}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#2c5282',
                  border: '2px solid #fff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e6f2ff';
                  e.target.style.color = '#1e3a5f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#2c5282';
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add Payment
              </button>
            )}
          </div>
          <div className="project-summary">
            <span>Finalized Fees: {formatCurrency(projectData.finalizedFees)}</span>
            <span>Total Received: {formatCurrency(projectData.totalReceivedFees)}</span>
            <span>Pending: {formatCurrency((projectData.finalizedFees || 0) - (projectData.totalReceivedFees || 0))}</span>
          </div>
        </div>
      )}

      {/* Empty state when no payments yet */}
      {hasNoPayments && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
          <div className="empty-distribution" style={{ margin: 0, flex: 1 }}>
            <p>No payment data available for yearly distribution.</p>
          </div>
          {onAddPayment && (
            <button
              onClick={handleOpenAddPaymentModal}
              style={{
                padding: '8px 16px',
                background: '#2c5282',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginLeft: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              + Add Payment
            </button>
          )}
        </div>
      )}

      {/* Distribution table - only when payments exist */}
      {!hasNoPayments && (
      <div className="yearly-distribution">
        <table className={tableClass}>
          <thead>
            <tr>
              <th>Descriptions</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Cheque number/NEFT number</th>
              <th>Mode</th>
              {effectiveFieldVisibility.profitMargin && <th>Profit margin</th>}
              {effectiveFieldVisibility.drawing && <th>Drawing</th>}
              {effectiveFieldVisibility.documents && <th>Documents</th>}
              {effectiveFieldVisibility.siteVisit && <th>Site visit</th>}
              {effectiveFieldVisibility.marketingAndMisc && <th>Marketing and Misc.</th>}
              {effectiveFieldVisibility.officeManagement && <th>Office management</th>}
              {/* Custom fields columns */}
              {visibleCustomFields && visibleCustomFields.map((customField, index) => (
                <th key={`custom-${index}`} style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
                  {customField.name}
                </th>
              ))}
              {(onEditPayment || onDeletePayment) && <th style={{ width: '50px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="percentage-row">
              <td><strong>Percentage will vary project</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              {effectiveFieldVisibility.profitMargin && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.profitMarginPercent}
                        onChange={(e) => setEditedData({...editedData, profitMarginPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.profitMarginPercent || 0}%</strong>
                  )}
                </td>
              )}
              {effectiveFieldVisibility.drawing && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.drawingPercent}
                        onChange={(e) => setEditedData({...editedData, drawingPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.drawingPercent || 0}%</strong>
                  )}
                </td>
              )}
              {effectiveFieldVisibility.documents && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.documentsPercent}
                        onChange={(e) => setEditedData({...editedData, documentsPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.documentsPercent || 0}%</strong>
                  )}
                </td>
              )}
              {effectiveFieldVisibility.siteVisit && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.siteVisitPercent}
                        onChange={(e) => setEditedData({...editedData, siteVisitPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.siteVisitPercent || 0}%</strong>
                  )}
                </td>
              )}
              {effectiveFieldVisibility.marketingAndMisc && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.marketingAndMiscPercent}
                        onChange={(e) => setEditedData({...editedData, marketingAndMiscPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.marketingAndMiscPercent || 0}%</strong>
                  )}
                </td>
              )}
              {effectiveFieldVisibility.officeManagement && (
                <td>
                  {isEditable ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        value={editedData.officeManagementPercent}
                        onChange={(e) => setEditedData({...editedData, officeManagementPercent: parseFloat(e.target.value) || 0})}
                        style={{ 
                          width: '70px', 
                          padding: '6px', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          border: '2px solid #4a90e2',
                          borderRadius: '4px',
                          backgroundColor: '#f0f8ff'
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span style={{ fontWeight: 'bold' }}>%</span>
                    </div>
                  ) : (
                    <strong>{projectData.officeManagementPercent || 0}%</strong>
                  )}
                </td>
              )}
              {/* Custom fields percentage columns */}
              {visibleCustomFields && visibleCustomFields.map((customField, index) => (
                <td key={`custom-percent-${index}`} style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
                  {getCustomFieldValue(customField.fieldName, 'percentage')}%
                </td>
              ))}
            </tr>
            
            {/* Individual payment rows grouped by year */}
            {projectData.payments && projectData.payments.map((payment, index) => {
              const paymentDate = new Date(payment.date);
              const amount = parseInt(payment.amount) || 0; // Use parseInt to avoid decimal issues
              // Calculate total associate percentage from all associates
              const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
                ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
                : 0;
              // Deduct associate share before calculating expenses
              const associateShare = Math.floor((amount * totalAssociatePercent) / 100);
              const amountAfterAssociate = amount - associateShare;
              const profitAmount = Math.floor((amountAfterAssociate * (activePercentages.profitMarginPercent || 0)) / 100);
              const drawingAmount = Math.floor((amountAfterAssociate * (activePercentages.drawingPercent || 0)) / 100);
              const documentsAmount = Math.floor((amountAfterAssociate * (activePercentages.documentsPercent || 0)) / 100);
              const siteVisitAmount = Math.floor((amountAfterAssociate * (activePercentages.siteVisitPercent || 0)) / 100);
              const marketingAmount = Math.floor((amountAfterAssociate * (activePercentages.marketingAndMiscPercent || 0)) / 100);
              const officeAmount = Math.floor((amountAfterAssociate * (activePercentages.officeManagementPercent || 0)) / 100);
              
              // Get edited amounts or use calculated ones
              const paymentKey = `payment-${index}`;
              // Use inline edit data if this row is being edited inline, otherwise use calculated amounts
              const displayProfitAmount = inlineEditingIndex === index ? inlineEditData.profitAmount : (editedAmounts[`${paymentKey}-profit`] ?? profitAmount);
              const displayDrawingAmount = inlineEditingIndex === index ? inlineEditData.drawingAmount : (editedAmounts[`${paymentKey}-drawing`] ?? drawingAmount);
              const displayDocumentsAmount = inlineEditingIndex === index ? inlineEditData.documentsAmount : (editedAmounts[`${paymentKey}-documents`] ?? documentsAmount);
              const displaySiteVisitAmount = inlineEditingIndex === index ? inlineEditData.siteVisitAmount : (editedAmounts[`${paymentKey}-siteVisit`] ?? siteVisitAmount);
              const displayMarketingAmount = inlineEditingIndex === index ? inlineEditData.marketingAmount : (editedAmounts[`${paymentKey}-marketing`] ?? marketingAmount);
              const displayOfficeAmount = inlineEditingIndex === index ? inlineEditData.officeAmount : (editedAmounts[`${paymentKey}-office`] ?? officeAmount);
              
              return (
                <tr key={`payment-${index}`} className="payment-row">
                  <td>Payment {index + 1}</td>
                  <td>
                    {inlineEditingIndex === index ? (
                      <input
                        type="number"
                        value={inlineEditData.amount}
                        onChange={(e) => setInlineEditData({...inlineEditData, amount: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '2px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      amount?.toLocaleString('en-IN')
                    )}
                  </td>
                  <td>
                    {inlineEditingIndex === index ? (
                      <input
                        type="date"
                        value={inlineEditData.date}
                        onChange={(e) => setInlineEditData({...inlineEditData, date: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '2px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      paymentDate.toLocaleDateString('en-IN')
                    )}
                  </td>
                  <td>
                    {inlineEditingIndex === index ? (
                      <input
                        type="text"
                        value={inlineEditData.chequeNeftNumber}
                        onChange={(e) => setInlineEditData({...inlineEditData, chequeNeftNumber: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '2px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      payment.chequeNeftNumber || '-'
                    )}
                  </td>
                  <td>
                    {inlineEditingIndex === index ? (
                      <select
                        value={inlineEditData.mode}
                        onChange={(e) => setInlineEditData({...inlineEditData, mode: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '2px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                        <option value="UPI">UPI</option>
                      </select>
                    ) : (
                      payment.mode || '-'
                    )}
                  </td>
                  {effectiveFieldVisibility.profitMargin && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.profitAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, profitAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displayProfitAmount.toLocaleString('en-IN')
                      )}
                    </td>
                  )}
                  {effectiveFieldVisibility.drawing && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.drawingAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, drawingAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displayDrawingAmount.toLocaleString('en-IN')
                      )}
                    </td>
                  )}
                  {effectiveFieldVisibility.documents && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.documentsAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, documentsAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displayDocumentsAmount > 0 ? displayDocumentsAmount.toLocaleString('en-IN') : '-'
                      )}
                    </td>
                  )}
                  {effectiveFieldVisibility.siteVisit && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.siteVisitAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, siteVisitAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displaySiteVisitAmount.toLocaleString('en-IN')
                      )}
                    </td>
                  )}
                  {effectiveFieldVisibility.marketingAndMisc && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.marketingAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, marketingAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displayMarketingAmount.toLocaleString('en-IN')
                      )}
                    </td>
                  )}
                  {effectiveFieldVisibility.officeManagement && (
                    <td>
                      {inlineEditingIndex === index ? (
                        <input 
                          type="number" 
                          value={inlineEditData.officeAmount}
                          onChange={(e) => setInlineEditData({...inlineEditData, officeAmount: parseInt(e.target.value) || 0})}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            textAlign: 'right',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          min="0"
                        />
                      ) : (
                        displayOfficeAmount.toLocaleString('en-IN')
                      )}
                    </td>
                  )}
                  {/* Custom fields amount columns */}
                  {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                    const customAmount = Math.floor((amountAfterAssociate * (getCustomFieldValue(customField.fieldName, 'percentage'))) / 100);
                    return (
                      <td key={`payment-custom-${index}-${customIndex}`} style={{ backgroundColor: '#fffbf0' }}>
                        {inlineEditingIndex === index ? (
                          <input 
                            type="number" 
                            value={inlineEditData.customFieldAmounts[customField.fieldName] || 0}
                            onChange={(e) => setInlineEditData({
                              ...inlineEditData, 
                              customFieldAmounts: {
                                ...inlineEditData.customFieldAmounts,
                                [customField.fieldName]: parseInt(e.target.value) || 0
                              }
                            })}
                            style={{ 
                              width: '100%', 
                              padding: '6px', 
                              textAlign: 'right',
                              border: '2px solid #3b82f6',
                              borderRadius: '4px',
                              fontSize: '14px',
                              backgroundColor: '#fffbf0'
                            }}
                            min="0"
                          />
                        ) : (
                          customAmount > 0 ? customAmount.toLocaleString('en-IN') : '-'
                        )}
                      </td>
                    );
                  })}
                  {(onEditPayment || onDeletePayment) && (
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexDirection: 'column' }}>
                        {inlineEditingIndex === index ? (
                          <>
                            {/* Save Button */}
                            <button
                              onClick={handleSaveInlineEdit}
                              style={{
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                              title="Save"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            {/* Cancel Button */}
                            <button
                              onClick={handleCancelInlineEdit}
                              style={{
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                              title="Cancel"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {onEditPayment && (
                              <button
                                onClick={() => handleStartInlineEdit(index)}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  transition: 'background 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                                title="Edit Payment"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                            )}
                            {onDeletePayment && (
                              <button
                                onClick={() => handleDeletePayment(index)}
                                style={{
                                  background: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  transition: 'background 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                                onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                                title="Delete Payment"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Yearly summary rows */}
            {Object.entries(yearlyDistribution)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, amount]) => {
                const yearAmount = parseInt(amount) || 0; // Use parseInt to avoid decimal issues
                // Calculate total associate percentage from all associates
                const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
                  ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
                  : 0;
                // Deduct associate share before calculating expenses
                const associateShare = Math.floor((yearAmount * totalAssociatePercent) / 100);
                const amountAfterAssociate = yearAmount - associateShare;
                const profitAmount = Math.floor((amountAfterAssociate * (activePercentages.profitMarginPercent || 0)) / 100);
                const drawingAmount = Math.floor((amountAfterAssociate * (activePercentages.drawingPercent || 0)) / 100);
                const documentsAmount = Math.floor((amountAfterAssociate * (activePercentages.documentsPercent || 0)) / 100);
                const siteVisitAmount = Math.floor((amountAfterAssociate * (activePercentages.siteVisitPercent || 0)) / 100);
                const marketingAmount = Math.floor((amountAfterAssociate * (activePercentages.marketingAndMiscPercent || 0)) / 100);
                const officeAmount = Math.floor((amountAfterAssociate * (activePercentages.officeManagementPercent || 0)) / 100);
                
                // Get edited amounts or use calculated ones
                const yearKey = `year-${year}`;
                const displayYearProfitAmount = editedAmounts[`${yearKey}-profit`] ?? profitAmount;
                const displayYearDrawingAmount = editedAmounts[`${yearKey}-drawing`] ?? drawingAmount;
                const displayYearDocumentsAmount = editedAmounts[`${yearKey}-documents`] ?? documentsAmount;
                const displayYearSiteVisitAmount = editedAmounts[`${yearKey}-siteVisit`] ?? siteVisitAmount;
                const displayYearMarketingAmount = editedAmounts[`${yearKey}-marketing`] ?? marketingAmount;
                const displayYearOfficeAmount = editedAmounts[`${yearKey}-office`] ?? officeAmount;
                
                return (
                  <tr key={year} className="year-summary-row">
                    <td><strong>{year} Total</strong></td>
                    <td><strong>{yearAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                    {effectiveFieldVisibility.profitMargin && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearProfitAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-profit`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearProfitAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.drawing && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearDrawingAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-drawing`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearDrawingAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.documents && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearDocumentsAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-documents`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearDocumentsAmount > 0 ? displayYearDocumentsAmount.toLocaleString('en-IN') : '-'}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.siteVisit && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearSiteVisitAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-siteVisit`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearSiteVisitAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.marketingAndMisc && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearMarketingAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-marketing`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearMarketingAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.officeManagement && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayYearOfficeAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, [`${yearKey}-office`]: parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '1px solid #4a90e2',
                              borderRadius: '3px',
                              backgroundColor: '#fff9e6'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayYearOfficeAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {/* Custom fields total columns */}
                    {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                      const customTotalAmount = Math.floor((amountAfterAssociate * (projectData[customField.fieldName] || 0)) / 100);
                      return (
                        <td key={`year-custom-${year}-${customIndex}`} style={{ backgroundColor: '#fffbf0', fontWeight: 'bold' }}>
                          {customTotalAmount > 0 ? customTotalAmount.toLocaleString('en-IN') : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td><strong>Grand Total</strong></td>
              <td><strong>{projectData.totalReceivedFees?.toLocaleString('en-IN') || '0'}</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              {(() => {
                // Calculate grand total with associate deduction
                const totalReceived = projectData.totalReceivedFees || 0;
                const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
                  ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
                  : 0;
                const associateShare = Math.floor((totalReceived * totalAssociatePercent) / 100);
                const amountAfterAssociate = totalReceived - associateShare;
                
                const profitMarginTotal = Math.floor((amountAfterAssociate * (activePercentages.profitMarginPercent || 0)) / 100);
                const drawingTotal = Math.floor((amountAfterAssociate * (activePercentages.drawingPercent || 0)) / 100);
                const documentsTotal = Math.floor((amountAfterAssociate * (activePercentages.documentsPercent || 0)) / 100);
                const siteVisitTotal = Math.floor((amountAfterAssociate * (activePercentages.siteVisitPercent || 0)) / 100);
                const marketingTotal = Math.floor((amountAfterAssociate * (activePercentages.marketingAndMiscPercent || 0)) / 100);
                const officeTotal = Math.floor((amountAfterAssociate * (activePercentages.officeManagementPercent || 0)) / 100);
                
                // Get edited amounts or use calculated ones
                const displayGrandProfitAmount = editedAmounts['grand-profit'] ?? profitMarginTotal;
                const displayGrandDrawingAmount = editedAmounts['grand-drawing'] ?? drawingTotal;
                const displayGrandDocumentsAmount = editedAmounts['grand-documents'] ?? documentsTotal;
                const displayGrandSiteVisitAmount = editedAmounts['grand-siteVisit'] ?? siteVisitTotal;
                const displayGrandMarketingAmount = editedAmounts['grand-marketing'] ?? marketingTotal;
                const displayGrandOfficeAmount = editedAmounts['grand-office'] ?? officeTotal;
                
                return (
                  <>
                    {effectiveFieldVisibility.profitMargin && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandProfitAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-profit': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandProfitAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.drawing && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandDrawingAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-drawing': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandDrawingAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.documents && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandDocumentsAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-documents': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandDocumentsAmount > 0 ? displayGrandDocumentsAmount.toLocaleString('en-IN') : '-'}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.siteVisit && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandSiteVisitAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-siteVisit': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandSiteVisitAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.marketingAndMisc && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandMarketingAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-marketing': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandMarketingAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                    {effectiveFieldVisibility.officeManagement && (
                      <td>
                        {isEditable ? (
                          <input 
                            type="number" 
                            value={displayGrandOfficeAmount}
                            onChange={(e) => setEditedAmounts({...editedAmounts, 'grand-office': parseInt(e.target.value) || 0})}
                            style={{ 
                              width: '100%', 
                              padding: '4px', 
                              textAlign: 'right',
                              fontWeight: 'bold',
                              border: '2px solid #2ecc71',
                              borderRadius: '3px',
                              backgroundColor: '#e8f8f5'
                            }}
                            min="0"
                          />
                        ) : (
                          <strong>{displayGrandOfficeAmount.toLocaleString('en-IN')}</strong>
                        )}
                      </td>
                    )}
                  </>
                );
              })()}
              {/* Custom fields grand total columns */}
              {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                // Calculate custom field grand total based on percentage and amount after associate deduction
                const totalReceived = projectData.totalReceivedFees || 0;
                const totalAssociatePercent = projectData.projectAssociates && projectData.projectAssociates.length > 0
                  ? projectData.projectAssociates.reduce((sum, assoc) => sum + (parseFloat(assoc.percentage) || 0), 0)
                  : 0;
                const associateShare = Math.floor((totalReceived * totalAssociatePercent) / 100);
                const amountAfterAssociate = totalReceived - associateShare;
                const percentage = getCustomFieldValue(customField.fieldName, 'percentage');
                const customGrandTotal = Math.floor((amountAfterAssociate * percentage) / 100);
                return (
                  <td key={`grand-custom-${customIndex}`} style={{ backgroundColor: '#fff8e1', fontWeight: 'bold', border: '2px solid #ff8f00' }}>
                    <strong>{customGrandTotal > 0 ? customGrandTotal.toLocaleString('en-IN') : '-'}</strong>
                  </td>
                );
              })}
            </tr>
            {projectData.finalizedFees && projectData.finalizedFees > projectData.totalReceivedFees && (
              <tr className="remaining-row">
                <td><strong>Remaining</strong></td>
                <td><strong>{(projectData.finalizedFees - projectData.totalReceivedFees).toLocaleString('en-IN')}</strong></td>
                <td colSpan="3"><strong>Pending Receipt</strong></td>
                <td colSpan={`${
                  (effectiveFieldVisibility.profitMargin ? 1 : 0) +
                  (effectiveFieldVisibility.drawing ? 1 : 0) +
                  (effectiveFieldVisibility.documents ? 1 : 0) +
                  (effectiveFieldVisibility.siteVisit ? 1 : 0) +
                  (effectiveFieldVisibility.marketingAndMisc ? 1 : 0) +
                  (effectiveFieldVisibility.officeManagement ? 1 : 0) +
                  (visibleCustomFields ? visibleCustomFields.length : 0)
                }`}>
                  <em>Will be allocated as per percentages upon receipt</em>
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#1f2937' }}>Add New Payment</h2>
              <button
                onClick={handleCloseAddPaymentModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: '1',
                  padding: '0 5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Amount and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Amount Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Amount <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Date Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.date}
                    onChange={(e) => handlePaymentFormChange('date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              {/* Row 2: Cheque/NEFT Number and Payment Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Cheque/NEFT Number Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Cheque / NEFT Number
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.chequeNeftNumber}
                    onChange={(e) => handlePaymentFormChange('chequeNeftNumber', e.target.value)}
                    placeholder="Enter cheque or NEFT number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Payment Mode Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Mode <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={paymentFormData.mode}
                    onChange={(e) => handlePaymentFormChange('mode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              {/* Use Default Percentages Checkbox */}
              <div style={{
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={paymentFormData.useDefaultPercentages}
                    onChange={(e) => handlePaymentFormChange('useDefaultPercentages', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  Use default configured percentage-wise distribution
                </label>
                <p style={{ margin: '8px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
                  {paymentFormData.useDefaultPercentages 
                    ? 'Distribution will be calculated using the project\'s default percentages'
                    : 'You can configure custom percentages for this payment below'}
                </p>
              </div>

              {/* Custom Percentages Configuration (shown when checkbox is unchecked) */}
              {!paymentFormData.useDefaultPercentages && (
                <div style={{
                  padding: '20px',
                  background: '#fff7ed',
                  borderRadius: '8px',
                  border: '2px solid #fed7aa'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#9a3412' }}>
                    Configure Custom Percentages
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Profit Margin %</label>
                      <input type="number" value={customPercentages.profitMarginPercent} onChange={(e) => handleCustomPercentageChange('profitMarginPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Drawing %</label>
                      <input type="number" value={customPercentages.drawingPercent} onChange={(e) => handleCustomPercentageChange('drawingPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Documents %</label>
                      <input type="number" value={customPercentages.documentsPercent} onChange={(e) => handleCustomPercentageChange('documentsPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Site Visit %</label>
                      <input type="number" value={customPercentages.siteVisitPercent} onChange={(e) => handleCustomPercentageChange('siteVisitPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Marketing & Misc %</label>
                      <input type="number" value={customPercentages.marketingAndMiscPercent} onChange={(e) => handleCustomPercentageChange('marketingAndMiscPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Office Management %</label>
                      <input type="number" value={customPercentages.officeManagementPercent} onChange={(e) => handleCustomPercentageChange('officeManagementPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                  </div>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#9a3412', fontStyle: 'italic' }}>
                    Total: {(
                      customPercentages.profitMarginPercent +
                      customPercentages.drawingPercent +
                      customPercentages.documentsPercent +
                      customPercentages.siteVisitPercent +
                      customPercentages.marketingAndMiscPercent +
                      customPercentages.officeManagementPercent
                    ).toFixed(2)}%
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={handleSubmitPayment}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#2c5282',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1e3a5f'}
                  onMouseLeave={(e) => e.target.style.background = '#2c5282'}
                >
                  Add Payment
                </button>
                <button
                  onClick={handleCloseAddPaymentModal}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#1f2937' }}>Edit Payment {editingPaymentIndex !== null ? editingPaymentIndex + 1 : ''}</h2>
              <button
                onClick={handleCloseEditPaymentModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: '1',
                  padding: '0 5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Amount and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Amount Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Amount <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Date Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.date}
                    onChange={(e) => handlePaymentFormChange('date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              {/* Row 2: Cheque/NEFT Number and Payment Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Cheque/NEFT Number Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Cheque / NEFT Number
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.chequeNeftNumber}
                    onChange={(e) => handlePaymentFormChange('chequeNeftNumber', e.target.value)}
                    placeholder="Enter cheque or NEFT number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Payment Mode Field */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Payment Mode <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={paymentFormData.mode}
                    onChange={(e) => handlePaymentFormChange('mode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2c5282'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              {/* Use Default Percentages Checkbox */}
              <div style={{
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={paymentFormData.useDefaultPercentages}
                    onChange={(e) => handlePaymentFormChange('useDefaultPercentages', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  Use default configured percentage-wise distribution
                </label>
                <p style={{ margin: '8px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
                  {paymentFormData.useDefaultPercentages 
                    ? 'Distribution will be calculated using the project\'s default percentages'
                    : 'You can configure custom percentages for this payment below'}
                </p>
              </div>

              {/* Custom Percentages Configuration (shown when checkbox is unchecked) */}
              {!paymentFormData.useDefaultPercentages && (
                <div style={{
                  padding: '20px',
                  background: '#fff7ed',
                  borderRadius: '8px',
                  border: '2px solid #fed7aa'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#9a3412' }}>
                    Configure Custom Percentages
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Profit Margin %</label>
                      <input type="number" value={customPercentages.profitMarginPercent} onChange={(e) => handleCustomPercentageChange('profitMarginPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Drawing %</label>
                      <input type="number" value={customPercentages.drawingPercent} onChange={(e) => handleCustomPercentageChange('drawingPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Documents %</label>
                      <input type="number" value={customPercentages.documentsPercent} onChange={(e) => handleCustomPercentageChange('documentsPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Site Visit %</label>
                      <input type="number" value={customPercentages.siteVisitPercent} onChange={(e) => handleCustomPercentageChange('siteVisitPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Marketing & Misc %</label>
                      <input type="number" value={customPercentages.marketingAndMiscPercent} onChange={(e) => handleCustomPercentageChange('marketingAndMiscPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Office Management %</label>
                      <input type="number" value={customPercentages.officeManagementPercent} onChange={(e) => handleCustomPercentageChange('officeManagementPercent', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '14px' }} step="0.01" min="0" max="100" />
                    </div>
                  </div>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#9a3412', fontStyle: 'italic' }}>
                    Total: {(
                      customPercentages.profitMarginPercent +
                      customPercentages.drawingPercent +
                      customPercentages.documentsPercent +
                      customPercentages.siteVisitPercent +
                      customPercentages.marketingAndMiscPercent +
                      customPercentages.officeManagementPercent
                    ).toFixed(2)}%
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={handleSubmitEditPayment}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#2c5282',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1e3a5f'}
                  onMouseLeave={(e) => e.target.style.background = '#2c5282'}
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCloseEditPaymentModal}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearlyDistributionTable;
