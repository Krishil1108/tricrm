/**
 * Performance monitoring utility for React components
 * Use this to identify slow components and optimize them
 */

// Report Web Vitals to console or analytics service
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Log performance metrics to console in development
export const logPerformanceMetrics = (metric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, metric.value, 'ms');
  }
  
  // You can send to analytics service here
  // Example: sendToAnalytics(metric);
};

// Measure component render time
export const measureRenderTime = (componentName, callback) => {
  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Render] ${componentName}:`, (endTime - startTime).toFixed(2), 'ms');
  }
  
  return result;
};

// Performance observer for long tasks
export const observeLongTasks = () => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Long Task]', entry.name, entry.duration, 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask', 'measure'] });
    } catch (e) {
      // PerformanceObserver not supported or failed
    }
  }
};

export default reportWebVitals;
