import React, { useEffect } from 'react';
import './YearlyDistributionTable.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const YearlyDistributionTable = ({ 
  projectData, 
  showTitle = true, 
  compact = false 
}) => {
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
    
    // Table headers
    excelData.push([
      'Descriptions',
      'Amount',
      'Date', 
      'Cheque number/NEFT number',
      'Mode',
      'Profit Margin',
      'Drawing',
      'Documents',
      'Site Visit',
      'Marketing and Misc.',
      'Office Management'
    ]);
    
    // Percentage row
    excelData.push([
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
        
        excelData.push([
          `Payment ${index + 1}`,
          amount,
          payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : '-',
          payment.chequeNumber || payment.referenceNumber || '-',
          payment.mode || 'NEFT',
          profitMarginAmount,
          drawingAmount,
          documentsAmount > 0 ? documentsAmount : '-',
          siteVisitAmount,
          marketingAmount,
          officeAmount
        ]);
      });
    }
    
    // Yearly totals with exact calculations
    Object.keys(yearlyDistribution).forEach(year => {
      const amount = parseInt(yearlyDistribution[year]) || 0;
      excelData.push([
        `${year} Total`,
        amount,
        '-',
        '-',
        '-',
        Math.floor((amount * (projectData.profitMarginPercent || 0)) / 100),
        Math.floor((amount * (projectData.drawingPercent || 0)) / 100),
        Math.floor((amount * (projectData.documentsPercent || 0)) / 100),
        Math.floor((amount * (projectData.siteVisitPercent || 0)) / 100),
        Math.floor((amount * (projectData.marketingAndMiscPercent || 0)) / 100),
        Math.floor((amount * (projectData.officeManagementPercent || 0)) / 100)
      ]);
    });
    
    // Grand total row
    excelData.push([
      'Grand Total',
      projectData.totalReceivedFees || 0,
      '-',
      '-',
      '-',
      projectData.profitMargin || 0,
      projectData.drawing || 0,
      (projectData.documents && projectData.documents > 0) ? projectData.documents : '-',
      projectData.siteVisit || 0,
      projectData.marketingAndMisc || 0,
      projectData.officeManagement || 0
    ]);
    
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
    tableData.push([
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
    ]);
    
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
              <th>Profit margin</th>
              <th>Drawing</th>
              <th>Documents</th>
              <th>Site visit</th>
              <th>Marketing and Misc.</th>
              <th>Office management</th>
            </tr>
          </thead>
          <tbody>
            <tr className="percentage-row">
              <td><strong>Percentage will vary project</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>-</strong></td>
              <td><strong>{projectData.profitMarginPercent || 0}%</strong></td>
              <td><strong>{projectData.drawingPercent || 0}%</strong></td>
              <td><strong>{projectData.documentsPercent || 0}%</strong></td>
              <td><strong>{projectData.siteVisitPercent || 0}%</strong></td>
              <td><strong>{projectData.marketingAndMiscPercent || 0}%</strong></td>
              <td><strong>{projectData.officeManagementPercent || 0}%</strong></td>
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
                  <td>{profitAmount.toLocaleString('en-IN')}</td>
                  <td>{drawingAmount.toLocaleString('en-IN')}</td>
                  <td>{documentsAmount > 0 ? documentsAmount.toLocaleString('en-IN') : '-'}</td>
                  <td>{siteVisitAmount.toLocaleString('en-IN')}</td>
                  <td>{marketingAmount.toLocaleString('en-IN')}</td>
                  <td>{officeAmount.toLocaleString('en-IN')}</td>
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
                    <td><strong>{profitAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>{drawingAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>{documentsAmount > 0 ? documentsAmount.toLocaleString('en-IN') : '-'}</strong></td>
                    <td><strong>{siteVisitAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>{marketingAmount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>{officeAmount.toLocaleString('en-IN')}</strong></td>
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
              <td><strong>{projectData.profitMargin?.toLocaleString('en-IN') || '0'}</strong></td>
              <td><strong>{projectData.drawing?.toLocaleString('en-IN') || '0'}</strong></td>
              <td><strong>{(projectData.documents && projectData.documents > 0) ? projectData.documents.toLocaleString('en-IN') : '-'}</strong></td>
              <td><strong>{projectData.siteVisit?.toLocaleString('en-IN') || '0'}</strong></td>
              <td><strong>{projectData.marketingAndMisc?.toLocaleString('en-IN') || '0'}</strong></td>
              <td><strong>{projectData.officeManagement?.toLocaleString('en-IN') || '0'}</strong></td>
            </tr>
            {projectData.finalizedFees && projectData.finalizedFees > projectData.totalReceivedFees && (
              <tr className="remaining-row">
                <td><strong>Remaining</strong></td>
                <td><strong>{(projectData.finalizedFees - projectData.totalReceivedFees).toLocaleString('en-IN')}</strong></td>
                <td colSpan="3"><strong>Pending Receipt</strong></td>
                <td colSpan="6"><em>Will be allocated as per percentages upon receipt</em></td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default YearlyDistributionTable;