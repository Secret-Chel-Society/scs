// Midnight Studios INTl - All rights reserved

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DownloadEvent {
  fileType: 'source_map' | 'static_asset' | 'bundle' | 'css' | 'js';
  filename: string;
  ip: string;
  userAgent: string;
  referer?: string;
  timestamp: number;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const downloadEvent: DownloadEvent = await request.json();
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';

    // Log the download event
    console.log('📥 Code Download Detected:', {
      ...downloadEvent,
      ip,
      userAgent,
      referer,
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString()
    });

    // Store in database
    const supabase = createClient();
    
    const { error } = await supabase
      .from('code_downloads')
      .insert({
        file_type: downloadEvent.fileType,
        filename: downloadEvent.filename,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        session_id: downloadEvent.sessionId,
        timestamp: new Date(downloadEvent.timestamp).toISOString(),
        metadata: {
          studio: 'Midnight Studios INTl',
          server_side: true
        }
      });

    if (error) {
      console.error('Failed to store download event:', error);
    }

    // Check for suspicious download patterns
    if (downloadEvent.fileType === 'source_map') {
      console.warn('🚨 Source map access detected - potential code inspection:', {
        ip,
        userAgent,
        filename: downloadEvent.filename
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Download tracked',
      studio: 'Midnight Studios INTl'
    });

  } catch (error) {
    console.error('Download tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track download' }, 
      { status: 500 }
    );
  }
}

// Get download statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return download statistics
    return NextResponse.json({
      message: 'Download statistics',
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString(),
      // You can add actual statistics here from your database
    });

  } catch (error) {
    console.error('Download statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' }, 
      { status: 500 }
    );
  }
}
