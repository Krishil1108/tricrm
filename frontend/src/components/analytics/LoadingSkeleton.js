import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="analytics-loading">
      {/* Summary Cards Skeleton */}
      <div className="skeleton-cards">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="skeleton-card loading-skeleton"></div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="skeleton-charts">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="skeleton-chart loading-skeleton"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;