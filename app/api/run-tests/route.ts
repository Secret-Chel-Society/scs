// Midnight Studios INTl - All rights reserved

import { NextRequest, NextResponse } from 'next/server';
import { websiteTestSuite } from '@/lib/test-suite';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting automated test suite...');
    console.log('🎯 Midnight Studios INTl - Testing all website functions');
    
    // Run all tests
    const results = await websiteTestSuite.runAllTests();
    const summary = websiteTestSuite.getSummary();
    
    // Log summary to console
    console.log('\n📊 TEST SUITE COMPLETED');
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️ Skipped: ${summary.skipped}`);
    console.log(`📈 Success Rate: ${summary.successRate.toFixed(1)}%`);
    
    return NextResponse.json({
      success: true,
      message: 'Test suite completed',
      studio: 'Midnight Studios INTl',
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test suite failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      studio: 'Midnight Studios INTl',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, options } = body;
    
    console.log(`🧪 Running specific test: ${testType}`);
    console.log('🎯 Midnight Studios INTl - Targeted testing');
    
    let results;
    
    switch (testType) {
      case 'api':
        await websiteTestSuite['testAPIEndpoints']();
        break;
      case 'database':
        await websiteTestSuite['testDatabaseOperations']();
        break;
      case 'tracking':
        await websiteTestSuite['testTrackingSystems']();
        break;
      case 'auth':
        await websiteTestSuite['testAuthentication']();
        break;
      case 'components':
        await websiteTestSuite['testComponents']();
        break;
      case 'security':
        await websiteTestSuite['testSecurityFeatures']();
        break;
      case 'performance':
        await websiteTestSuite['testPerformance']();
        break;
      default:
        results = await websiteTestSuite.runAllTests();
    }
    
    const summary = websiteTestSuite.getSummary();
    
    return NextResponse.json({
      success: true,
      message: `Test type '${testType}' completed`,
      studio: 'Midnight Studios INTl',
      testType,
      summary,
      results: websiteTestSuite.getResults(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Test type '${testType}' failed:`, error);
    
    return NextResponse.json({
      success: false,
      error: `Test type '${testType}' failed`,
      message: error instanceof Error ? error.message : 'Unknown error',
      studio: 'Midnight Studios INTl',
      testType: body?.testType || 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
