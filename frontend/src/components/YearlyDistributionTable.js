import React from 'react';
import './YearlyDistributionTable.css';

const YearlyDistributionTable = ({ 
  projectData, 
  showTitle = true, 
  compact = false 
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

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
        distribution[financialYear] += parseFloat(payment.amount) || 0;
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
              const profitAmount = Math.round((payment.amount * (projectData.profitMarginPercent || 0)) / 100);
              const drawingAmount = Math.round((payment.amount * (projectData.drawingPercent || 0)) / 100);
              const documentsAmount = Math.round((payment.amount * (projectData.documentsPercent || 0)) / 100);
              const siteVisitAmount = Math.round((payment.amount * (projectData.siteVisitPercent || 0)) / 100);
              const marketingAmount = Math.round((payment.amount * (projectData.marketingAndMiscPercent || 0)) / 100);
              const officeAmount = Math.round((payment.amount * (projectData.officeManagementPercent || 0)) / 100);
              
              return (
                <tr key={`payment-${index}`} className="payment-row">
                  <td>Payment {index + 1}</td>
                  <td>{payment.amount?.toLocaleString('en-IN')}</td>
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
                const profitAmount = Math.round((amount * (projectData.profitMarginPercent || 0)) / 100);
                const drawingAmount = Math.round((amount * (projectData.drawingPercent || 0)) / 100);
                const documentsAmount = Math.round((amount * (projectData.documentsPercent || 0)) / 100);
                const siteVisitAmount = Math.round((amount * (projectData.siteVisitPercent || 0)) / 100);
                const marketingAmount = Math.round((amount * (projectData.marketingAndMiscPercent || 0)) / 100);
                const officeAmount = Math.round((amount * (projectData.officeManagementPercent || 0)) / 100);
                
                return (
                  <tr key={year} className="year-summary-row">
                    <td><strong>{year} Total</strong></td>
                    <td><strong>{amount.toLocaleString('en-IN')}</strong></td>
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