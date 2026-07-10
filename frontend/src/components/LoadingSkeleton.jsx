import React from 'react';

const LoadingSkeleton = ({ rows = 6, variant = 'table', className = '' }) => {
  const items = Array.from({ length: rows });
  const shellClass = ['loading-state', 'skeleton-shell', className].filter(Boolean).join(' ');

  return (
    <div className={shellClass} role="status" aria-live="polite">
      <div className="skeleton-line skeleton-line--lg"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line skeleton-line--sm"></div>
      <div className={`skeleton-stack skeleton-stack--${variant}`} aria-hidden="true">
        {items.map((_, index) => (
          <div
            key={`${variant}-row-${index}`}
            className={`skeleton-row${index % 2 === 0 ? ' skeleton-row--wide' : ''}`}
          ></div>
        ))}
      </div>
      <span className="sr-only">Loading content</span>
    </div>
  );
};

export default LoadingSkeleton;
