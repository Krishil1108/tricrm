import React from 'react';
import { 
  FaUsers, 
  FaUserTie, 
  FaProjectDiagram, 
  FaDollarSign,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMinusCircle,
  FaChartLine,
  FaTasks,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const SummaryCards = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <FaArrowUp />;
    if (change < 0) return <FaArrowDown />;
    return null;
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const cards = [
    {
      title: 'Total Clients',
      value: formatNumber(data.totalClients?.current),
      icon: <FaUsers />,
      className: 'clients',
      change: data.totalClients?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Total Associates',
      value: formatNumber(data.totalAssociates?.current),
      icon: <FaUserTie />,
      className: 'associates',
      change: data.totalAssociates?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Total Projects',
      value: formatNumber(data.totalProjects?.current),
      icon: <FaProjectDiagram />,
      className: 'projects',
      change: data.totalProjects?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue?.current),
      icon: <FaDollarSign />,
      className: 'revenue',
      change: data.totalRevenue?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Amount Paid',
      value: formatCurrency(data.totalPaid?.current),
      icon: <FaCheckCircle />,
      className: 'paid',
      change: data.totalPaid?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Amount Pending',
      value: formatCurrency(data.totalPending?.current),
      icon: <FaExclamationTriangle />,
      className: 'pending',
      change: data.totalPending?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(data.totalExpenses?.current),
      icon: <FaMinusCircle />,
      className: 'expenses',
      change: data.totalExpenses?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(data.totalProfit?.current),
      icon: <FaChartLine />,
      className: 'profit',
      change: data.totalProfit?.change,
      changeLabel: 'vs last period'
    },
    {
      title: 'Project Completion',
      value: formatPercentage(data.projectCompletion?.current),
      icon: <FaTasks />,
      className: 'completion',
      change: data.projectCompletion?.change,
      changeLabel: 'vs last period'
    }
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, index) => (
        <div key={index} className={`summary-card ${card.className} fade-in`}>
          <div className="card-header">
            <span className="card-title">{card.title}</span>
            <span className="card-icon">{card.icon}</span>
          </div>
          <div className="card-value">{card.value}</div>
          {card.change !== undefined && card.change !== null && (
            <div className={`card-change ${getChangeClass(card.change)}`}>
              {getChangeIcon(card.change)}
              <span>
                {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}% {card.changeLabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;