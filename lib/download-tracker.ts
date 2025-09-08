// Midnight Studios INTl - All rights reserved

/**
 * Download tracking system
 * Tracks when source maps and other files are accessed
 */

import { trackEvent } from './analytics';

// Track source map access
export function trackSourceMapAccess() {
  try {
    trackEvent('source_map_access', {
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    });
  } catch (error) {
    console.error('Failed to track source map access:', error);
  }
}

// Track static asset downloads
export function trackStaticAssetDownload(filename: string, size: number) {
  try {
    trackEvent('static_asset_download', {
      studio: 'Midnight Studios INTl',
      filename,
      size,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    });
  } catch (error) {
    console.error('Failed to track static asset download:', error);
  }
}

// Track client-side downloads
export function trackClientDownload(fileType: string, fileSize: number) {
  try {
    trackEvent('client_download', {
      studio: 'Midnight Studios INTl',
      fileType,
      fileSize,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  } catch (error) {
    console.error('Failed to track client download:', error);
  }
}