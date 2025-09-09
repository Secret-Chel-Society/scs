// Midnight Studios INTl - All rights reserved

/**
 * Legitimate usage analytics and monitoring
 * Tracks app usage for performance and security monitoring
 */

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  ip?: string;
  metadata?: Record<string, any>;
}

class AnalyticsTracker {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  private generateSessionId(): string {
    return `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track legitimate usage events
  trackEvent(event: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      metadata: {
        ...metadata,
        studio: 'Midnight Studios INTl'
      }
    };

    this.events.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);
  }

  // Track suspicious activity
  trackSuspiciousActivity(activity: string, details?: Record<string, any>) {
    this.trackEvent('suspicious_activity', {
      activity,
      details,
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }

  // Track user actions
  trackUserAction(action: string, target?: string) {
    this.trackEvent('user_action', {
      action,
      target,
      timestamp: new Date().toISOString()
    });
  }

  // Track code downloads and access
  trackCodeDownload(fileType: string, filename: string, details?: Record<string, any>) {
    this.trackEvent('code_download', {
      fileType,
      filename,
      details,
      timestamp: new Date().toISOString(),
      severity: fileType === 'source_map' ? 'high' : 'medium'
    });
  }

  // Track source map access (high priority)
  trackSourceMapAccess(filename: string) {
    this.trackSuspiciousActivity('source_map_access', {
      filename,
      timestamp: new Date().toISOString(),
      note: 'Potential code inspection attempt'
    });
  }

  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // Send to Supabase directly
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: event.event,
          session_id: event.sessionId,
          user_id: event.userId,
          ip_address: event.ip,
          user_agent: event.userAgent,
          metadata: event.metadata,
          timestamp: new Date(event.timestamp).toISOString()
        });

      if (error) {
        console.error('Analytics tracking failed:', error);
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      duration: this.events.length > 0 ? 
        this.events[this.events.length - 1].timestamp - this.events[0].timestamp : 0,
      events: this.events
    };
  }
}

// Global analytics instance
export const analytics = new AnalyticsTracker();

// Convenience functions
export const trackEvent = (event: string, metadata?: Record<string, any>) => {
  analytics.trackEvent(event, metadata);
};

export const trackSuspiciousActivity = (activity: string, details?: Record<string, any>) => {
  analytics.trackSuspiciousActivity(activity, details);
};

export const trackPerformance = (metric: string, value: number, unit?: string) => {
  analytics.trackPerformance(metric, value, unit);
};

export const trackUserAction = (action: string, target?: string) => {
  analytics.trackUserAction(action, target);
};
