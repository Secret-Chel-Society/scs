"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { fetchWaivers, waivePlayer, claimPlayer, cancelWaiver } from '@/lib/waivers'

export default function TestWaiversPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [waivers, setWaivers] = useState<any[]>([])

  const tests = [
    {
      name: 'Fetch Waivers',
      action: async () => {
        const result = await fetchWaivers('active')
        return result
      }
    },
    {
      name: 'Test Waive Player (Invalid)',
      action: async () => {
        const result = await waivePlayer('invalid-player-id', 'invalid-team-id')
        return result
      }
    },
    {
      name: 'Test Claim Player (Invalid)',
      action: async () => {
        const result = await claimPlayer('invalid-waiver-id', 'invalid-team-id')
        return result
      }
    },
    {
      name: 'Test Cancel Waiver (Invalid)',
      action: async () => {
        const result = await cancelWaiver('invalid-waiver-id', 'invalid-team-id')
        return result
      }
    }
  ]

  const runTest = async (test: any) => {
    setLoading(true)
    try {
      console.log(`🧪 Running test: ${test.name}`)
      const result = await test.action()
      
      setResults(prev => [...prev, {
        name: test.name,
        result,
        timestamp: new Date().toISOString()
      }])
      
      console.log(`✅ Test ${test.name} completed:`, result)
    } catch (error) {
      console.error(`❌ Test ${test.name} failed:`, error)
      setResults(prev => [...prev, {
        name: test.name,
        result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setResults([])
    for (const test of tests) {
      await runTest(test)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const loadWaivers = async () => {
    setLoading(true)
    try {
      const result = await fetchWaivers('active')
      if (result.success && result.waivers) {
        setWaivers(result.waivers)
      }
    } catch (error) {
      console.error('Failed to load waivers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Waiver System Test Page</h1>
      
      <div className="grid gap-8">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>API Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run All Tests'}
              </Button>
              <Button onClick={loadWaivers} variant="outline" disabled={loading}>
                Load Waivers
              </Button>
            </div>
            
            <div className="grid gap-2">
              {tests.map((test, index) => (
                <Button
                  key={index}
                  onClick={() => runTest(test)}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {test.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{result.name}</h3>
                      <div className="flex items-center space-x-2">
                        {result.result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded text-sm ${
                      result.result.success 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Waivers */}
        <Card>
          <CardHeader>
            <CardTitle>Current Waivers ({waivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {waivers.length === 0 ? (
              <p className="text-gray-500">No waivers found</p>
            ) : (
              <div className="space-y-2">
                {waivers.map((waiver) => (
                  <div key={waiver.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {waiver.players?.users?.gamer_tag_id || 'Unknown Player'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {waiver.waiving_team?.name} • {waiver.status} • 
                          Expires: {new Date(waiver.claim_deadline).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {waiver.waiver_claims?.length || 0} claims
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Instructions:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Click "Run All Tests" to test all API endpoints</li>
              <li>Click "Load Waivers" to fetch current waivers</li>
              <li>Individual test buttons test specific functions</li>
              <li>Invalid tests should return appropriate error messages</li>
              <li>Check the browser console for detailed logs</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
