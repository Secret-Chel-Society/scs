// Midnight Studios INTl - All rights reserved

/**
 * Security monitoring system
 * Monitors for suspicious activity and rate limiting
 */

import { trackEvent } from './analytics';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Check rate limit for an IP address
export function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = ip;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    // Rate limit exceeded
    trackEvent('rate_limit_exceeded', {
      studio: 'Midnight Studios INTl',
      ip,
      count: current.count,
      maxRequests,
      windowMs,
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

// Monitor suspicious activity
export function monitorSuspiciousActivity(ip: string, activity: string, details: any = {}) {
  try {
    trackEvent('suspicious_activity', {
      studio: 'Midnight Studios INTl',
      ip,
      activity,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });
  } catch (error) {
    console.error('Failed to monitor suspicious activity:', error);
  }
}

// Block IP address
export function blockIP(ip: string, reason: string) {
  try {
    trackEvent('ip_blocked', {
      studio: 'Midnight Studios INTl',
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to block IP:', error);
  }
}

// Check if IP is blocked
export function isIPBlocked(ip: string): boolean {
  // In a real implementation, this would check against a database
  // For now, we'll just return false
  return false;
}