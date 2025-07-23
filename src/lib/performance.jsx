// Performance optimization utilities for production deployment

import { lazy, memo, useCallback, useMemo, Component } from 'react';

// Lazy loading with loading states
export const createLazyComponent = (importFunction, displayName = 'LazyComponent') => {
  const LazyComponent = lazy(importFunction);
  LazyComponent.displayName = displayName;
  
  return LazyComponent;
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      
      if (import.meta.env.PROD) {
        // Only log slow operations in production
        if (end - start > 500) {
          console.warn(`🐌 Slow operation "${name}": ${Math.round(end - start)}ms`);
        }
      } else {
        console.log(`⚡ "${name}": ${Math.round(end - start)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ "${name}" failed after ${Math.round(end - start)}ms:`, error);
      throw error;
    }
  };
};

// Optimized memo wrapper with debugging
export const optimizedMemo = (Component, displayName) => {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    // Custom comparison for better performance
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        // Deep comparison for objects/arrays if needed
        if (typeof prevProps[key] === 'object' && typeof nextProps[key] === 'object') {
          if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  });
  
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }
  
  return MemoizedComponent;
};

// Debounced callback hook
export const useDebounceCallback = (callback, delay) => {
  return useCallback(
    useMemo(() => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
    }, [callback, delay]),
    [callback, delay]
  );
};

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key, data) => {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (apiCache.size > 100) {
    const entries = Array.from(apiCache.entries());
    entries.slice(0, 50).forEach(([key]) => apiCache.delete(key));
  }
};

// Network status monitoring
export const getNetworkStatus = () => {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  return null;
};

// Image optimization helper
export const getOptimizedImageUrl = (url, width = 400, quality = 80) => {
  if (!url) return url;
  
  // If it's already optimized or not a web URL, return as-is
  if (url.includes('?') || !url.startsWith('http')) {
    return url;
  }
  
  // Simple optimization query params
  return `${url}?w=${width}&q=${quality}`;
};

// Error boundary helper
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Production Error Boundary:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      console.error('📊 Production Error Report:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-forest-green text-white px-6 py-2 rounded-lg hover:bg-forest-green/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  // Preload fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.crossOrigin = 'anonymous';
  fontPreload.href = '/fonts/inter-var.woff2'; // Adjust to your font path
  document.head.appendChild(fontPreload);
  
  // Preload critical API endpoints (DNS prefetch)
  const apiPrefetch = document.createElement('link');
  apiPrefetch.rel = 'dns-prefetch';
  apiPrefetch.href = import.meta.env.VITE_SUPABASE_URL;
  document.head.appendChild(apiPrefetch);
};

export default {
  createLazyComponent,
  measurePerformance,
  optimizedMemo,
  useDebounceCallback,
  getCachedData,
  setCachedData,
  getNetworkStatus,
  getOptimizedImageUrl,
  ErrorBoundary,
  preloadCriticalResources
}; 