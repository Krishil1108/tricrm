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
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Radar, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
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
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 3) {
      return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
    }
    return `${year - 1}-${String(year % 100).padStart(2, '0')}`;
  };

  const getFallbackFinancialYears = () => {
    const current = getCurrentFinancialYear();
    const start = Number(current.slice(0, 4));
    return [0, 1, 2, 3].map((offset) => {
      const y = start - offset;
      return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
    });
  };

  // Set initial date range based on chart type
  const getInitialDateRange = () => {
    const now = new Date();
    if (chartType === 'revenue' || chartType === 'netprofit' || chartType === 'expenses') {
      // For revenue, net profit, and expenses - show all-time data by default
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
  const [groupBy, setGroupBy] = useState((chartType === 'revenue' || chartType === 'netprofit' || chartType === 'expenses') ? 'year' : 'month');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [refreshMs, setRefreshMs] = useState(30000);
  const [preset, setPreset] = useState(initialRange.preset);
  const [meta, setMeta] = useState({ total: 0 });
  const [visualType, setVisualType] = useState('bar');
  const [expenseCategory, setExpenseCategory] = useState('all'); // For expenses chart
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [expenseComparisonRaw, setExpenseComparisonRaw] = useState(null);
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
      case 'netprofit':
        return {
          title: '📈 Net Profit Analytics',
          endpoint: '/analytics/netprofit/analytics',
          description: 'Track net profit trends over time',
          dataLabel: 'Net Profit',
          showGroupBy: true,
          allowedVisuals: ['bar', 'line'],
          defaultVisual: 'bar',
          isCurrency: true
        };
      case 'expenses':
        return {
          title: '📉 Expense Distribution',
          endpoint: '/analytics/expenses/analytics',
          description: 'Monitor expense trends and distribution',
          dataLabel: 'Total Expenses',
          showGroupBy: true,
          allowedVisuals: ['bar', 'line'],
          defaultVisual: 'bar',
          isCurrency: true
        };
      case 'expenseComparison':
        return {
          title: '📊 Estimated vs Actual Expenses',
          endpoint: '/analytics/expenses/estimated-vs-actual',
          description: 'Compare finance estimates with actual expenses by category for a financial year',
          dataLabel: 'Expense Comparison',
          showGroupBy: false,
          allowedVisuals: ['combo', 'line', 'bar', 'area', 'scatter', 'histogram', 'pie', 'doughnut', 'polarArea', 'radar'],
          defaultVisual: 'combo',
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
      // Add category for expenses chart
      if (chartType === 'expenses') params.append('category', expenseCategory);
      if (chartType === 'expenseComparison') params.append('financialYear', financialYear);

      const url = `${apiBaseUrl}${chartConfig.endpoint}?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load analytics (${res.status})`);
      }
      
      const data = await res.json();

      if (!Array.isArray(data.labels)) {
        throw new Error('Invalid data structure received from server');
      }

      const labels = (chartType === 'clients' || chartType === 'revenue' || chartType === 'netprofit' || chartType === 'expenses' || (chartType === 'projects' && groupBy !== 'status' && groupBy !== 'client'))
        ? (data.labels || []).map(l => formatLabel(l, groupBy))
        : (data.labels || []);

      const colors = labels.map((_, idx) => colorPalette[idx % colorPalette.length]);

      if (chartType === 'expenseComparison') {
        const chartLabels = Array.isArray(data.labels) ? data.labels : [];
        const estimated = Array.isArray(data.estimatedValues) ? data.estimatedValues : [];
        const actual = Array.isArray(data.actualValues) ? data.actualValues : [];

        setExpenseComparisonRaw({
          labels: chartLabels,
          estimated,
          actual
        });
        setChartData(null);

        const availableFinancialYears = Array.isArray(data.availableFinancialYears) && data.availableFinancialYears.length > 0
          ? data.availableFinancialYears
          : getFallbackFinancialYears();

        setMeta({
          total: Number(data.actualTotal || 0),
          estimatedTotal: Number(data.estimatedTotal || 0),
          actualTotal: Number(data.actualTotal || 0),
          financialYear: data.financialYear || financialYear,
          availableFinancialYears
        });
      } else {
        setChartData({
          labels,
          datasets: [
            {
              label: data.dataLabel || chartConfig.dataLabel,
              data: Array.isArray(data.values) ? data.values : [],
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
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy, chartType, expenseCategory, financialYear]);

  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => {
      fetchData();
    }, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, refreshMs, from, to, groupBy, chartType, expenseCategory, financialYear]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: visualType === 'pie' || visualType === 'doughnut' || visualType === 'polarArea' ? 'right' : 'top',
        labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed?.y ?? context.parsed?.r ?? context.parsed ?? 0;
            if (chartConfig.isCurrency) {
              return `${label}: ₹${value.toLocaleString('en-IN')}`;
            }
            return `${label}: ${value.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: visualType !== 'pie' && visualType !== 'doughnut' && visualType !== 'polarArea' && visualType !== 'radar' ? {
      x: {
        type: visualType === 'scatter' ? 'linear' : 'category',
        ticks: visualType === 'scatter' ? {
          callback: (value) => {
            if (chartType === 'expenseComparison' && expenseComparisonRaw && Array.isArray(expenseComparisonRaw.labels)) {
              return expenseComparisonRaw.labels[value] ?? value;
            }
            return value;
          }
        } : undefined
      },
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
  }), [visualType, chartConfig.isCurrency, chartType, expenseComparisonRaw]);

  const expenseComparisonChartData = useMemo(() => {
    if (chartType !== 'expenseComparison' || !expenseComparisonRaw) {
      return null;
    }

    const labels = Array.isArray(expenseComparisonRaw.labels) ? expenseComparisonRaw.labels : [];
    const estimated = Array.isArray(expenseComparisonRaw.estimated) ? expenseComparisonRaw.estimated : [];
    const actual = Array.isArray(expenseComparisonRaw.actual) ? expenseComparisonRaw.actual : [];

    const estimatedBase = {
      label: 'Estimated Expense',
      data: estimated,
      borderColor: 'rgba(37, 99, 235, 1)',
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      pointBackgroundColor: 'rgba(37, 99, 235, 1)'
    };

    const actualBase = {
      label: 'Actual Expense',
      data: actual,
      borderColor: 'rgba(220, 38, 38, 1)',
      backgroundColor: 'rgba(220, 38, 38, 0.2)',
      pointBackgroundColor: 'rgba(220, 38, 38, 1)'
    };

    if (visualType === 'combo') {
      return {
        labels,
        datasets: [
          {
            type: 'bar',
            ...estimatedBase,
            backgroundColor: 'rgba(37, 99, 235, 0.22)',
            borderWidth: 1,
            order: 2
          },
          {
            type: 'bar',
            ...actualBase,
            backgroundColor: 'rgba(220, 38, 38, 0.22)',
            borderWidth: 1,
            order: 2
          },
          {
            type: 'line',
            ...estimatedBase,
            fill: false,
            borderWidth: 3,
            tension: 0.35,
            order: 1
          },
          {
            type: 'line',
            ...actualBase,
            fill: false,
            borderWidth: 3,
            tension: 0.35,
            order: 1
          }
        ]
      };
    }

    if (visualType === 'line' || visualType === 'area') {
      const fillArea = visualType === 'area';
      return {
        labels,
        datasets: [
          {
            ...estimatedBase,
            borderWidth: 3,
            fill: fillArea,
            tension: 0.35
          },
          {
            ...actualBase,
            borderWidth: 3,
            fill: fillArea,
            tension: 0.35
          }
        ]
      };
    }

    if (visualType === 'bar' || visualType === 'histogram') {
      const histogramStyle = visualType === 'histogram';
      return {
        labels,
        datasets: [
          {
            ...estimatedBase,
            borderWidth: 1,
            categoryPercentage: histogramStyle ? 0.95 : 0.8,
            barPercentage: histogramStyle ? 1 : 0.9
          },
          {
            ...actualBase,
            borderWidth: 1,
            categoryPercentage: histogramStyle ? 0.95 : 0.8,
            barPercentage: histogramStyle ? 1 : 0.9
          }
        ]
      };
    }

    if (visualType === 'scatter') {
      return {
        datasets: [
          {
            ...estimatedBase,
            data: estimated.map((value, index) => ({ x: index, y: value })),
            showLine: false,
            pointRadius: 5
          },
          {
            ...actualBase,
            data: actual.map((value, index) => ({ x: index, y: value })),
            showLine: false,
            pointRadius: 5
          }
        ]
      };
    }

    if (visualType === 'pie' || visualType === 'doughnut' || visualType === 'polarArea') {
      return {
        labels: ['Estimated Total', 'Actual Total'],
        datasets: [
          {
            label: 'Totals',
            data: [
              estimated.reduce((sum, value) => sum + Number(value || 0), 0),
              actual.reduce((sum, value) => sum + Number(value || 0), 0)
            ],
            backgroundColor: ['rgba(37, 99, 235, 0.75)', 'rgba(220, 38, 38, 0.75)'],
            borderColor: ['rgba(37, 99, 235, 1)', 'rgba(220, 38, 38, 1)'],
            borderWidth: 1
          }
        ]
      };
    }

    if (visualType === 'radar') {
      return {
        labels,
        datasets: [
          {
            ...estimatedBase,
            fill: true,
            borderWidth: 2
          },
          {
            ...actualBase,
            fill: true,
            borderWidth: 2
          }
        ]
      };
    }

    return {
      labels,
      datasets: [estimatedBase, actualBase]
    };
  }, [chartType, visualType, expenseComparisonRaw]);

  const renderChartType = chartType === 'expenseComparison'
    ? (visualType === 'combo' || visualType === 'histogram' ? 'bar' : visualType)
    : visualType;

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
    doughnut: Doughnut,
    scatter: Scatter,
    radar: Radar,
    polarArea: PolarArea
  }[renderChartType] || Bar;

  const valueLabelPlugin = useMemo(() => ({
    id: 'expense-comparison-value-labels',
    afterDatasetsDraw(chart) {
      if (chartType !== 'expenseComparison') {
        return;
      }

      if (!['combo', 'bar', 'histogram', 'line', 'area', 'scatter'].includes(visualType)) {
        return;
      }

      const { ctx } = chart;
      const datasets = chart.data?.datasets || [];

      ctx.save();
      ctx.font = '600 11px sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) {
          return;
        }

        const metaType = meta.type || dataset.type;
        const shouldRenderForDataset = (
          (visualType === 'combo' && metaType === 'bar') ||
          ((visualType === 'bar' || visualType === 'histogram') && metaType === 'bar') ||
          ((visualType === 'line' || visualType === 'area') && metaType === 'line') ||
          (visualType === 'scatter' && metaType === 'scatter')
        );

        if (!shouldRenderForDataset) {
          return;
        }

        meta.data.forEach((element, index) => {
          const rawValue = Array.isArray(dataset.data) ? dataset.data[index] : null;
          const numericValue = typeof rawValue === 'object' && rawValue !== null ? rawValue.y : rawValue;
          if (typeof numericValue !== 'number' || Number.isNaN(numericValue)) {
            return;
          }

          const position = element.tooltipPosition();
          const labelText = chartConfig.isCurrency
            ? `₹${Math.round(numericValue).toLocaleString('en-IN')}`
            : Math.round(numericValue).toLocaleString('en-IN');

          ctx.fillText(labelText, position.x, position.y - 8);
        });
      });

      ctx.restore();
    }
  }), [chartType, visualType, chartConfig.isCurrency]);

  return (
    <div className="analytics-chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{chartConfig.title}</h3>
          <p className="chart-description">{chartConfig.description}</p>
        </div>
        <div className="chart-header-controls">
          <button
            className={`advanced-toggle-btn ${showAdvancedControls ? 'active' : ''}`}
            onClick={() => setShowAdvancedControls((prev) => !prev)}
            title="Toggle advanced controls"
          >
            {showAdvancedControls ? 'Hide Advanced' : 'Advanced'}
          </button>
          {showAdvancedControls && (
            <div className="visual-type-selector">
              {chartConfig.allowedVisuals.map(type => (
                <button
                  key={type}
                  className={`visual-btn ${visualType === type ? 'active' : ''}`}
                  onClick={() => setVisualType(type)}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {type === 'combo' && '📶'}
                  {type === 'bar' && '📊'}
                  {type === 'line' && '📈'}
                  {type === 'area' && '🌊'}
                  {type === 'scatter' && '🟣'}
                  {type === 'histogram' && '🧱'}
                  {type === 'pie' && '🥧'}
                  {type === 'doughnut' && '🍩'}
                  {type === 'polarArea' && '🧭'}
                  {type === 'radar' && '🕸️'}
                </button>
              ))}
            </div>
          )}
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
              {showAdvancedControls && (
                <>
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
            </>
          )}
          {chartType === 'expenseComparison' && (
            <div className="control-group-inline">
              <label>FY</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="control-input-sm"
              >
                {(meta.availableFinancialYears || getFallbackFinancialYears()).map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
          )}
          {chartType === 'expenses' && (
            <div className="control-group-inline">
              <label>Category</label>
              <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="control-input-sm">
                <option value="all">All</option>
                <option value="drawing">Drawing (30%)</option>
                <option value="documents">Documents (2%)</option>
                <option value="siteVisit">Site Visit (10%)</option>
                <option value="marketingAndMisc">Marketing & Misc (3%)</option>
                <option value="officeManagement">Office Management (15%)</option>
              </select>
            </div>
          )}
          <div className="control-group-inline">
            <button className="btn-refresh-sm" onClick={fetchData} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
            {showAdvancedControls && (
              <label className="live-toggle-sm">
                <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
                <span>Live</span>
              </label>
            )}
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
          {chartType === 'expenseComparison' && (
            <>
              <span className="meta-badge">Estimated: <strong>₹{(meta.estimatedTotal || 0).toLocaleString('en-IN')}</strong></span>
              <span className="meta-badge">Actual: <strong>₹{(meta.actualTotal || 0).toLocaleString('en-IN')}</strong></span>
              <span className="meta-badge">FY: <strong>{meta.financialYear || financialYear}</strong></span>
            </>
          )}
          {meta.groupBy && <span className="meta-badge">Grouping: <strong>{meta.groupBy}</strong></span>}
        </div>
        {(chartType === 'expenseComparison' ? expenseComparisonChartData : chartData) && !error ? (
          <div className="chart-container-sm">
            <ChartComponent
              ref={chartRef}
              data={chartType === 'expenseComparison' ? expenseComparisonChartData : chartData}
              options={chartOptions}
              plugins={[valueLabelPlugin]}
            />
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
