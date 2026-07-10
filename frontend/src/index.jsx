import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { reportWebVitals, logPerformanceMetrics } from './utils/performance';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default to true, can be annoying during dev
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove StrictMode in production for better performance (no double renders)
if (import.meta.env.MODE === 'production') {
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
} else {
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

// Measure and report Web Vitals
reportWebVitals(logPerformanceMetrics);