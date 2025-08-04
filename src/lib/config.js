// =====================================================
// APP CONFIGURATION UTILITY
// =====================================================

/**
 * Get the base URL for the application
 * Handles development, production, and preview environments
 */
export const getBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // For Vercel preview deployments, use the current origin
    if (window.location.hostname.includes('vercel.app')) {
      return window.location.origin;
    }
  }

  // Use environment variable if available
  const envBaseUrl = import.meta.env.VITE_APP_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Fallback based on environment
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }

  // Production fallback
  return 'https://growthapp.site';
};

/**
 * Get the auth callback URL for OAuth providers
 */
export const getAuthCallbackUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/callback`;
};

/**
 * Get the site URL for Supabase configuration
 */
export const getSiteUrl = () => {
  return getBaseUrl();
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

/**
 * Check if we're in production mode
 */
export const isProduction = () => {
  return import.meta.env.PROD;
};

/**
 * Check if we're in a Vercel preview deployment
 */
export const isVercelPreview = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('vercel.app');
  }
  return false;
};

/**
 * Get environment-specific configuration
 */
export const getConfig = () => {
  return {
    baseUrl: getBaseUrl(),
    authCallbackUrl: getAuthCallbackUrl(),
    siteUrl: getSiteUrl(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isVercelPreview: isVercelPreview(),
  };
}; 