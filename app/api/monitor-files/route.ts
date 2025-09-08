// Midnight Studios INTl - All rights reserved

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FileAccessEvent {
  filePath: string;
  fileType: string;
  ip: string;
  userAgent: string;
  method: string;
  timestamp: number;
  referer?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');
    const fileType = searchParams.get('type') || 'unknown';
    
    // Get client information
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';

    // Log file access
    const fileAccessEvent: FileAccessEvent = {
      filePath: filePath || 'unknown',
      fileType,
      ip,
      userAgent,
      method: 'GET',
      timestamp: Date.now(),
      referer
    };

    console.log('📁 File Access Detected:', {
      ...fileAccessEvent,
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString()
    });

    // Check for suspicious file access patterns
    if (fileType === 'source_map' || filePath?.endsWith('.map')) {
      console.warn('🚨 Source map access detected - potential code inspection:', {
        ip,
        userAgent,
        filePath,
        referer
      });
    }

    // Store in database
    const supabase = createClient();
    
    // You can create a file_access table to track this
    // const { error } = await supabase
    //   .from('file_access_logs')
    //   .insert({
    //     file_path: filePath,
    //     file_type: fileType,
    //     ip_address: ip,
    //     user_agent: userAgent,
    //     referer: referer,
    //     timestamp: new Date().toISOString()
    //   });

    return NextResponse.json({ 
      success: true, 
      message: 'File access tracked',
      studio: 'Midnight Studios INTl'
    });

  } catch (error) {
    console.error('File access tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track file access' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const fileAccessEvent: FileAccessEvent = await request.json();
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';

    // Log the file access event
    console.log('📁 File Access Event:', {
      ...fileAccessEvent,
      ip,
      userAgent,
      referer,
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString()
    });

    // Check for suspicious patterns
    if (fileAccessEvent.fileType === 'source_map' || 
        fileAccessEvent.filePath?.endsWith('.map')) {
      console.warn('🚨 Source map access detected - potential code inspection:', {
        ip,
        userAgent,
        filePath: fileAccessEvent.filePath
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File access tracked',
      studio: 'Midnight Studios INTl'
    });

  } catch (error) {
    console.error('File access tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track file access' }, 
      { status: 500 }
    );
  }
}
