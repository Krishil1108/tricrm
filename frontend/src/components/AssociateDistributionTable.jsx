import React from 'react';
import './AssociateDistributionTable.css';

const AssociateDistributionTable = ({ projectData, associates = [] }) => {
  // Return null if no associates
  if (!projectData.projectAssociates || projectData.projectAssociates.length === 0) {
    return null;
  }

  const payments = projectData.payments || [];

  // Calculate yearly distribution for each associate
  const calculateAssociateDistribution = () => {
    const distribution = {};

    projectData.projectAssociates.forEach(assoc => {
      const associateInfo = associates.find(a => a._id === assoc.associateId);
      const associateName = associateInfo?.name || 'Unknown Associate';
      const associatePercentage = parseFloat(assoc.percentage) || 0;

      distribution[assoc.associateId] = {
        name: associateName,
        percentage: associatePercentage,
        yearlyAmounts: {},
        totalAmount: 0,
        payments: []
      };

      // Calculate distribution from each payment
      payments.forEach(payment => {
        const paymentAmount = parseFloat(payment.amount) || 0;
        const associateShare = (paymentAmount * associatePercentage) / 100;
        const paymentDate = new Date(payment.date);
        const year = paymentDate.getFullYear().toString();

        // Add to yearly total
        if (!distribution[assoc.associateId].yearlyAmounts[year]) {
          distribution[assoc.associateId].yearlyAmounts[year] = 0;
        }
        distribution[assoc.associateId].yearlyAmounts[year] += associateShare;
        distribution[assoc.associateId].totalAmount += associateShare;

        // Store payment details
        distribution[assoc.associateId].payments.push({
          date: payment.date,
          amount: paymentAmount,
          share: associateShare,
          mode: payment.mode,
          chequeNeftNumber: payment.chequeNeftNumber
        });
      });
    });

    return distribution;
  };

  const associateDistribution = calculateAssociateDistribution();

  // Get all unique years from payments
  const allYears = [...new Set(payments.map(p => new Date(p.date).getFullYear().toString()))].sort();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="associate-distribution-container">
      <div className="associate-distribution-header">
        <h3>Associate Payment Distribution</h3>
        <p className="associate-summary">
          Showing payment distribution for {Object.keys(associateDistribution).length} associate(s)
        </p>
      </div>

      <div className="associate-distribution-content">
        <table className="associate-distribution-table">
          <thead>
            <tr>
              <th style={{ width: '200px', textAlign: 'left' }}>Associate Name</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Share %</th>
              {allYears.map(year => (
                <th key={year} style={{ width: '150px', textAlign: 'right' }}>{year}</th>
              ))}
              <th style={{ width: '150px', textAlign: 'right' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(associateDistribution).map(([associateId, data]) => (
              <tr key={associateId}>
                <td>
                  <strong>{data.name}</strong>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="percentage-badge">{data.percentage}%</span>
                </td>
                {allYears.map(year => (
                  <td key={year} style={{ textAlign: 'right' }}>
                    {data.yearlyAmounts[year] 
                      ? formatCurrency(data.yearlyAmounts[year])
                      : '-'
                    }
                  </td>
                ))}
                <td style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#059669' }}>
                    {formatCurrency(data.totalAmount)}
                  </strong>
                </td>
              </tr>
            ))}
            
            {/* Total Row */}
            <tr className="total-row">
              <td colSpan="2"><strong>Total Distributed</strong></td>
              {allYears.map(year => {
                const yearTotal = Object.values(associateDistribution).reduce((sum, data) => 
                  sum + (data.yearlyAmounts[year] || 0), 0
                );
                return (
                  <td key={year} style={{ textAlign: 'right' }}>
                    <strong>{formatCurrency(yearTotal)}</strong>
                  </td>
                );
              })}
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: '#2c5282' }}>
                  {formatCurrency(
                    Object.values(associateDistribution).reduce((sum, data) => sum + data.totalAmount, 0)
                  )}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssociateDistributionTable;
