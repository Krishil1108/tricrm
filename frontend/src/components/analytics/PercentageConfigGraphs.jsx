import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FaDownload, FaExpand, FaPercentage, FaChartBar } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PercentageConfigGraphs = ({ data, onExport, onDrillDown }) => {
  const allocationChartRef = useRef(null);

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
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0,0,0,0.05)'
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

  // Project-wise Allocation Data
  const allocationData = {
    labels: data.allocation?.labels || [],
    datasets: [
      {
        label: 'Development',
        data: data.allocation?.development || [],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 2
      },
      {
        label: 'Design',
        data: data.allocation?.design || [],
        backgroundColor: '#9b59b6',
        borderColor: '#8e44ad',
        borderWidth: 2
      },
      {
        label: 'Operations',
        data: data.allocation?.operations || [],
        backgroundColor: '#f39c12',
        borderColor: '#e67e22',
        borderWidth: 2
      },
      {
        label: 'Associate Cost',
        data: data.allocation?.associateCost || [],
        backgroundColor: '#e74c3c',
        borderColor: '#c0392b',
        borderWidth: 2
      },
      {
        label: 'Profit Margin',
        data: data.allocation?.profit || [],
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        borderWidth: 2
      }
    ]
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = event.chart.data.labels[element.index];
      onDrillDown('percentage', label, { chartType, element });
    }
  };

  return (
    <div className="chart-grid">
      {/* Project-wise Allocation Percentage */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FaPercentage /> Project-wise Allocation Percentage
          </h3>
          <div className="chart-actions">
            <button 
              className="chart-action"
              onClick={() => onExport(allocationChartRef, 'Allocation Percentage')}
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
            ref={allocationChartRef}
            data={allocationData}
            options={{
              ...chartOptions,
              onClick: (event, elements) => handleChartClick(event, elements, 'allocation')
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PercentageConfigGraphs;