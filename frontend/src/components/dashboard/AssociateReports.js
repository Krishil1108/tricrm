import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import './ClientReports.css';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

const AssociateReports = ({ data, dateRange, graphType }) => {
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || !data.associates || data.associates.length === 0) {
      return [];
    }

    return data.associates.map(associate => ({
      name: associate.name || 'Unknown',
      projects: associate.projectCount || 0,
      value: associate.projectCount || 0
    }));
  }, [data]);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="no-data-message">
          <div className="no-data-icon">📊</div>
          <h3>No Associate Data Available</h3>
          <p>Add associates to see analytics here</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (graphType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', r: 5 }}
                activeDot={{ r: 7 }}
                name="Projects"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="projects" 
                fill="#82ca9d"
                name="Projects"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="projects" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorProjects)"
                name="Projects"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  const hasData = data && data.totalAssociates > 0;

  return (
    <div className="client-reports">
      <div className="reports-header">
        <h2>Associate Analytics</h2>
        <div className="date-range-display">
          <span>📅 {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}</span>
        </div>
      </div>
      
      {renderChart()}
      
      {hasData && (
        <div className="chart-insights">
          <div className="insight-card">
            <h4>Key Insights</h4>
            <ul>
              <li>Total Associates: <strong>{data.totalAssociates}</strong></li>
              <li>Total Projects: <strong>{data.totalProjects || 0}</strong></li>
              <li>Avg Projects per Associate: <strong>{data.totalAssociates > 0 ? (data.totalProjects / data.totalAssociates).toFixed(1) : 0}</strong></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociateReports;
