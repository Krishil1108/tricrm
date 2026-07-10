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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaDownload, FaExpand, FaUserTie, FaBriefcase, FaChartBar } from 'react-icons/fa';

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

const AssociateGraphs = ({ data, onExport, onDrillDown }) => {
  const onboardingChartRef = useRef(null);
  const allocationChartRef = useRef(null);
  const earningsChartRef = useRef(null);
  const performanceChartRef = useRef(null);

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
        borderColor: '#2ecc71',
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

  const doughnutOptions = {
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
        borderColor: '#2ecc71',
        borderWidth: 1,
        cornerRadius: 6,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    },
    cutout: '60%'
  };

  // Associate Onboarding Trend
  const onboardingData = {
    labels: data.onboarding?.labels || [],
    datasets: [
      {
        label: 'New Associates',
        data: data.onboarding?.newAssociates || [],
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Total Associates',
        data: data.onboarding?.totalAssociates || [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Work Allocation Percentage
  const allocationData = {
    labels: data.allocation?.labels || [],
    datasets: [
      {
        data: data.allocation?.values || [],
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#f39c12',
          '#e74c3c',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#e67e22'
        ],
        borderColor: [
          '#2980b9',
          '#27ae60',
          '#e67e22',
          '#c0392b',
          '#8e44ad',
          '#16a085',
          '#2c3e50',
          '#d35400'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Associate Earnings
  const earningsData = {
    labels: data.earnings?.labels || [],
    datasets: [
      {
        label: 'Amount Paid',
        data: data.earnings?.paid || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#2ecc71',
        borderWidth: 2
      },
      {
        label: 'Amount Pending',
        data: data.earnings?.pending || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      }
    ]
  };

  // Performance Index
  const performanceData = {
    labels: data.performance?.labels || [],
    datasets: [
      {
        label: 'Efficiency Score',
        data: data.performance?.efficiency || [],
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
        label: 'Quality Score',
        data: data.performance?.quality || [],
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
      },
      {
        label: 'Timeliness Score',
        data: data.performance?.timeliness || [],
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243, 156, 18, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#f39c12',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = event.chart.data.labels[element.index];
      onDrillDown('associate', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Associate Onboarding Trend */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaUserTie /> Associate Onboarding Trend
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(onboardingChartRef, 'Associate Onboarding')}
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
            ref={onboardingChartRef}
            data={onboardingData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'onboarding')
            }}
          />
        </div>
      </div>

      {/* Work Allocation Percentage */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaBriefcase /> Work Allocation Distribution
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(allocationChartRef, 'Work Allocation')}
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
          <Doughnut 
            ref={allocationChartRef}
            data={allocationData}
            options={{
              ...doughnutOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'allocation')
            }}
          />
        </div>
      </div>

      {/* Associate Earnings */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartBar /> Associate Earnings (Paid vs Pending)
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(earningsChartRef, 'Associate Earnings')}
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
            ref={earningsChartRef}
            data={earningsData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'earnings'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      const value = new Intl.NumberFormat('en-US', {
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

      {/* Performance Index */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartBar /> Performance Index
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(performanceChartRef, 'Performance Index')}
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
            ref={performanceChartRef}
            data={performanceData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'performance'),
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
    </div>
  );
};

export default AssociateGraphs;