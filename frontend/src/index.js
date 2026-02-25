import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { reportWebVitals, logPerformanceMetrics } from './utils/performance';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove StrictMode in production for better performance (no double renders)
if (process.env.NODE_ENV === 'production') {
  root.render(<App />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Measure and report Web Vitals
reportWebVitals(logPerformanceMetrics);