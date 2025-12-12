import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FaDownload, FaExpand, FaCreditCard, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PaymentGraphs = ({ data, onExport, onDrillDown }) => {
  const projectPaymentsChartRef = useRef(null);
  const clientPaymentsChartRef = useRef(null);
  const associatePaymentsChartRef = useRef(null);

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
        borderColor: '#16a085',
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
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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
        borderColor: '#16a085',
        borderWidth: 1,
        cornerRadius: 6
      }
    }
  };

  // Project Payments Data
  const projectPaymentsData = {
    labels: data.projectPayments?.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Amount Paid',
        data: data.projectPayments?.paid || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Amount Pending',
        data: data.projectPayments?.pending || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Overdue Amount',
        data: data.projectPayments?.overdue || [],
        backgroundColor: 'rgba(155, 89, 182, 0.8)',
        borderColor: '#9b59b6',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Total Invoiced',
        data: data.projectPayments?.invoiced || [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1'
      }
    ]
  };

  // Client Payments Data
  const clientPaymentsData = {
    labels: ['Received', 'Outstanding'],
    datasets: [
      {
        data: [
          data.clientPayments?.received || 0,
          data.clientPayments?.outstanding || 0
        ],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderColor: ['#27ae60', '#c0392b'],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Associate Payments Data
  const associatePaymentsData = {
    labels: data.associatePayments?.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Amount Paid',
        data: data.associatePayments?.paid || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Amount Pending',
        data: data.associatePayments?.pending || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Payout Trend',
        data: data.associatePayments?.trend || [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1'
      }
    ]
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = event.chart.data.labels[element.index];
      onDrillDown('payment', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Project Payments */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaCreditCard /> Project Payments Analysis
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(projectPaymentsChartRef, 'Project Payments')}
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
            ref={projectPaymentsChartRef}
            data={projectPaymentsData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'projectPayments'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
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

      {/* Client Payments */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaMoneyBillWave /> Client Payments Overview
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(clientPaymentsChartRef, 'Client Payments')}
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
          <Pie 
            ref={clientPaymentsChartRef}
            data={clientPaymentsData}
            options={{
              ...pieOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'clientPayments'),
              plugins: {
                ...pieOptions.plugins,
                tooltip: {
                  ...pieOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(context.parsed);
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((context.parsed / total) * 100).toFixed(1);
                      return `${context.label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Associate Payments */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartLine /> Associate Payment Trends
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(associatePaymentsChartRef, 'Associate Payments')}
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
            ref={associatePaymentsChartRef}
            data={associatePaymentsData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'associatePayments'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
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

export default PaymentGraphs;