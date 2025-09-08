// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number;
}

export default function TestDashboard() {
  const [testResults, setTestResults] = useState<TestSuite[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const runAllTests = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/run-tests')
      const data = await response.json()
      
      if (data.success) {
        setTestResults(data.results || [])
        setSummary(data.summary)
        setLastRun(new Date().toISOString())
      } else {
        console.error('Test suite failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const runSpecificTest = async (testType: string) => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestResults(data.results || [])
        setSummary(data.summary)
        setLastRun(new Date().toISOString())
      } else {
        console.error('Test failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to run test:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />
      case 'skip': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'default'
      case 'fail': return 'destructive'
      case 'skip': return 'secondary'
      default: return 'outline'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Dashboard</h1>
          <p className="text-muted-foreground">Midnight Studios INTl - Comprehensive Website Testing</p>
          {lastRun && (
            <p className="text-sm text-muted-foreground">
              Last run: {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">
                All test suites combined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <p className="text-xs text-muted-foreground">
                Tests that need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skipped</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.skipped}</div>
              <p className="text-xs text-muted-foreground">
                Tests not applicable
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>Run specific test suites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { type: 'api', label: 'API Endpoints', color: 'blue' },
              { type: 'database', label: 'Database', color: 'green' },
              { type: 'tracking', label: 'Tracking', color: 'purple' },
              { type: 'auth', label: 'Authentication', color: 'orange' },
              { type: 'components', label: 'Components', color: 'pink' },
              { type: 'security', label: 'Security', color: 'red' },
              { type: 'performance', label: 'Performance', color: 'indigo' }
            ].map((test) => (
              <Button
                key={test.type}
                variant="outline"
                size="sm"
                onClick={() => runSpecificTest(test.type)}
                disabled={isRunning}
                className="justify-start"
              >
                {test.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
            <TabsTrigger value="failed">Failed Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {testResults.map((suite, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {suite.name}
                      <Badge variant={suite.failedTests > 0 ? 'destructive' : 'default'}>
                        {suite.passedTests}/{suite.totalTests} passed
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(suite.duration)}
                    </div>
                  </div>
                  <CardDescription>
                    {suite.passedTests} passed, {suite.failedTests} failed, {suite.skippedTests} skipped
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.slice(0, 5).map((test, testIndex) => (
                      <div key={testIndex} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(test.status)}>
                            {test.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(test.duration)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {suite.tests.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {suite.tests.length - 5} more tests
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {testResults.map((suite, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{suite.name}</CardTitle>
                  <CardDescription>
                    {suite.totalTests} tests in {formatDuration(suite.duration)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div key={testIndex} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(test.status)}>
                              {test.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(test.duration)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            {testResults.map((suite, index) => {
              const failedTests = suite.tests.filter(test => test.status === 'fail');
              if (failedTests.length === 0) return null;
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-red-600">{suite.name} - Failed Tests</CardTitle>
                    <CardDescription>
                      {failedTests.length} failed test(s) that need attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {failedTests.map((test, testIndex) => (
                        <div key={testIndex} className="border border-red-200 rounded p-3 bg-red-50">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-red-800">{test.name}</span>
                          </div>
                          <p className="text-sm text-red-700">{test.message}</p>
                          {test.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-red-600 cursor-pointer">
                                View Error Details
                              </summary>
                              <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto text-red-800">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Run All Tests</h4>
            <p className="text-sm text-muted-foreground">
              Click "Run All Tests" to test every function on your website including API endpoints, 
              database operations, tracking systems, authentication, components, security, and performance.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Quick Tests</h4>
            <p className="text-sm text-muted-foreground">
              Use the quick test buttons to run specific test suites. This is useful for debugging 
              specific areas of your application.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Review Results</h4>
            <p className="text-sm text-muted-foreground">
              Check the overview for a summary, detailed results for comprehensive information, 
              and failed tests to see what needs attention.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">4. Console Logs</h4>
            <p className="text-sm text-muted-foreground">
              Open your browser's developer console (F12) to see real-time test execution logs 
              and detailed error information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
