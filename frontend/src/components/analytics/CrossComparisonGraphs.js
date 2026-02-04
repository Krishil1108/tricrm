import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { FaDownload, FaExpand, FaExchangeAlt, FaBalanceScale, FaChartLine } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CrossComparisonGraphs = ({ data, onExport, onDrillDown }) => {
  const clientProjectChartRef = useRef(null);
  const projectAssociateChartRef = useRef(null);
  const clientAssociateChartRef = useRef(null);
  const revenueCostProfitChartRef = useRef(null);
  const plannedActualChartRef = useRef(null);
  const paymentsExpensesChartRef = useRef(null);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#34495e',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Client vs Project Comparison
  const clientProjectData = {
    labels: data.clientProject?.labels || [],
    datasets: [
      {
        label: 'Revenue per Client',
        data: data.clientProject?.clientRevenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Cost per Client',
        data: data.clientProject?.clientCost || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      },
      {
        label: 'Profit per Client',
        data: data.clientProject?.clientProfit || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2
      }
    ]
  };

  // Project vs Associate Comparison
  const projectAssociateData = {
    labels: data.projectAssociate?.labels || [],
    datasets: [
      {
        label: 'Workload (Hours)',
        data: data.projectAssociate?.workload || [],
        backgroundColor: 'rgba(243, 156, 18, 0.8)',
        borderColor: '#f39c12',
        borderWidth: 2
      },
      {
        label: 'Payouts ($)',
        data: data.projectAssociate?.payouts || [],
        backgroundColor: 'rgba(155, 89, 182, 0.8)',
        borderColor: '#9b59b6',
        borderWidth: 2
      }
    ]
  };

  // Client vs Associate Comparison
  const clientAssociateData = {
    labels: data.clientAssociate?.labels || [],
    datasets: [
      {
        label: 'Total Earnings',
        data: data.clientAssociate?.earnings || [],
        backgroundColor: 'rgba(26, 188, 156, 0.8)',
        borderColor: '#1abc9c',
        borderWidth: 2
      },
      {
        label: 'Total Workload',
        data: data.clientAssociate?.workload || [],
        backgroundColor: 'rgba(52, 73, 94, 0.8)',
        borderColor: '#34495e',
        borderWidth: 2
      }
    ]
  };

  // Revenue vs Cost vs Profit
  const revenueCostProfitData = {
    labels: data.revenueCostProfit?.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        data: data.revenueCostProfit?.revenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        type: 'bar',
        label: 'Cost',
        data: data.revenueCostProfit?.cost || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      },
      {
        type: 'line',
        label: 'Profit',
        data: data.revenueCostProfit?.profit || [],
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Planned vs Actual Percentage
  const plannedActualData = {
    labels: data.plannedActual?.labels || [],
    datasets: [
      {
        label: 'Planned %',
        data: data.plannedActual?.planned || [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Actual %',
        data: data.plannedActual?.actual || [],
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#e74c3c',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Payments vs Expenses Per Month
  const paymentsExpensesData = {
    labels: data.paymentsExpenses?.labels || [],
    datasets: [
      {
        label: 'Total Payments Received',
        data: data.paymentsExpenses?.payments || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2
      },
      {
        label: 'Total Expenses',
        data: data.paymentsExpenses?.expenses || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      }
    ]
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = event.chart.data.labels[element.index];
      onDrillDown('comparison', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Client vs Project Comparison */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaExchangeAlt /> Client vs Project Analysis
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(clientProjectChartRef, 'Client Project Comparison')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Bar 
            ref={clientProjectChartRef}
            data={clientProjectData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'clientProject'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(context.parsed.y);
                      return `${context.dataset.label}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Project vs Associate Comparison */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaBalanceScale /> Project vs Associate Analysis
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(projectAssociateChartRef, 'Project Associate Comparison')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Bar 
            ref={projectAssociateChartRef}
            data={projectAssociateData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'projectAssociate'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      if (context.dataset.label.includes('Hours')) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                      } else {
                        const value = new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(context.parsed.y);
                        return `${context.dataset.label}: ${value}`;
                      }
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Client vs Associate Comparison */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaExchangeAlt /> Client vs Associate Analysis
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(clientAssociateChartRef, 'Client Associate Comparison')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Bar 
            ref={clientAssociateChartRef}
            data={clientAssociateData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'clientAssociate'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(context.parsed.y);
                      return `${context.dataset.label}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Revenue vs Cost vs Profit */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartLine /> Revenue vs Cost vs Profit
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(revenueCostProfitChartRef, 'Revenue Cost Profit')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Bar 
            ref={revenueCostProfitChartRef}
            data={revenueCostProfitData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'revenueCostProfit'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(context.parsed.y);
                      return `${context.dataset.label}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Planned vs Actual Percentage */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaBalanceScale /> Planned vs Actual Percentage
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(plannedActualChartRef, 'Planned vs Actual')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Line 
            ref={plannedActualChartRef}
            data={plannedActualData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'plannedActual'),
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  min: 0,
                  max: 100,
                  ticks: {
                    ...chartOptions.scales.y.ticks,
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              },
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.parsed.y}%`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Payments vs Expenses Per Month */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartLine /> Payments vs Expenses Per Month
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(paymentsExpensesChartRef, 'Payments vs Expenses')}
              title="Export Chart"
            >
              <FaDownload />
            </button>
            <button 
              className="chart-action"
              title="Expand Chart"
            >
              <FaExpand />
            </button>
          </div>
        </div>
        <div className="chart-content">
          <Bar 
            ref={paymentsExpensesChartRef}
            data={paymentsExpensesData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'paymentsExpenses'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(context.parsed.y);
                      return `${context.dataset.label}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CrossComparisonGraphs;
