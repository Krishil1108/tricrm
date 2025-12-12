import React, { useState, useRef, useEffect } from 'react';
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
import { FaChartBar, FaChartLine, FaChartPie, FaSync, FaDownload } from 'react-icons/fa';

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
    timeRange: 'month'
  });
  
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef(null);

  const xAxisOptions = [
    { value: 'client', label: 'Client', icon: '👥' },
    { value: 'associate', label: 'Associate', icon: '👤' },
    { value: 'project', label: 'Project', icon: '📁' },
    { value: 'month', label: 'Month', icon: '📅' },
    { value: 'quarter', label: 'Quarter', icon: '📊' },
    { value: 'year', label: 'Year', icon: '🗓️' },
    { value: 'status', label: 'Status', icon: '🔄' },
    { value: 'category', label: 'Category', icon: '🏷️' }
  ];

  const yAxisOptions = [
    { value: 'revenue', label: 'Total Revenue', icon: '💰' },
    { value: 'expenses', label: 'Total Expenses', icon: '💸' },
    { value: 'profit', label: 'Net Profit', icon: '📈' },
    { value: 'count', label: 'Count', icon: '🔢' },
    { value: 'paid_amount', label: 'Amount Paid', icon: '✅' },
    { value: 'pending_amount', label: 'Amount Pending', icon: '⏳' },
    { value: 'project_count', label: 'Project Count', icon: '📁' },
    { value: 'completion_rate', label: 'Completion Rate', icon: '📊' },
    { value: 'average_value', label: 'Average Value', icon: '📏' }
  ];

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: <FaChartBar />, component: Bar },
    { value: 'line', label: 'Line Chart', icon: <FaChartLine />, component: Line },
    { value: 'pie', label: 'Pie Chart', icon: <FaChartPie />, component: Pie },
    { value: 'doughnut', label: 'Doughnut Chart', icon: <FaChartPie />, component: Doughnut }
  ];

  const aggregationOptions = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'max', label: 'Maximum' },
    { value: 'min', label: 'Minimum' }
  ];

  const timeRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];

  const generateChart = async () => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) {
      setError('Please select both X-axis and Y-axis options');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        aggregation: chartConfig.aggregation,
        timeRange: chartConfig.timeRange
      });

      const response = await fetch(`${apiBaseUrl}/analytics/interactive-chart?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to generate chart: ${response.status}`);
      }

      const data = await response.json();
      
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${yAxisOptions.find(opt => opt.value === chartConfig.yAxis)?.label || chartConfig.yAxis} by ${xAxisOptions.find(opt => opt.value === chartConfig.xAxis)?.label || chartConfig.xAxis}`,
      },
    },
    scales: chartConfig.chartType !== 'pie' && chartConfig.chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
      },
    } : {},
  };

  const SelectedChartComponent = chartTypes.find(type => type.value === chartConfig.chartType)?.component || Bar;

  return (
    <div className="interactive-chart-builder">
      <div className="chart-builder-header">
        <h2>📊 Interactive Chart Builder</h2>
        <p>Create custom analytics charts by selecting your preferred data dimensions and visualization type.</p>
      </div>

      <div className="chart-controls">
        <div className="control-section">
          <h3>📐 Chart Configuration</h3>
          <div className="controls-grid">
            {/* X-Axis Selection */}
            <div className="control-group">
              <label>
                <span className="control-label">📊 X-Axis (Categories)</span>
              </label>
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
            </div>

            {/* Y-Axis Selection */}
            <div className="control-group">
              <label>
                <span className="control-label">📈 Y-Axis (Values)</span>
              </label>
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
            </div>

            {/* Chart Type Selection */}
            <div className="control-group">
              <label>
                <span className="control-label">📋 Chart Type</span>
              </label>
              <select
                value={chartConfig.chartType}
                onChange={(e) => setChartConfig(prev => ({ ...prev, chartType: e.target.value }))}
                className="control-select"
              >
                {chartTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation Method */}
            <div className="control-group">
              <label>
                <span className="control-label">🔢 Aggregation</span>
              </label>
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
            </div>

            {/* Time Range */}
            <div className="control-group">
              <label>
                <span className="control-label">📅 Time Range</span>
              </label>
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

            {/* Generate Button */}
            <div className="control-group">
              <button
                onClick={generateChart}
                disabled={loading || !chartConfig.xAxis || !chartConfig.yAxis}
                className="generate-btn"
              >
                <FaSync className={loading ? 'spinning' : ''} />
                {loading ? 'Generating...' : 'Generate Chart'}
              </button>
            </div>
          </div>
        </div>

        {/* Chart Type Buttons */}
        <div className="chart-type-buttons">
          <h4>🎨 Quick Chart Types</h4>
          <div className="type-buttons-grid">
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
        </div>
      </div>

      {error && (
        <div className="chart-error">
          <p>❌ {error}</p>
        </div>
      )}

      {chartData && (
        <div className="generated-chart">
          <div className="chart-header">
            <h3>📊 Generated Chart</h3>
            <div className="chart-actions">
              <button onClick={exportChart} className="export-btn">
                <FaDownload /> Export Chart
              </button>
              <button onClick={generateChart} className="refresh-btn">
                <FaSync /> Refresh Data
              </button>
            </div>
          </div>
          <div className="chart-display">
            <SelectedChartComponent
              ref={chartRef}
              data={chartData}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {!chartData && !loading && (
        <div className="chart-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">📊</div>
            <h3>Ready to Create Your Chart</h3>
            <p>Select your X-axis, Y-axis, and chart type above, then click "Generate Chart" to visualize your data.</p>
            <div className="example-configs">
              <h4>💡 Popular Chart Ideas:</h4>
              <ul>
                <li><strong>Revenue by Client:</strong> X: Client, Y: Revenue, Type: Bar</li>
                <li><strong>Project Trends:</strong> X: Month, Y: Project Count, Type: Line</li>
                <li><strong>Expense Distribution:</strong> X: Category, Y: Expenses, Type: Pie</li>
                <li><strong>Associate Performance:</strong> X: Associate, Y: Completion Rate, Type: Bar</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChartBuilder;