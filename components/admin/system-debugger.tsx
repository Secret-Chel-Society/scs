// Midnight Studios INTl - All rights reserved
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Users, 
  Settings,
  Zap
} from "lucide-react"

interface TestResult {
  success: boolean
  message: string
  [key: string]: any
}

export function SystemDebugger() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const { toast } = useToast()

  const runTest = async (testName: string, endpoint: string) => {
    setLoading(testName)
    try {
      const response = await fetch(endpoint, { method: "POST" })
      const result = await response.json()
      
      setResults(prev => ({
        ...prev,
        [testName]: result
      }))

      if (result.success) {
        toast({
          title: `${testName} Test Passed`,
          description: result.message,
        })
      } else {
        toast({
          title: `${testName} Test Failed`,
          description: result.error || result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const errorResult = {
        success: false,
        message: "Test failed to run",
        error: error.message
      }
      
      setResults(prev => ({
        ...prev,
        [testName]: errorResult
      }))

      toast({
        title: `${testName} Test Error`,
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getStatusIcon = (result: TestResult | undefined) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (result: TestResult | undefined) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>
    if (result.success) return <Badge variant="default" className="bg-green-500">Passed</Badge>
    return <Badge variant="destructive">Failed</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ice-blue-600 dark:text-ice-blue-400">System Debugger</h2>
          <p className="text-muted-foreground">Test and fix system functionality issues</p>
        </div>
        <Button
          onClick={() => {
            setResults({})
            toast({ title: "Cleared test results" })
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Results
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* IP Tracking Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              IP Tracking
              {getStatusIcon(results.ipTracking)}
            </CardTitle>
            <CardDescription>
              Test IP address tracking functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(results.ipTracking)}
            </div>
            
            {results.ipTracking && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{results.ipTracking.message}</p>
                {results.ipTracking.checks && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Users Table:</span>
                      {results.ipTracking.checks.usersTableColumns ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">IP Logs Table:</span>
                      {results.ipTracking.checks.ipLogsTable ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Function:</span>
                      {results.ipTracking.checks.logIpAddressFunction ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => runTest("ipTracking", "/api/admin/fix-ip-tracking")}
                disabled={loading === "ipTracking"}
                size="sm"
              >
                {loading === "ipTracking" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                Fix IP Tracking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bid Processing Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bid Processing
              {getStatusIcon(results.bidProcessing)}
            </CardTitle>
            <CardDescription>
              Test bid processing and team assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(results.bidProcessing)}
            </div>
            
            {results.bidProcessing && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{results.bidProcessing.message}</p>
                {results.bidProcessing.testResults && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Bids Found:</span>
                      <Badge variant="outline">{results.bidProcessing.testResults.bidsFound}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Function Exists:</span>
                      {results.bidProcessing.testResults.functionExists ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                    </div>
                    {results.bidProcessing.testResults.functionError && (
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-xs">
                          {results.bidProcessing.testResults.functionError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => runTest("bidProcessing", "/api/admin/fix-bid-processing")}
              disabled={loading === "bidProcessing"}
              size="sm"
            >
              {loading === "bidProcessing" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Fix Bid Processing
            </Button>
          </CardContent>
        </Card>

        {/* Season Switching Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Season Switching
              {getStatusIcon(results.seasonSwitching)}
            </CardTitle>
            <CardDescription>
              Test active season switching functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(results.seasonSwitching)}
            </div>
            
            {results.seasonSwitching && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{results.seasonSwitching.message}</p>
                {results.seasonSwitching.testResults && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Seasons Found:</span>
                      <Badge variant="outline">{results.seasonSwitching.testResults.seasonsFound}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Can Test:</span>
                      {results.seasonSwitching.testResults.canTest ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                    </div>
                    {results.seasonSwitching.testResults.switchSuccessful !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Switch Successful:</span>
                        {results.seasonSwitching.testResults.switchSuccessful ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <XCircle className="h-3 w-3 text-red-500" />
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => runTest("seasonSwitching", "/api/admin/fix-all-systems")}
              disabled={loading === "seasonSwitching"}
              size="sm"
            >
              {loading === "seasonSwitching" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Fix All Systems
            </Button>
          </CardContent>
        </Card>

        {/* Bidding Settings Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bidding Settings
              {getStatusIcon(results.biddingSettings)}
            </CardTitle>
            <CardDescription>
              Test bidding settings authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(results.biddingSettings)}
            </div>
            
            {results.biddingSettings && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{results.biddingSettings.message}</p>
                {results.biddingSettings.error && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-xs">
                      {results.biddingSettings.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              onClick={() => runTest("biddingSettings", "/api/admin/fix-all-systems")}
              disabled={loading === "biddingSettings"}
              size="sm"
            >
              {loading === "biddingSettings" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Fix All Systems
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
            <CardDescription>Overview of all test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {getStatusIcon(result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
