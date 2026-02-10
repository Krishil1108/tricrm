import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import './InteractiveChartBuilder.css';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const colorPalette = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 205, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)'
];

const formatInputDate = (d) => d.toISOString().slice(0, 10);
const formatLabel = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const InteractiveChartBuilder = ({ token, apiBaseUrl }) => {
  const [from, setFrom] = useState(() => {
    const dt = new Date();
    dt.setMonth(dt.getMonth() - 11); // default to last 12 months for richer data
    return formatInputDate(dt);
  });
  const [to, setTo] = useState(() => formatInputDate(new Date()));
  const [groupBy, setGroupBy] = useState('month');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(true);
  const [refreshMs, setRefreshMs] = useState(30000);
  const [preset, setPreset] = useState('12m');
  const [meta, setMeta] = useState({ total: 0, groupBy: 'month' });
  const chartRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ groupBy });
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const url = `${apiBaseUrl}/analytics/clients/monthly?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [CHART] API error response:', errorText);
        throw new Error(`Failed to load analytics (${res.status})`);
      }
      
      const data = await res.json();

      // Check if response has unexpected structure
      if (!data.labels && !data.values && !data.total) {
        console.error('❌ [CHART] Backend returned empty/invalid data structure');
        throw new Error('No analytics data available. Backend returned empty response.');
      }

      const labels = (data.labels || []).map(formatLabel);
      const colors = labels.map((_, idx) => colorPalette[idx % colorPalette.length]);

      setChartData({
        labels,
        datasets: [
          {
            label: 'New Clients',
            data: data.values || [],
            backgroundColor: colors,
            borderColor: colors.map((c) => c.replace('0.8', '1')),
            borderWidth: 1
          }
        ]
      });
      setMeta({
        total: data.total || 0,
        groupBy: data.groupBy || groupBy,
        from: data.from || from,
        to: data.to || to
      });
    } catch (e) {
      console.error('❌ [CHART] Error fetching data:', e);
      console.error('❌ [CHART] Error stack:', e.stack);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy]);

  // Lightweight live polling (no socket dependency available)
  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => {
      fetchData();
    }, refreshMs);
    return () => clearInterval(id);
  }, [live, refreshMs, from, to, groupBy]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Trend by Clients' }
    },
    scales: { y: { beginAtZero: true } }
  }), []);

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
        nextFrom = '';
    }

    setPreset(value);
    setFrom(nextFrom);
    setTo(nextTo);
  };

  return (
    <div className="interactive-chart-builder">
      <div className="chart-builder-header">
        <h2>📈 Analytics</h2>
        <p>Real client growth by creation date with flexible grouping.</p>
      </div>

      <div className="chart-controls">
        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label">Quick Range</label>
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              className="control-select"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="ytd">Year to date</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="control-select" />
          </div>
          <div className="control-group">
            <label className="control-label">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="control-select" />
          </div>
          <div className="control-group">
            <label className="control-label">Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="control-select">
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Actions</label>
            <button className="generate-btn primary" onClick={fetchData} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <div className="live-toggle">
              <label>
                <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live
              </label>
              <select
                className="control-select"
                value={refreshMs}
                onChange={(e) => setRefreshMs(Number(e.target.value))}
                disabled={!live}
              >
                <option value={15000}>15s</option>
                <option value={30000}>30s</option>
                <option value={60000}>60s</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="chart-error">
          <p><FiAlertCircle className="inline-icon" />{error}</p>
        </div>
      )}

      <div className="chart-display-area">
        <div className="chart-meta">
          <span>New clients: {meta.total}</span>
          <span>Grouping: {meta.groupBy}</span>
        </div>
        {chartData && !error ? (
          <div className="chart-container">
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="chart-placeholder">
            <div className="placeholder-content">
              <p>{loading ? 'Loading analytics…' : 'No data yet'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveChartBuilder;
