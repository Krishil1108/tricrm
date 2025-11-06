import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Histogram,
  ComposedChart,
  Column
} from 'recharts';
import { format } from 'date-fns';

const ClientReports = ({ data, graphType, dateRange }) => {
  
  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  // Prepare data for different chart types
  const prepareTimelineData = () => {
    if (!data?.timeline) return [];
    
    return data.timeline.map(item => ({
      ...item,
      year: new Date(item.date).getFullYear(),
      month: format(new Date(item.date), 'MMM yyyy'),
      clients: item.count || item.clients || 0
    }));
  };

  const prepareTypeDistribution = () => {
    if (!data?.typeDistribution || !Array.isArray(data.typeDistribution)) {
      // Return default data structure if no data available
      return [
        { name: 'Individual', value: 0, count: 0, type: 'Individual', color: COLORS[0] },
        { name: 'Business', value: 0, count: 0, type: 'Business', color: COLORS[1] }
      ];
    }
    
    return data.typeDistribution.map((item, index) => ({
      ...item,
      name: item.type || item.name, // Ensure proper legend field
      value: item.count || 0, // Add value field for better compatibility
      count: item.count || 0,
      color: COLORS[index % COLORS.length]
    }));
  };

  const prepareHistogramData = () => {
    if (!data?.histogram) return [];
    
    return data.histogram.map(item => ({
      range: item.range,
      count: item.count,
      fill: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  };

  const renderPieChart = () => {
    const pieData = prepareTypeDistribution();
    
    return (
      <div className="chart-container">
        <h3>Client Distribution by Type</h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Clients']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = () => {
    const barData = prepareTimelineData();
    
    return (
      <div className="chart-container">
        <h3>Client Acquisition by Year</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [value, 'New Clients']}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            <Bar dataKey="clients" fill="#0088FE" name="New Clients" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    const lineData = prepareTimelineData();
    
    // Ensure we have meaningful data for the chart
    const hasData = lineData && lineData.length > 0;
    const maxClients = hasData ? Math.max(...lineData.map(d => d.clients)) : 0;
    const minClients = hasData ? Math.min(...lineData.map(d => d.clients)) : 0;
    
    return (
      <div className="chart-container">
        <h3>Client Growth Trend (Last 10 Years)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={lineData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year"
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
              domain={hasData ? [Math.max(0, minClients - 1), maxClients + 1] : [0, 10]}
              allowDecimals={false}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} clients`, name]}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="clients" 
              stroke="#00C49F" 
              strokeWidth={3}
              dot={{ fill: '#00C49F', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#00C49F', strokeWidth: 2 }}
              name="Total Clients"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHistogram = () => {
    const histData = prepareHistogramData();
    
    return (
      <div className="chart-container">
        <h3>Client Distribution Analysis</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={histData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [value, 'Clients']}
            />
            <Legend />
            <Bar dataKey="count" fill="#FFBB28" name="Client Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderColumnChart = () => {
    const columnData = prepareTimelineData();
    
    return (
      <div className="chart-container">
        <h3>Year-over-Year Client Comparison</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={columnData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            <Bar dataKey="clients" fill="#FF8042" name="Total Clients" />
            <Line 
              type="monotone" 
              dataKey="clients" 
              stroke="#8884D8" 
              strokeWidth={2}
              name="Trend Line"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderChart = () => {
    switch (graphType) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'histogram':
        return renderHistogram();
      case 'column':
        return renderColumnChart();
      default:
        return renderLineChart();
    }
  };

  // Show message if no data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">📊</div>
        <h3>No Client Data Available</h3>
        <p>No client data found for the selected date range and filters.</p>
        <div className="date-range-info">
          <small>
            Selected Range: {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
          </small>
        </div>
      </div>
    );
  }

  // Helper function to format metrics with conditional display
  const formatMetric = (value, fallback = 'No data', isNumeric = true) => {
    if (value === null || value === undefined || value === 0 && !isNumeric) {
      return fallback;
    }
    return isNumeric ? value.toLocaleString() : value;
  };

  // Check if we have meaningful data
  const hasData = data && Object.keys(data).length > 0 && data.totalClients > 0;

  return (
    <div className="client-reports">
      <div className="reports-header">
        <h2>Client Analytics</h2>
        <div className="date-range-display">
          <span>📅 {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}</span>
        </div>
      </div>
      
      {renderChart()}
      
      {/* Enhanced Key Insights */}
      <div className="chart-insights">
        <div className="insight-card">
          <h4>Key Insights</h4>
          <ul>
            <li className={!hasData ? 'metric-inactive' : ''}>
              Total clients in period: <strong>{formatMetric(data.totalClients, '0')}</strong>
            </li>
            <li className={!hasData || !data.activeClients ? 'metric-inactive' : ''}>
              Active clients: <strong>{formatMetric(data.activeClients, 'No active clients')}</strong>
            </li>
            <li className={!hasData ? 'metric-inactive' : ''}>
              Growth rate: <strong>{data.growthRate || 'No growth data'}</strong>
            </li>
            <li className={!hasData || !data.mostCommonType || data.mostCommonType === 'No data' ? 'metric-inactive' : ''}>
              Most common type: <strong>{data.mostCommonType || 'No type data'}</strong>
            </li>
          </ul>
          {!hasData && (
            <div className="no-data-notice">
              <p><em>Add some clients to see detailed analytics and insights.</em></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientReports;