
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '@/index.css';

import { ErrorBoundary, preloadCriticalResources } from '@/lib/performance.jsx';

// Preload critical resources for faster initial load
preloadCriticalResources();

// Production loading component
const ProductionLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-sun-beige">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin"></div>
      <div className="text-forest-green font-medium">Loading Growth App...</div>
    </div>
  </div>
);

// Performance monitoring for initial load
const startTime = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  if (import.meta.env.PROD) {
    console.log(`📊 App loaded in ${Math.round(loadTime)}ms`);
    if (loadTime > 2000) {
      console.warn('🐌 Slow initial load detected:', loadTime + 'ms');
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<ProductionLoader />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
