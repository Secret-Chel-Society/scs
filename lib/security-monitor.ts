// Midnight Studios INTl - All rights reserved

/**
 * Security monitoring and threat detection
 * Legitimate security measures to protect your application
 */

interface SecurityEvent {
  type: 'suspicious_request' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: number;
  ip: string;
  userAgent: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private blockedIPs = new Set<string>();

  // Rate limiting
  checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = ip;
    
    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const rateLimit = this.rateLimitMap.get(key)!;
    
    if (now > rateLimit.resetTime) {
      rateLimit.count = 1;
      rateLimit.resetTime = now + windowMs;
      return true;
    }

    if (rateLimit.count >= limit) {
      this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        details: { ip, limit, count: rateLimit.count },
        timestamp: now,
        ip,
        userAgent: 'unknown'
      });
      return false;
    }

    rateLimit.count++;
    return true;
  }

  // Check for suspicious patterns
  checkSuspiciousActivity(ip: string, userAgent: string, request: any): boolean {
    const suspiciousPatterns = [
      // SQL injection attempts
      /('|(\\')|(;)|(\\;)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter))/i,
      // XSS attempts
      /(<script|javascript:|onload=|onerror=|onclick=)/i,
      // Path traversal
      /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
      // Command injection
      /(\||&|;|`|\$\(|\$\{)/i
    ];

    const requestString = JSON.stringify(request);
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestString)) {
        this.logSecurityEvent({
          type: 'suspicious_request',
          severity: 'high',
          details: { 
            pattern: pattern.toString(), 
            request: requestString.substring(0, 500),
            ip,
            userAgent
          },
          timestamp: Date.now(),
          ip,
          userAgent
        });
        return true;
      }
    }

    return false;
  }

  // Check for unauthorized access attempts
  checkUnauthorizedAccess(ip: string, userAgent: string, path: string): boolean {
    const protectedPaths = ['/admin', '/api/admin', '/management'];
    const isProtectedPath = protectedPaths.some(protectedPath => 
      path.startsWith(protectedPath)
    );

    if (isProtectedPath) {
      this.logSecurityEvent({
        type: 'unauthorized_access',
        severity: 'medium',
        details: { path, ip, userAgent },
        timestamp: Date.now(),
        ip,
        userAgent
      });
      return true;
    }

    return false;
  }

  // Log security events
  private async logSecurityEvent(event: SecurityEvent) {
    this.events.push(event);
    
    // Log to console
    console.warn('🚨 Security Event:', {
      ...event,
      studio: 'Midnight Studios INTl',
      timestamp: new Date(event.timestamp).toISOString()
    });

    // Store in Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: event.type,
          severity: event.severity,
          ip_address: event.ip,
          user_agent: event.userAgent,
          details: event.details,
          timestamp: new Date(event.timestamp).toISOString(),
          metadata: {
            studio: 'Midnight Studios INTl'
          }
        });

      if (error) {
        console.error('Failed to store security event:', error);
      }
    } catch (error) {
      console.error('Security event storage failed:', error);
    }

    // Block IP if critical event
    if (event.severity === 'critical') {
      this.blockedIPs.add(event.ip);
      console.error('🚫 IP Blocked:', event.ip);
    }
  }

  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Get security summary
  getSecuritySummary() {
    const summary = {
      totalEvents: this.events.length,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      blockedIPs: Array.from(this.blockedIPs),
      studio: 'Midnight Studios INTl'
    };

    this.events.forEach(event => {
      summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
      summary.eventsBySeverity[event.severity] = (summary.eventsBySeverity[event.severity] || 0) + 1;
    });

    return summary;
  }

  // Get recent events
  getRecentEvents(limit: number = 50) {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

// Convenience functions
export const checkRateLimit = (ip: string, limit?: number, windowMs?: number) => {
  return securityMonitor.checkRateLimit(ip, limit, windowMs);
};

export const checkSuspiciousActivity = (ip: string, userAgent: string, request: any) => {
  return securityMonitor.checkSuspiciousActivity(ip, userAgent, request);
};

export const checkUnauthorizedAccess = (ip: string, userAgent: string, path: string) => {
  return securityMonitor.checkUnauthorizedAccess(ip, userAgent, path);
};

export const isIPBlocked = (ip: string) => {
  return securityMonitor.isIPBlocked(ip);
};
