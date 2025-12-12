import React, { useState, useRef, useEffect } from 'react';
import './InteractiveChartBuilder.css';
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaChartBar, FaChartLine, FaChartPie, FaSync, FaDownload, FaImage, FaCog } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const InteractiveChartBuilder = ({ dashboardData, token, apiBaseUrl }) => {
  const [chartConfig, setChartConfig] = useState({
    xAxis: '',
    yAxis: '',
    chartType: 'bar',
    aggregation: 'sum',
    timeRange: 'month',
    usePython: false
  });
  
  const [chartData, setChartData] = useState(null);
  const [pythonImage, setPythonImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quick');
  const chartRef = useRef(null);

  // Streamlined Essential Options Only
  const xAxisOptions = [
    { value: 'client', label: 'Clients', icon: '👥', desc: 'Analysis by client' },
    { value: 'associate', label: 'Associates', icon: '👤', desc: 'Associate performance' },
    { value: 'project', label: 'Projects', icon: '📁', desc: 'Project metrics' },
    { value: 'month', label: 'Monthly Trend', icon: '📅', desc: 'Time series analysis' },
    { value: 'status', label: 'Status', icon: '🔄', desc: 'Status distribution' }
  ];

  const yAxisOptions = [
    { value: 'revenue', label: 'Revenue', icon: '💰', desc: 'Total revenue generated' },
    { value: 'project_count', label: 'Project Count', icon: '📁', desc: 'Number of projects' },
    { value: 'paid_amount', label: 'Amount Paid', icon: '✅', desc: 'Payments received' },
    { value: 'pending_amount', label: 'Amount Pending', icon: '⏳', desc: 'Outstanding payments' },
    { value: 'completion_rate', label: 'Completion Rate', icon: '📊', desc: 'Project completion %' }
  ];

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: <FaChartBar />, component: Bar, desc: 'Compare categories' },
    { value: 'line', label: 'Line Chart', icon: <FaChartLine />, component: Line, desc: 'Track trends over time' },
    { value: 'pie', label: 'Pie Chart', icon: <FaChartPie />, component: Pie, desc: 'Show proportions' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: <FaChartPie />, component: Doughnut, desc: 'Modern pie chart' }
  ];

  const aggregationOptions = [
    { value: 'sum', label: 'Total', desc: 'Sum all values' },
    { value: 'avg', label: 'Average', desc: 'Calculate mean' },
    { value: 'count', label: 'Count', desc: 'Count items' }
  ];

  const timeRangeOptions = [
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Quick Chart Presets for Common Analytics
  const quickChartPresets = [
    {
      name: 'Revenue by Client',
      icon: '💰',
      config: { xAxis: 'client', yAxis: 'revenue', chartType: 'bar', aggregation: 'sum' },
      description: 'See which clients generate the most revenue'
    },
    {
      name: 'Monthly Revenue Trend',
      icon: '📈',
      config: { xAxis: 'month', yAxis: 'revenue', chartType: 'line', aggregation: 'sum' },
      description: 'Track revenue growth over time'
    },
    {
      name: 'Project Status Distribution',
      icon: '📊',
      config: { xAxis: 'status', yAxis: 'project_count', chartType: 'pie', aggregation: 'count' },
      description: 'Visual breakdown of project statuses'
    },
    {
      name: 'Associate Performance',
      icon: '👤',
      config: { xAxis: 'associate', yAxis: 'project_count', chartType: 'bar', aggregation: 'count' },
      description: 'Compare associate productivity'
    },
    {
      name: 'Payment Status Overview',
      icon: '💳',
      config: { xAxis: 'status', yAxis: 'paid_amount', chartType: 'doughnut', aggregation: 'sum' },
      description: 'Track payment collection status'
    }
  ];

  const generateChart = async (useAdvanced = false) => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) {
      setError('Please select both X-axis and Y-axis options');
      return;
    }

    setLoading(true);
    setError('');
    setPythonImage(null);

    try {
      const queryParams = new URLSearchParams({
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        aggregation: chartConfig.aggregation,
        timeRange: chartConfig.timeRange,
        chartType: chartConfig.chartType
      });

      if (useAdvanced) {
        queryParams.append('usePython', 'true');
      }

      const endpoint = useAdvanced ? 'advanced-chart' : 'interactive-chart';
      const response = await fetch(`${apiBaseUrl}/analytics/${endpoint}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to generate chart: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle Python-generated image
      if (data.image && data.generatedWith === 'python') {
        setPythonImage(data.image);
        setChartData(null);
      } else {
        // Handle JavaScript Chart.js data
        const colors = generateColors(data.labels.length);
        
        const formattedData = {
          labels: data.labels,
          datasets: [{
            label: `${yAxisOptions.find(opt => opt.value === chartConfig.yAxis)?.label || chartConfig.yAxis}`,
            data: data.values,
            backgroundColor: chartConfig.chartType === 'line' ? 'rgba(75, 192, 192, 0.2)' : colors.background,
            borderColor: chartConfig.chartType === 'line' ? 'rgba(75, 192, 192, 1)' : colors.border,
            borderWidth: 2,
            fill: chartConfig.chartType === 'line'
          }]
        };

        setChartData(formattedData);
        setPythonImage(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Chart Preset Handler
  const applyQuickChart = (preset) => {
    setChartConfig(prevConfig => ({
      ...prevConfig,
      ...preset.config
    }));
    // Auto-generate chart after applying preset
    setTimeout(() => {
      const newConfig = { ...chartConfig, ...preset.config };
      generateChart();
    }, 100);
  };

  const generateColors = (count) => {
    const colorPalette = [
      'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)', 'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)'
    ];
    
    const borderColors = colorPalette.map(color => color.replace('0.8', '1'));
    
    return {
      background: colorPalette.slice(0, count),
      border: borderColors.slice(0, count)
    };
  };

  const exportChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `chart-${chartConfig.xAxis}-vs-${chartConfig.yAxis}.png`;
      link.href = url;
      link.click();
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `${yAxisOptions.find(opt => opt.value === chartConfig.yAxis)?.label || chartConfig.yAxis} by ${xAxisOptions.find(opt => opt.value === chartConfig.xAxis)?.label || chartConfig.xAxis}`,
        font: {
          size: 14
        }
      },
    },
    scales: chartConfig.chartType !== 'pie' && chartConfig.chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
      },
    } : {},
    // Specific sizing for pie/doughnut charts
    ...(chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut' ? {
      layout: {
        padding: 10
      }
    } : {})
  };

  const SelectedChartComponent = chartTypes.find(type => type.value === chartConfig.chartType)?.component || Bar;

  return (
    <div className="interactive-chart-builder">
      <div className="chart-builder-header">
        <h2>📊 Essential Analytics Dashboard</h2>
        <p>Streamlined analytics with only the essential charts you need for business insights.</p>
      </div>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          ⚡ Quick Charts
        </button>
        <button 
          className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          🛠️ Custom Builder
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          🔬 Advanced (Python)
        </button>
      </div>

      {/* Quick Charts Section */}
      {activeTab === 'quick' && (
        <div className="quick-charts-section">
          <h3>⚡ Quick Analytics</h3>
          <p>Pre-configured charts for common business analytics. Click any card to generate instantly.</p>
          <div className="quick-charts-grid">
            {quickChartPresets.map((preset, index) => (
              <div 
                key={index} 
                className="quick-chart-card"
                onClick={() => applyQuickChart(preset)}
              >
                <div className="quick-chart-icon">{preset.icon}</div>
                <h4>{preset.name}</h4>
                <p>{preset.description}</p>
                <div className="chart-config-preview">
                  {preset.config.xAxis} → {preset.config.yAxis} ({preset.config.chartType})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Builder Section */}
      {activeTab === 'custom' && (
        <div className="custom-builder-section">
          <h3>🛠️ Custom Chart Builder</h3>
          <div className="controls-grid">{/* Custom builder controls go here */}</div>
        </div>
      )}

      {/* Advanced Python Section */}
      {activeTab === 'advanced' && (
        <div className="advanced-section">
          <h3>🔬 Advanced Python Charts</h3>
          <p>High-quality chart generation with advanced styling and statistical insights.</p>
          <div className="controls-grid">{/* Advanced controls go here */}</div>
        </div>
      )}

      <div className="chart-controls">
        <div className="control-section">
          <h3>📐 Chart Configuration</h3>
          <div className="controls-grid">{/* Rest of controls go here */}</div>
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="chart-display-area">
        {pythonImage ? (
          <div className="python-chart-container">
            <img src={pythonImage} alt="Python Generated Chart" className="python-chart-image" />
            <div className="chart-info">
              <span className="generation-badge python">🐍 Generated with Python</span>
            </div>
          </div>
        ) : chartData ? (
          <div className={`chart-container ${chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut' ? 'pie-chart-container' : ''}`}>
            <SelectedChartComponent ref={chartRef} data={chartData} options={chartOptions} />
            <div className="chart-info">
              <span className="generation-badge javascript">⚛️ Interactive Chart.js</span>
            </div>
          </div>
        ) : (
          <div className="chart-placeholder">
            <div className="placeholder-content">
              <FaChartBar size={48} />
              <h3>Ready to Generate Charts</h3>
              <p>
                {activeTab === 'quick' 
                  ? 'Click any Quick Chart above to generate instantly'
                  : 'Configure your chart settings and click Generate Chart'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="chart-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={() => generateChart(false)}
          disabled={loading || !chartConfig.xAxis || !chartConfig.yAxis}
          className="generate-btn primary"
        >
          <FaSync className={loading ? 'spinning' : ''} />
          {loading ? 'Generating...' : 'Generate Chart'}
        </button>
        
        <button
          onClick={() => generateChart(true)}
          disabled={loading || !chartConfig.xAxis || !chartConfig.yAxis}
          className="generate-btn advanced"
        >
          <FaImage />
          Generate with Python
        </button>

        {(chartData || pythonImage) && (
          <button onClick={exportChart} className="export-btn">
            <FaDownload /> Export Chart
          </button>
        )}
      </div>

      {/* Controls Grid - Show for custom and advanced tabs */}
      {(activeTab === 'custom' || activeTab === 'advanced') && (
        <div className="chart-controls">
          <div className="controls-grid">
            {/* X-Axis Selection */}
            <div className="control-group">
              <label className="control-label">📊 X-Axis (Categories)</label>
              <select
                value={chartConfig.xAxis}
                onChange={(e) => setChartConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                className="control-select"
              >
                <option value="">Select X-Axis...</option>
                {xAxisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <span className="control-desc">{xAxisOptions.find(opt => opt.value === chartConfig.xAxis)?.desc}</span>
            </div>

            {/* Y-Axis Selection */}
            <div className="control-group">
              <label className="control-label">📈 Y-Axis (Values)</label>
              <select
                value={chartConfig.yAxis}
                onChange={(e) => setChartConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                className="control-select"
              >
                <option value="">Select Y-Axis...</option>
                {yAxisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <span className="control-desc">{yAxisOptions.find(opt => opt.value === chartConfig.yAxis)?.desc}</span>
            </div>

            {/* Chart Type Selection */}
            <div className="control-group">
              <label className="control-label">📋 Chart Type</label>
              <div className="chart-type-grid">
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setChartConfig(prev => ({ ...prev, chartType: type.value }))}
                    className={`chart-type-btn ${chartConfig.chartType === type.value ? 'active' : ''}`}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
              <span className="control-desc">{chartTypes.find(type => type.value === chartConfig.chartType)?.desc}</span>
            </div>

            {/* Aggregation Method */}
            <div className="control-group">
              <label className="control-label">🔢 Aggregation</label>
              <select
                value={chartConfig.aggregation}
                onChange={(e) => setChartConfig(prev => ({ ...prev, aggregation: e.target.value }))}
                className="control-select"
              >
                {aggregationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="control-desc">{aggregationOptions.find(opt => opt.value === chartConfig.aggregation)?.desc}</span>
            </div>

            {/* Time Range */}
            <div className="control-group">
              <label className="control-label">📅 Time Range</label>
              <select
                value={chartConfig.timeRange}
                onChange={(e) => setChartConfig(prev => ({ ...prev, timeRange: e.target.value }))}
                className="control-select"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChartBuilder;