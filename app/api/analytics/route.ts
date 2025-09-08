// Midnight Studios INTl - All rights reserved

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();
    
    // Validate the event
    if (!event.event || !event.sessionId) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Add IP to event
    event.ip = ip;

    // Log the event (you can store this in your database)
    console.log('Analytics Event:', {
      ...event,
      studio: 'Midnight Studios INTl',
      receivedAt: new Date().toISOString()
    });

    // Check for suspicious patterns
    if (event.event === 'suspicious_activity') {
      console.warn('🚨 Suspicious activity detected:', event.metadata);
      
      // You can add additional security measures here
      // - Rate limiting
      // - IP blocking
      // - User notification
      // - Admin alerts
    }

    // Store in database if needed
    const supabase = createClient();
    
    // You can create an analytics table to store these events
    // const { error } = await supabase
    //   .from('analytics_events')
    //   .insert({
    //     event_type: event.event,
    //     session_id: event.sessionId,
    //     user_id: event.userId,
    //     metadata: event.metadata,
    //     ip_address: event.ip,
    //     user_agent: event.userAgent,
    //     timestamp: new Date(event.timestamp).toISOString()
    //   });

    return NextResponse.json({ 
      success: true, 
      message: 'Event tracked successfully',
      studio: 'Midnight Studios INTl'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' }, 
      { status: 500 }
    );
  }
}

// Get analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You can add admin role checking here
    // const { data: userRole } = await supabase
    //   .from('user_roles')
    //   .select('role')
    //   .eq('user_id', user.id)
    //   .single();

    // if (userRole?.role !== 'Admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Return analytics data
    return NextResponse.json({
      message: 'Analytics data',
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' }, 
      { status: 500 }
    );
  }
}
