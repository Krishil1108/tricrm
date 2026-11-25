import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable shimmer loading skeleton for data tables and dashboards.
 */
const TableSkeleton = ({ rows = 6, title = true }) => {
  return (
    <div className="loading-state" role="status" aria-label="Loading content">
      <div className="skeleton-shell">
        {title && <div className="skeleton-line skeleton-line--lg" />}
        <div className="skeleton-line skeleton-line--sm" />
        <div className="skeleton-stack">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className={`skeleton-row ${idx % 2 === 0 ? 'skeleton-row--wide' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  title: PropTypes.bool
};

export default TableSkeleton;
