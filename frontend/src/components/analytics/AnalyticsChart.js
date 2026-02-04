import React, { useState, useEffect, useMemo, useRef } from 'react';
import './AnalyticsChart.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const colorPalette = [
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 205, 86, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(99, 255, 132, 0.8)',
  'rgba(235, 64, 52, 0.8)'
];

const formatInputDate = (d) => d.toISOString().slice(0, 10);
const formatLabel = (iso, groupBy = 'month') => {
  const date = new Date(iso);
  if (groupBy === 'day') {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else if (groupBy === 'year') {
    return date.getFullYear().toString();
  }
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const AnalyticsChart = ({ 
  chartType = 'clients', 
  token, 
  apiBaseUrl 
}) => {
  // Set initial date range based on chart type
  const getInitialDateRange = () => {
    const now = new Date();
    if (chartType === 'revenue') {
      // For revenue, show all-time data by default (last 5 years or from beginning)
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(now.getFullYear() - 5);
      return {
        from: '',  // Empty string means no filter (all data)
        to: formatInputDate(now),
        preset: 'all'
      };
    } else {
      // For other charts, show last 12 months
      const dt = new Date();
      dt.setMonth(dt.getMonth() - 11);
      return {
        from: formatInputDate(dt),
        to: formatInputDate(now),
        preset: '12m'
      };
    }
  };

  const initialRange = getInitialDateRange();

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [groupBy, setGroupBy] = useState(chartType === 'revenue' ? 'year' : 'month');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [refreshMs, setRefreshMs] = useState(30000);
  const [preset, setPreset] = useState(initialRange.preset);
  const [meta, setMeta] = useState({ total: 0 });
  const [visualType, setVisualType] = useState('bar');
  const chartRef = useRef(null);

  // Chart configuration based on type
  const chartConfig = useMemo(() => {
    switch (chartType) {
      case 'clients':
        return {
          title: '📊 Client Growth Analytics',
          endpoint: '/analytics/clients/monthly',
          description: 'Track new client acquisition over time',
          dataLabel: 'New Clients',
          showGroupBy: true,
          allowedVisuals: ['bar', 'line'],
          defaultVisual: 'bar'
        };
      case 'projects':
        return {
          title: '📁 Project Analytics',
          endpoint: '/analytics/projects/analytics',
          description: 'Analyze projects by status, client, or timeline',
          dataLabel: 'Projects',
          showGroupBy: true,
          allowedVisuals: ['bar', 'line', 'pie', 'doughnut'],
          defaultVisual: 'bar',
          groupByOptions: ['status', 'client', 'day', 'week', 'month', 'quarter', 'year']
        };
      case 'revenue':
        return {
          title: '💰 Revenue Analytics',
          endpoint: '/analytics/revenue/analytics',
          description: 'Monitor revenue trends based on payment dates',
          dataLabel: 'Revenue',
          showGroupBy: true,
          allowedVisuals: ['bar', 'line'],
          defaultVisual: 'bar',
          isCurrency: true
        };
      case 'associates':
        return {
          title: '👥 Associate Performance',
          endpoint: '/analytics/associates/performance',
          description: 'Track associate allocations and project involvement',
          dataLabel: 'Total Allocation',
          showGroupBy: false,
          allowedVisuals: ['bar', 'doughnut'],
          defaultVisual: 'bar',
          isCurrency: true
        };
      case 'payments':
        return {
          title: '💳 Payment Analytics',
          endpoint: '/analytics/payments/analytics',
          description: 'Payment status breakdown',
          dataLabel: 'Amount',
          showGroupBy: false,
          allowedVisuals: ['pie', 'doughnut', 'bar'],
          defaultVisual: 'doughnut',
          isCurrency: true
        };
      default:
        return {
          title: '📈 Analytics',
          endpoint: '/analytics/clients/monthly',
          dataLabel: 'Data',
          showGroupBy: true,
          allowedVisuals: ['bar'],
          defaultVisual: 'bar'
        };
    }
  }, [chartType]);

  useEffect(() => {
    setVisualType(chartConfig.defaultVisual);
  }, [chartConfig.defaultVisual]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (chartConfig.showGroupBy) params.append('groupBy', groupBy);
      // Only add from/to if they have values (empty string means fetch all data)
      if (from && from.trim()) params.append('from', from);
      if (to && to.trim()) params.append('to', to);

      const url = `${apiBaseUrl}${chartConfig.endpoint}?${params.toString()}`;
      console.log('📊 Fetching analytics:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load analytics (${res.status})`);
      }
      
      const data = await res.json();
      console.log('📊 Analytics data received:', data);

      if (!data.labels || !data.values) {
        throw new Error('Invalid data structure received from server');
      }

      const labels = (chartType === 'clients' || chartType === 'revenue' || (chartType === 'projects' && groupBy !== 'status' && groupBy !== 'client'))
        ? (data.labels || []).map(l => formatLabel(l, groupBy))
        : (data.labels || []);

      const colors = labels.map((_, idx) => colorPalette[idx % colorPalette.length]);

      setChartData({
        labels,
        datasets: [
          {
            label: chartConfig.dataLabel,
            data: data.values || [],
            backgroundColor: colors,
            borderColor: colors.map((c) => c.replace('0.8', '1')),
            borderWidth: visualType === 'line' ? 2 : 1,
            fill: visualType === 'line' ? false : true,
            tension: 0.4
          }
        ]
      });

      setMeta({
        total: data.total || 0,
        groupBy: data.groupBy || groupBy,
        from: data.from || from,
        to: data.to || to,
        extra: data.counts || data.projectCounts || data.percentages
      });

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy, chartType]);

  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => {
      fetchData();
    }, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, refreshMs, from, to, groupBy, chartType]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: visualType === 'pie' || visualType === 'doughnut' ? 'right' : 'top',
        labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed || 0;
            if (chartConfig.isCurrency) {
              return `${label}: ₹${value.toLocaleString('en-IN')}`;
            }
            return `${label}: ${value.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: visualType !== 'pie' && visualType !== 'doughnut' ? {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            if (chartConfig.isCurrency) {
              return '₹' + value.toLocaleString('en-IN');
            }
            return value.toLocaleString('en-IN');
          }
        }
      }
    } : undefined
  }), [visualType, chartConfig.isCurrency]);

  const applyPreset = (value) => {
    const now = new Date();
    let nextFrom = '';
    const nextTo = formatInputDate(now);

    switch (value) {
      case '3m': {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        nextFrom = formatInputDate(d);
        break;
      }
      case '6m': {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        nextFrom = formatInputDate(d);
        break;
      }
      case '12m': {
        const d = new Date();
        d.setMonth(d.getMonth() - 11);
        nextFrom = formatInputDate(d);
        break;
      }
      case 'ytd': {
        const d = new Date(now.getFullYear(), 0, 1);
        nextFrom = formatInputDate(d);
        break;
      }
      case 'all':
      default:
        nextFrom = '';  // Empty string to fetch all data
    }

    setPreset(value);
    setFrom(nextFrom);
    setTo(nextTo);
    
    // Auto-adjust groupBy based on date range for better visualization
    if (value === 'all') {
      setGroupBy('year');
    } else if (value === '12m' || value === 'ytd') {
      setGroupBy('month');
    }
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut
  }[visualType] || Bar;

  return (
    <div className="analytics-chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{chartConfig.title}</h3>
          <p className="chart-description">{chartConfig.description}</p>
        </div>
        <div className="visual-type-selector">
          {chartConfig.allowedVisuals.map(type => (
            <button
              key={type}
              className={`visual-btn ${visualType === type ? 'active' : ''}`}
              onClick={() => setVisualType(type)}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              {type === 'bar' && '📊'}
              {type === 'line' && '📈'}
              {type === 'pie' && '🥧'}
              {type === 'doughnut' && '🍩'}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-controls-compact">
        <div className="controls-row">
          {chartConfig.showGroupBy && (
            <>
              <div className="control-group-inline">
                <label>Quick Range</label>
                <select value={preset} onChange={(e) => applyPreset(e.target.value)} className="control-input-sm">
                  <option value="3m">3M</option>
                  <option value="6m">6M</option>
                  <option value="12m">12M</option>
                  <option value="ytd">YTD</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="control-group-inline">
                <label>From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="control-input-sm" />
              </div>
              <div className="control-group-inline">
                <label>To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="control-input-sm" />
              </div>
              <div className="control-group-inline">
                <label>Group</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="control-input-sm">
                  {chartConfig.groupByOptions ? (
                    chartConfig.groupByOptions.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))
                  ) : (
                    <>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="quarter">Quarter</option>
                      <option value="year">Year</option>
                    </>
                  )}
                </select>
              </div>
            </>
          )}
          <div className="control-group-inline">
            <button className="btn-refresh-sm" onClick={fetchData} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
            <label className="live-toggle-sm">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
              <span>Live</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="chart-error-sm">
          ❌ {error}
        </div>
      )}

      <div className="chart-display-compact">
        <div className="chart-meta-sm">
          <span className="meta-badge">
            Total: <strong>{chartConfig.isCurrency ? `₹${meta.total.toLocaleString('en-IN')}` : meta.total.toLocaleString('en-IN')}</strong>
          </span>
          {meta.groupBy && <span className="meta-badge">Grouping: <strong>{meta.groupBy}</strong></span>}
        </div>
        {chartData && !error ? (
          <div className="chart-container-sm">
            <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="chart-placeholder-sm">
            <p>{loading ? 'Loading...' : 'No data available'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;
