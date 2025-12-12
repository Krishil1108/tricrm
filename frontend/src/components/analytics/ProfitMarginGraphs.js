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
import { FaDownload, FaExpand, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';

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

const ProfitMarginGraphs = ({ data, onExport, onDrillDown }) => {
  const projectProfitChartRef = useRef(null);
  const clientProfitChartRef = useRef(null);

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
        borderColor: '#27ae60',
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
          },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  // Project-wise Profit Data
  const projectProfitData = {
    labels: data.projectProfit?.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        data: data.projectProfit?.revenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Expenses',
        data: data.projectProfit?.expenses || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Profit %',
        data: data.projectProfit?.profitPercentage || [],
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1'
      }
    ]
  };

  // Client-wise Profitability
  const clientProfitData = {
    labels: data.clientProfitability?.labels || [],
    datasets: [
      {
        label: 'Total Revenue',
        data: data.clientProfitability?.revenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Total Expenses',
        data: data.clientProfitability?.expenses || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      },
      {
        label: 'Net Profit',
        data: data.clientProfitability?.profit || [],
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
      onDrillDown('profit', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Project-wise Profit Margin */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartLine /> Project-wise Profit Analysis
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(projectProfitChartRef, 'Project Profit')}
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
            ref={projectProfitChartRef}
            data={projectProfitData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'projectProfit'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      if (context.dataset.label === 'Profit %') {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                      } else {
                        const value = new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
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

      {/* Client-wise Profitability */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaMoneyBillWave /> Client-wise Profitability
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(clientProfitChartRef, 'Client Profitability')}
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
            ref={clientProfitChartRef}
            data={clientProfitData}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y1: {
                  display: false
                }
              },
              onClick: (event, elements) => handleChartClick(event, elements, 'clientProfitability'),
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

export default ProfitMarginGraphs;