// Midnight Studios INTl - All rights reserved

/**
 * Client-side download tracking
 * Monitors when code files are accessed or downloaded
 */

interface DownloadTracker {
  trackSourceMapAccess: () => void;
  trackStaticAssetAccess: (filename: string) => void;
  trackBundleAccess: (bundleName: string) => void;
  trackCSSAccess: (cssFile: string) => void;
  trackJSAccess: (jsFile: string) => void;
}

class DownloadTrackerImpl implements DownloadTracker {
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  private generateSessionId(): string {
    return `ms_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendDownloadEvent(fileType: string, filename: string) {
    if (!this.isEnabled) return;

    try {
      // Send to Supabase directly
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('code_downloads')
        .insert({
          file_type: fileType,
          filename: filename,
          session_id: this.sessionId,
          ip_address: 'client-side', // Will be updated by server
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
          metadata: {
            studio: 'Midnight Studios INTl',
            client_side: true
          }
        });

      if (error) {
        console.error('Download tracking failed:', error);
      }
    } catch (error) {
      console.error('Download tracking failed:', error);
    }
  }

  trackSourceMapAccess() {
    console.log('🔍 Source map access detected - Midnight Studios INTl');
    this.sendDownloadEvent('source_map', 'source-map');
  }

  trackStaticAssetAccess(filename: string) {
    console.log(`📁 Static asset access: ${filename} - Midnight Studios INTl`);
    this.sendDownloadEvent('static_asset', filename);
  }

  trackBundleAccess(bundleName: string) {
    console.log(`📦 Bundle access: ${bundleName} - Midnight Studios INTl`);
    this.sendDownloadEvent('bundle', bundleName);
  }

  trackCSSAccess(cssFile: string) {
    console.log(`🎨 CSS access: ${cssFile} - Midnight Studios INTl`);
    this.sendDownloadEvent('css', cssFile);
  }

  trackJSAccess(jsFile: string) {
    console.log(`⚡ JS access: ${jsFile} - Midnight Studios INTl`);
    this.sendDownloadEvent('js', jsFile);
  }
}

// Global download tracker instance
export const downloadTracker = new DownloadTrackerImpl();

// Convenience functions
export const trackSourceMapAccess = () => {
  downloadTracker.trackSourceMapAccess();
};

export const trackStaticAssetAccess = (filename: string) => {
  downloadTracker.trackStaticAssetAccess(filename);
};

export const trackBundleAccess = (bundleName: string) => {
  downloadTracker.trackBundleAccess(bundleName);
};

export const trackCSSAccess = (cssFile: string) => {
  downloadTracker.trackCSSAccess(cssFile);
};

export const trackJSAccess = (jsFile: string) => {
  downloadTracker.trackJSAccess(jsFile);
};

// Auto-track common file accesses
if (typeof window !== 'undefined') {
  // Track when source maps are accessed
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // Check if it's a source map request
    if (args[0] && typeof args[0] === 'string' && args[0].endsWith('.map')) {
      trackSourceMapAccess();
    }
    
    return response;
  };

  // Track when static assets are loaded
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && typeof value === 'string') {
          if (value.endsWith('.js')) {
            trackJSAccess(value);
          } else if (value.endsWith('.css')) {
            trackCSSAccess(value);
          } else {
            trackStaticAssetAccess(value);
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
}
