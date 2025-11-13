import React, { useEffect } from 'react';
import './YearlyDistributionTable.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const YearlyDistributionTable = ({ 
  projectData, 
  showTitle = true, 
  compact = false,
  associateConfig = null,
  customFields = [],
  fieldVisibility = {}
}) => {
  
  // Filter visible custom fields based on visibility flag
  const visibleCustomFields = customFields.filter(field => field.visible);
  
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

  const exportToExcel = () => {
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
    if (fieldVisibility.profitMargin) headers.push('Profit Margin');
    if (fieldVisibility.drawing) headers.push('Drawing');
    if (fieldVisibility.documents) headers.push('Documents');
    if (fieldVisibility.siteVisit) headers.push('Site Visit');
    if (fieldVisibility.marketingAndMisc) headers.push('Marketing and Misc.');
    if (fieldVisibility.officeManagement) headers.push('Office Management');
    
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
    
    if (fieldVisibility.profitMargin) percentageRow.push(`${projectData.profitMarginPercent || 0}%`);
    if (fieldVisibility.drawing) percentageRow.push(`${projectData.drawingPercent || 0}%`);
    if (fieldVisibility.documents) percentageRow.push(`${projectData.documentsPercent || 0}%`);
    if (fieldVisibility.siteVisit) percentageRow.push(`${projectData.siteVisitPercent || 0}%`);
    if (fieldVisibility.marketingAndMisc) percentageRow.push(`${projectData.marketingAndMiscPercent || 0}%`);
    if (fieldVisibility.officeManagement) percentageRow.push(`${projectData.officeManagementPercent || 0}%`);
    
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
        const profitMarginAmount = Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100);
        const drawingAmount = Math.floor((amount * (projectData.drawingPercent || 0)) / 100);
        const documentsAmount = Math.floor((amount * (projectData.documentsPercent || 0)) / 100);
        const siteVisitAmount = Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100);
        const marketingAmount = Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100);
        const officeAmount = Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100);
        
        const paymentRow = [
          `Payment ${index + 1}`,
          amount,
          payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : '-',
          payment.chequeNumber || payment.referenceNumber || '-',
          payment.mode || 'NEFT'
        ];
        
        // Add visible default field amounts
        if (fieldVisibility.profitMargin) paymentRow.push(profitMarginAmount);
        if (fieldVisibility.drawing) paymentRow.push(drawingAmount);
        if (fieldVisibility.documents) paymentRow.push(documentsAmount > 0 ? documentsAmount : '-');
        if (fieldVisibility.siteVisit) paymentRow.push(siteVisitAmount);
        if (fieldVisibility.marketingAndMisc) paymentRow.push(marketingAmount);
        if (fieldVisibility.officeManagement) paymentRow.push(officeAmount);
        
        // Add visible custom field amounts
        if (visibleCustomFields && visibleCustomFields.length > 0) {
          visibleCustomFields.forEach(field => {
            const customAmount = Math.floor((amount * (getCustomFieldValue(field.fieldName, 'percentage'))) / 100);
            paymentRow.push(customAmount > 0 ? customAmount : '-');
          });
        }
        
        excelData.push(paymentRow);
      });
    }
    
    // Yearly totals with exact calculations
    Object.keys(yearlyDistribution).forEach(year => {
      const amount = parseInt(yearlyDistribution[year]) || 0;
      const yearlyRow = [
        `${year} Total`,
        amount,
        '-',
        '-',
        '-'
      ];
      
      // Add visible default field yearly totals
      if (fieldVisibility.profitMargin) yearlyRow.push(Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100));
      if (fieldVisibility.drawing) yearlyRow.push(Math.floor((amount * (projectData.drawingPercent || 0)) / 100));
      if (fieldVisibility.documents) yearlyRow.push(Math.floor((amount * (projectData.documentsPercent || 0)) / 100));
      if (fieldVisibility.siteVisit) yearlyRow.push(Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100));
      if (fieldVisibility.marketingAndMisc) yearlyRow.push(Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100));
      if (fieldVisibility.officeManagement) yearlyRow.push(Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100));
      
      // Add visible custom field yearly totals
      if (visibleCustomFields && visibleCustomFields.length > 0) {
        visibleCustomFields.forEach(field => {
          const customYearlyAmount = Math.floor((amount * (getCustomFieldValue(field.fieldName, 'percentage'))) / 100);
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
    
    // Add visible default field grand totals
    if (fieldVisibility.profitMargin) grandTotalRow.push(projectData.profitMargin || 0);
    if (fieldVisibility.drawing) grandTotalRow.push(projectData.drawing || 0);
    if (fieldVisibility.documents) grandTotalRow.push((projectData.documents && projectData.documents > 0) ? projectData.documents : '-');
    if (fieldVisibility.siteVisit) grandTotalRow.push(projectData.siteVisit || 0);
    if (fieldVisibility.marketingAndMisc) grandTotalRow.push(projectData.marketingAndMisc || 0);
    if (fieldVisibility.officeManagement) grandTotalRow.push(projectData.officeManagement || 0);
    
    // Add visible custom field grand totals
    if (visibleCustomFields && visibleCustomFields.length > 0) {
      visibleCustomFields.forEach(field => {
        const percentage = getCustomFieldValue(field.fieldName, 'percentage');
        const customGrandTotal = Math.floor(((projectData.totalReceivedFees || 0) * percentage) / 100);
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

  const exportToPDF = () => {
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
        const profitMarginAmount = Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100);
        const drawingAmount = Math.floor((amount * (projectData.drawingPercent || 0)) / 100);
        const documentsAmount = Math.floor((amount * (projectData.documentsPercent || 0)) / 100);
        const siteVisitAmount = Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100);
        const marketingAmount = Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100);
        const officeAmount = Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100);
        
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
      tableData.push([
        `${year} Total`,
        amount.toLocaleString('en-IN'),
        '-',
        '-',
        '-',
        Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amount * (projectData.drawingPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amount * (projectData.documentsPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100).toLocaleString('en-IN'),
        Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100).toLocaleString('en-IN')
      ]);
    });
    
    // Grand total
    const grandTotalRow = [
      'Grand Total',
      (projectData.totalReceivedFees || 0).toLocaleString('en-IN'),
      '-',
      '-',
      '-',
      (projectData.profitMargin || 0).toLocaleString('en-IN'),
      (projectData.drawing || 0).toLocaleString('en-IN'),
      (projectData.documents && projectData.documents > 0) ? projectData.documents.toLocaleString('en-IN') : '-',
      (projectData.siteVisit || 0).toLocaleString('en-IN'),
      (projectData.marketingAndMisc || 0).toLocaleString('en-IN'),
      (projectData.officeManagement || 0).toLocaleString('en-IN')
    ];
    
    // Add custom field grand totals to PDF
    if (customFields && customFields.length > 0) {
      customFields.forEach(field => {
        const percentage = getCustomFieldValue(field.fieldName, 'percentage');
        const customGrandTotal = Math.floor(((projectData.totalReceivedFees || 0) * percentage) / 100);
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

  if (!yearlyDistribution || Object.keys(yearlyDistribution).length === 0) {
    return (
      <div className="empty-distribution">
        <p>No payment data available for yearly distribution.</p>
      </div>
    );
  }

  const tableClass = compact ? 'distribution-table compact' : 'distribution-table';

  return (
    <div className="yearly-distribution-wrapper">
      {showTitle && (
        <div className="distribution-header">
          <h3>📊 Yearly Payment Distribution - {projectData.projectName}</h3>
          <div className="project-summary">
            <span>Finalized Fees: {formatCurrency(projectData.finalizedFees)}</span>
            <span>Total Received: {formatCurrency(projectData.totalReceivedFees)}</span>
            <span>Pending: {formatCurrency((projectData.finalizedFees || 0) - (projectData.totalReceivedFees || 0))}</span>
          </div>
        </div>
      )}
      
      <div className="yearly-distribution">
        <table className={tableClass}>
          <thead>
            <tr>
              <th>Descriptions</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Cheque number/NEFT number</th>
              <th>Mode</th>
              {/* Associate columns if configured */}
              {associateConfig && associateConfig.includeAssociates && associateConfig.associates && 
                associateConfig.associates.map((associate, index) => (
                  <th key={`associate-${index}`} style={{ backgroundColor: '#e7f3ff', color: '#0056b3' }}>
                    {associate.name || `Associate ${index + 1}`}
                    <br />
                    <small>({associate.company || 'N/A'})</small>
                  </th>
                ))
              }
              {fieldVisibility.profitMargin && <th>Profit margin</th>}
              {fieldVisibility.drawing && <th>Drawing</th>}
              {fieldVisibility.documents && <th>Documents</th>}
              {fieldVisibility.siteVisit && <th>Site visit</th>}
              {fieldVisibility.marketingAndMisc && <th>Marketing and Misc.</th>}
              {fieldVisibility.officeManagement && <th>Office management</th>}
              {/* Custom fields columns */}
              {visibleCustomFields && visibleCustomFields.map((customField, index) => (
                <th key={`custom-${index}`} style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
                  {customField.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="percentage-row">
              <td><strong>Percentage will vary project</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              {/* Associate percentage columns */}
              {associateConfig && associateConfig.includeAssociates && associateConfig.associates && 
                associateConfig.associates.map((associate, index) => (
                  <td key={`associate-percent-${index}`} style={{ backgroundColor: '#f0f8ff', fontWeight: 'bold' }}>
                    {associate.percentage || 0}%
                  </td>
                ))
              }
              {fieldVisibility.profitMargin && <td><strong>{projectData.profitMarginPercent || 0}%</strong></td>}
              {fieldVisibility.drawing && <td><strong>{projectData.drawingPercent || 0}%</strong></td>}
              {fieldVisibility.documents && <td><strong>{projectData.documentsPercent || 0}%</strong></td>}
              {fieldVisibility.siteVisit && <td><strong>{projectData.siteVisitPercent || 0}%</strong></td>}
              {fieldVisibility.marketingAndMisc && <td><strong>{projectData.marketingAndMiscPercent || 0}%</strong></td>}
              {fieldVisibility.officeManagement && <td><strong>{projectData.officeManagementPercent || 0}%</strong></td>}
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
              const profitAmount = Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100);
              const drawingAmount = Math.floor((amount * (projectData.drawingPercent || 0)) / 100);
              const documentsAmount = Math.floor((amount * (projectData.documentsPercent || 0)) / 100);
              const siteVisitAmount = Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100);
              const marketingAmount = Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100);
              const officeAmount = Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100);
              
              return (
                <tr key={`payment-${index}`} className="payment-row">
                  <td>Payment {index + 1}</td>
                  <td>{amount?.toLocaleString('en-IN')}</td>
                  <td>{paymentDate.toLocaleDateString('en-IN')}</td>
                  <td>{payment.chequeNeftNumber || '-'}</td>
                  <td>{payment.mode}</td>
                  {/* Associate amount columns */}
                  {associateConfig && associateConfig.includeAssociates && associateConfig.associates && 
                    associateConfig.associates.map((associate, associateIndex) => {
                      const associateAmount = Math.floor((amount * (associate.percentage || 0)) / 100);
                      return (
                        <td key={`payment-associate-${index}-${associateIndex}`} style={{ backgroundColor: '#f8f9fa' }}>
                          {associateAmount.toLocaleString('en-IN')}
                        </td>
                      );
                    })
                  }
                  {fieldVisibility.profitMargin && <td>{profitAmount.toLocaleString('en-IN')}</td>}
                  {fieldVisibility.drawing && <td>{drawingAmount.toLocaleString('en-IN')}</td>}
                  {fieldVisibility.documents && <td>{documentsAmount > 0 ? documentsAmount.toLocaleString('en-IN') : '-'}</td>}
                  {fieldVisibility.siteVisit && <td>{siteVisitAmount.toLocaleString('en-IN')}</td>}
                  {fieldVisibility.marketingAndMisc && <td>{marketingAmount.toLocaleString('en-IN')}</td>}
                  {fieldVisibility.officeManagement && <td>{officeAmount.toLocaleString('en-IN')}</td>}
                  {/* Custom fields amount columns */}
                  {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                    const customAmount = Math.floor((amount * (getCustomFieldValue(customField.fieldName, 'percentage'))) / 100);
                    return (
                      <td key={`payment-custom-${index}-${customIndex}`} style={{ backgroundColor: '#fffbf0' }}>
                        {customAmount > 0 ? customAmount.toLocaleString('en-IN') : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Yearly summary rows */}
            {Object.entries(yearlyDistribution)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, amount]) => {
                const yearAmount = parseInt(amount) || 0; // Use parseInt to avoid decimal issues
                const profitAmount = Math.floor((yearAmount * (projectData.profitMarginPercent || 0)) / 100);
                const drawingAmount = Math.floor((yearAmount * (projectData.drawingPercent || 0)) / 100);
                const documentsAmount = Math.floor((yearAmount * (projectData.documentsPercent || 0)) / 100);
                const siteVisitAmount = Math.floor((yearAmount * (projectData.siteVisitPercent || 0)) / 100);
                const marketingAmount = Math.floor((yearAmount * (projectData.marketingAndMiscPercent || 0)) / 100);
                const officeAmount = Math.floor((yearAmount * (projectData.officeManagementPercent || 0)) / 100);
                
                return (
                  <tr key={year} className="year-summary-row">
                    <td><strong>{year} Total</strong></td>
                    <td><strong>{yearAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                    {/* Associate total columns */}
                    {associateConfig && associateConfig.includeAssociates && associateConfig.associates && 
                      associateConfig.associates.map((associate, associateIndex) => {
                        const associateTotalAmount = Math.floor((yearAmount * (associate.percentage || 0)) / 100);
                        return (
                          <td key={`year-associate-${year}-${associateIndex}`} style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            {associateTotalAmount.toLocaleString('en-IN')}
                          </td>
                        );
                      })
                    }
                    {fieldVisibility.profitMargin && <td><strong>{profitAmount.toLocaleString('en-IN')}</strong></td>}
                    {fieldVisibility.drawing && <td><strong>{drawingAmount.toLocaleString('en-IN')}</strong></td>}
                    {fieldVisibility.documents && <td><strong>{documentsAmount > 0 ? documentsAmount.toLocaleString('en-IN') : '-'}</strong></td>}
                    {fieldVisibility.siteVisit && <td><strong>{siteVisitAmount.toLocaleString('en-IN')}</strong></td>}
                    {fieldVisibility.marketingAndMisc && <td><strong>{marketingAmount.toLocaleString('en-IN')}</strong></td>}
                    {fieldVisibility.officeManagement && <td><strong>{officeAmount.toLocaleString('en-IN')}</strong></td>}
                    {/* Custom fields total columns */}
                    {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                      const customTotalAmount = Math.floor((yearAmount * (projectData[customField.fieldName] || 0)) / 100);
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
              {/* Associate grand total columns */}
              {associateConfig && associateConfig.includeAssociates && associateConfig.associates && 
                associateConfig.associates.map((associate, associateIndex) => {
                  const associateGrandTotal = Math.floor(((projectData.totalReceivedFees || 0) * (associate.percentage || 0)) / 100);
                  return (
                    <td key={`grand-associate-${associateIndex}`} style={{ backgroundColor: '#e8f4fd', fontWeight: 'bold', border: '2px solid #0056b3' }}>
                      {associateGrandTotal.toLocaleString('en-IN')}
                    </td>
                  );
                })
              }
              {fieldVisibility.profitMargin && <td><strong>{projectData.profitMargin?.toLocaleString('en-IN') || '0'}</strong></td>}
              {fieldVisibility.drawing && <td><strong>{projectData.drawing?.toLocaleString('en-IN') || '0'}</strong></td>}
              {fieldVisibility.documents && <td><strong>{(projectData.documents && projectData.documents > 0) ? projectData.documents.toLocaleString('en-IN') : '-'}</strong></td>}
              {fieldVisibility.siteVisit && <td><strong>{projectData.siteVisit?.toLocaleString('en-IN') || '0'}</strong></td>}
              {fieldVisibility.marketingAndMisc && <td><strong>{projectData.marketingAndMisc?.toLocaleString('en-IN') || '0'}</strong></td>}
              {fieldVisibility.officeManagement && <td><strong>{projectData.officeManagement?.toLocaleString('en-IN') || '0'}</strong></td>}
              {/* Custom fields grand total columns */}
              {visibleCustomFields && visibleCustomFields.map((customField, customIndex) => {
                // Calculate custom field grand total based on percentage and total received fees
                const percentage = getCustomFieldValue(customField.fieldName, 'percentage');
                const customGrandTotal = Math.floor(((projectData.totalReceivedFees || 0) * percentage) / 100);
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
                  (fieldVisibility.profitMargin ? 1 : 0) +
                  (fieldVisibility.drawing ? 1 : 0) +
                  (fieldVisibility.documents ? 1 : 0) +
                  (fieldVisibility.siteVisit ? 1 : 0) +
                  (fieldVisibility.marketingAndMisc ? 1 : 0) +
                  (fieldVisibility.officeManagement ? 1 : 0) +
                  (associateConfig && associateConfig.includeAssociates ? associateConfig.associates.length : 0) + 
                  (visibleCustomFields ? visibleCustomFields.length : 0)
                }`}>
                  <em>Will be allocated as per percentages upon receipt</em>
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default YearlyDistributionTable;