/**
 * GitHub Pages Configuration
 * Handles base path and asset prefix for static deployment
 */

export const GITHUB_PAGES_CONFIG = {
  basePath: '/LUMO',
  assetPrefix: '/LUMO/',
  isDevelopment: process.env.NODE_ENV === 'development',
  isGitHubPages: process.env.GITHUB_PAGES === 'true' || typeof window !== 'undefined' && window.location.hostname.includes('github.io'),
};

/**
 * Get the correct asset path for GitHub Pages
 */
export function getAssetPath(path: string): string {
  if (GITHUB_PAGES_CONFIG.isDevelopment) {
    return path;
  }
  
  if (GITHUB_PAGES_CONFIG.isGitHubPages) {
    return `${GITHUB_PAGES_CONFIG.basePath}${path}`;
  }
  
  return path;
}

/**
 * Get the correct API URL for client-side requests
 * Since GitHub Pages is static, all API calls go directly to Supabase
 */
export function getApiUrl(endpoint: string): string {
  // For GitHub Pages, we don't use API routes - everything goes through Supabase
  if (GITHUB_PAGES_CONFIG.isGitHubPages || process.env.NODE_ENV === 'production') {
    return ''; // Return empty string to indicate direct Supabase usage
  }
  
  // For development, use local API routes
  return `/api${endpoint}`;
}

/**
 * Check if we should use client-side only operations
 */
export function useClientSideOnly(): boolean {
  return GITHUB_PAGES_CONFIG.isGitHubPages || process.env.NODE_ENV === 'production';
} 