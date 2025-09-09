// Midnight Studios INTl - All rights reserved

import { NextRequest, NextResponse } from 'next/server';
import { websiteTestSuite } from '../../../lib/test-suite';

// Force Node.js runtime to avoid Edge Runtime compatibility issues
export const runtime = 'nodejs'

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
        results = await websiteTestSuite.testAPIEndpoints();
        break;
      case 'database':
        results = await websiteTestSuite.testDatabaseOperations();
        break;
      case 'tracking':
        results = await websiteTestSuite.testTrackingSystems();
        break;
      case 'auth':
        results = await websiteTestSuite.testAuthentication();
        break;
      case 'components':
        results = await websiteTestSuite.testComponents();
        break;
      case 'security':
        results = await websiteTestSuite.testSecurityFeatures();
        break;
      case 'performance':
        results = await websiteTestSuite.testPerformance();
        break;
      default:
        results = await websiteTestSuite.runAllTests();
    }
    
    const summary = websiteTestSuite.getSummary();
    
    return NextResponse.json({
      success: true,
      message: `Test suite completed for: ${testType}`,
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