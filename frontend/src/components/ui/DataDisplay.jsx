import React from 'react';
import PropTypes from 'prop-types';
import './ui.css';

export const StatusBadge = ({ status, variant }) => {
  const normalized = (status || '').toLowerCase();
  const resolvedVariant =
    variant ||
    (normalized.includes('complete') || normalized === 'active' || normalized === 'paid'
      ? 'success'
      : normalized.includes('progress') || normalized.includes('pending')
      ? 'warning'
      : normalized.includes('cancel') || normalized === 'inactive' || normalized === 'overdue'
      ? 'danger'
      : 'neutral');

  return <span className={`ui-badge ui-badge--${resolvedVariant}`}>{status}</span>;
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'neutral', 'info'])
};

export const StatCard = ({ label, value, trend = null, icon = null, accent = 'primary' }) => (
  <div className={`ui-stat-card ui-stat-card--${accent}`}>
    <div className="ui-stat-top">
      <span className="ui-stat-label">{label}</span>
      {icon && <span className="ui-stat-icon" aria-hidden="true">{icon}</span>}
    </div>
    <div className="ui-stat-value tabular-nums">{value}</div>
    {trend && <div className="ui-stat-trend">{trend}</div>}
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.node,
  icon: PropTypes.node,
  accent: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info'])
};

export const EmptyState = ({ icon = '📭', title, description, action = null }) => (
  <div className="empty-state ui-empty-state">
    <div className="ui-empty-icon" aria-hidden="true">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="ui-empty-action">{action}</div>}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node
};

export const DataTable = ({ columns = [], data = [], renderRow, emptyState = null }) => {
  if (!data || data.length === 0) {
    return emptyState || <EmptyState title="No records found" />;
  }

  return (
    <div className="ui-table-wrap">
      <table className="ui-data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} className={col.numeric ? 'numeric' : ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map((row, idx) => renderRow(row, idx))}</tbody>
      </table>
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      numeric: PropTypes.bool
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  renderRow: PropTypes.func.isRequired,
  emptyState: PropTypes.node
};
