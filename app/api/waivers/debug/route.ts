import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Waiver API test endpoint called')
  
  try {
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    })
  } catch (error) {
    console.error('❌ DEBUG: Error in debug endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 DEBUG: Waiver API POST test endpoint called')
  
  try {
    const body = await request.json()
    console.log('🔍 DEBUG: Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Debug POST endpoint working',
      receivedBody: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ DEBUG: Error in debug POST endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
