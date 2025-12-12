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
import { Line, Bar, Pie } from 'react-chartjs-2';
import { FaDownload, FaExpand, FaUsers, FaDollarSign, FaChartPie } from 'react-icons/fa';

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

const ClientGraphs = ({ data, onExport, onDrillDown }) => {
  const growthChartRef = useRef(null);
  const billingChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const profitChartRef = useRef(null);

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
        borderColor: '#3498db',
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
        borderColor: '#3498db',
        borderWidth: 1,
        cornerRadius: 6
      }
    }
  };

  // Client Growth Data
  const growthData = {
    labels: data.growth?.labels || [],
    datasets: [
      {
        label: 'New Clients',
        data: data.growth?.newClients || [],
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
        label: 'Total Clients',
        data: data.growth?.totalClients || [],
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Client Billing Data
  const billingData = {
    labels: data.billing?.labels || [],
    datasets: [
      {
        label: 'Total Invoiced',
        data: data.billing?.invoiced || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Amount Paid',
        data: data.billing?.paid || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2
      },
      {
        label: 'Amount Pending',
        data: data.billing?.pending || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      }
    ]
  };

  // Active vs Inactive Clients
  const statusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [data.status?.active || 0, data.status?.inactive || 0],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderColor: ['#27ae60', '#c0392b'],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Client Profit Contribution
  const profitData = {
    labels: data.profit?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: data.profit?.revenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: data.profit?.expenses || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      },
      {
        label: 'Profit',
        data: data.profit?.profit || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2
      }
    ]
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = event.chart.data.labels[element.index];
      onDrillDown('client', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Client Growth Over Time */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaUsers /> Client Growth Over Time
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(growthChartRef, 'Client Growth')}
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
            ref={growthChartRef}
            data={growthData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'growth')
            }}
          />
        </div>
      </div>

      {/* Client Billing Comparison */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaDollarSign /> Client Billing Comparison
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(billingChartRef, 'Client Billing')}
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
            ref={billingChartRef}
            data={billingData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'billing')
            }}
          />
        </div>
      </div>

      {/* Active vs Inactive Clients */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartPie /> Client Status Distribution
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(statusChartRef, 'Client Status')}
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
            ref={statusChartRef}
            data={statusData}
            options={{
              ...pieOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'status')
            }}
          />
        </div>
      </div>

      {/* Client Profit Contribution */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaDollarSign /> Client-wise Profit Contribution
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(profitChartRef, 'Client Profit')}
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
            ref={profitChartRef}
            data={profitData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'profit'),
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

export default ClientGraphs;