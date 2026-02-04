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
import { FaDownload, FaExpand, FaProjectDiagram, FaCalendarAlt, FaChartPie } from 'react-icons/fa';

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

const ProjectGraphs = ({ data, onExport, onDrillDown }) => {
  const creationChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const budgetChartRef = useRef(null);
  const workloadChartRef = useRef(null);

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
        borderColor: '#f39c12',
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
        borderColor: '#f39c12',
        borderWidth: 1,
        cornerRadius: 6
      }
    }
  };

  // Projects Created Per Month
  const creationData = {
    labels: data.creation?.labels || [],
    datasets: [
      {
        label: 'Projects Created',
        data: data.creation?.projects || [],
        backgroundColor: 'rgba(243, 156, 18, 0.8)',
        borderColor: '#f39c12',
        borderWidth: 2
      }
    ]
  };

  // Project Status Distribution
  const statusData = {
    labels: ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'],
    datasets: [
      {
        data: [
          data.status?.planning || 0,
          data.status?.inProgress || 0,
          data.status?.review || 0,
          data.status?.completed || 0,
          data.status?.onHold || 0,
          data.status?.cancelled || 0
        ],
        backgroundColor: [
          '#3498db',
          '#f39c12',
          '#9b59b6',
          '#2ecc71',
          '#95a5a6',
          '#e74c3c'
        ],
        borderColor: [
          '#2980b9',
          '#e67e22',
          '#8e44ad',
          '#27ae60',
          '#7f8c8d',
          '#c0392b'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Budget vs Actual Expense
  const budgetData = {
    labels: data.budget?.labels || [],
    datasets: [
      {
        label: 'Budgeted Amount',
        data: data.budget?.budgeted || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#3498db',
        borderWidth: 2
      },
      {
        label: 'Actual Expense',
        data: data.budget?.actual || [],
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#e74c3c',
        borderWidth: 2
      }
    ]
  };

  // Workload Distribution
  const workloadData = {
    labels: data.workload?.labels || [],
    datasets: [
      {
        label: 'Hours Allocated',
        data: data.workload?.allocated || [],
        backgroundColor: 'rgba(243, 156, 18, 0.8)',
        borderColor: '#f39c12',
        borderWidth: 2
      },
      {
        label: 'Hours Completed',
        data: data.workload?.completed || [],
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
      onDrillDown('project', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Projects Created Per Month */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaCalendarAlt /> Projects Created Per Month
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(creationChartRef, 'Project Creation')}
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
            ref={creationChartRef}
            data={creationData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'creation')
            }}
          />
        </div>
      </div>

      {/* Project Status Distribution */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaChartPie /> Project Status Distribution
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(statusChartRef, 'Project Status')}
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

      {/* Budget vs Actual Expense */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaProjectDiagram /> Budget vs Actual Expense
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(budgetChartRef, 'Budget Analysis')}
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
            ref={budgetChartRef}
            data={budgetData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'budget'),
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

      {/* Workload Distribution */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaProjectDiagram /> Workload Distribution
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(workloadChartRef, 'Workload Distribution')}
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
            ref={workloadChartRef}
            data={workloadData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'workload'),
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.parsed.y} hours`;
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

export default ProjectGraphs;