// Midnight Studios INTl - All rights reserved

/**
 * Simple test runner script
 * Run this to test all website functions
 */

const https = require('https');
const http = require('http');

class SimpleTestRunner {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive website test suite...');
    console.log('🎯 Midnight Studios INTl - Testing all functions');
    console.log('='.repeat(60));

    const tests = [
      { name: 'Homepage', path: '/' },
      { name: 'Teams Page', path: '/teams' },
      { name: 'Players Page', path: '/players' },
      { name: 'Matches Page', path: '/matches' },
      { name: 'Standings Page', path: '/standings' },
      { name: 'News Page', path: '/news' },
      { name: 'Management Page', path: '/management' },
      { name: 'Admin Dashboard', path: '/admin' },
      { name: 'Test Dashboard', path: '/admin/test-dashboard' },
      { name: 'Security Dashboard', path: '/admin/security-dashboard' },
      { name: 'Analytics API', path: '/api/analytics' },
      { name: 'Teams API', path: '/api/teams' },
      { name: 'Players API', path: '/api/players' },
      { name: 'Matches API', path: '/api/matches' },
      { name: 'Standings API', path: '/api/standings' },
      { name: 'News API', path: '/api/news' },
      { name: 'Free Agents API', path: '/api/free-agents' },
      { name: 'Waivers API', path: '/api/waivers' },
      { name: 'Trades API', path: '/api/trades' },
      { name: 'Forum Posts API', path: '/api/forum/posts' },
      { name: 'Forum Categories API', path: '/api/forum/categories' },
      { name: 'Photos API', path: '/api/photos' },
      { name: 'Lineups API', path: '/api/lineups' },
      { name: 'Game Availability API', path: '/api/game-availability' },
      { name: 'Injury Reserves API', path: '/api/injury-reserves' },
      { name: 'Statistics API', path: '/api/statistics/top-players' },
      { name: 'Download Tracking API', path: '/api/track-download' },
      { name: 'File Monitoring API', path: '/api/monitor-files' },
      { name: 'Test Runner API', path: '/api/run-tests' }
    ];

    let passed = 0;
    let failed = 0;
    let total = tests.length;

    for (const test of tests) {
      const result = await this.testEndpoint(test.name, test.path);
      this.results.push(result);
      
      if (result.status === 'pass') {
        passed++;
        console.log(`✅ ${test.name}: ${result.message}`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: ${result.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your website is working perfectly!');
    } else {
      console.log(`\n⚠️ ${failed} test(s) failed. Please review the issues above.`);
    }
    
    console.log('\n🏢 Midnight Studios INTl - Test Suite Complete');
    
    return { total, passed, failed, results: this.results };
  }

  async testEndpoint(name, path) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Midnight Studios INTl Test Runner',
          'Accept': 'text/html,application/json,*/*'
        }
      };

      const req = client.request(options, (res) => {
        const duration = Date.now() - startTime;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          name,
          path,
          status: isSuccess ? 'pass' : 'fail',
          message: `Status ${res.statusCode} (${duration}ms)`,
          statusCode: res.statusCode,
          duration,
          headers: res.headers
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          name,
          path,
          status: 'fail',
          message: `Error: ${error.message}`,
          error: error.message,
          duration
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const duration = Date.now() - startTime;
        resolve({
          name,
          path,
          status: 'fail',
          message: 'Timeout after 10 seconds',
          duration
        });
      });

      req.end();
    });
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const runner = new SimpleTestRunner(baseUrl);
  
  runner.runAllTests().then((summary) => {
    process.exit(summary.failed > 0 ? 1 : 0);
  }).catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleTestRunner;
