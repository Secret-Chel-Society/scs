"use client"

import { useState } from 'react'

export default function TestWaiverV2Page() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testWaiverV2API = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Testing waiver v2 API...')
      
      // Test GET request
      const getResponse = await fetch('/api/waivers/v2?status=active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const getData = await getResponse.json()
      console.log('🧪 GET Response:', { status: getResponse.status, data: getData })
      
      // Test POST request
      const postResponse = await fetch('/api/waivers/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'waive',
          playerId: 'test-player-id',
          teamId: 'test-team-id'
        })
      })
      
      const postData = await postResponse.json()
      console.log('🧪 POST Response:', { status: postResponse.status, data: postData })
      
      setResult({
        get: {
          status: getResponse.status,
          data: getData,
          success: getResponse.ok
        },
        post: {
          status: postResponse.status,
          data: postData,
          success: postResponse.ok
        }
      })
      
    } catch (error) {
      console.error('🧪 Test error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Waiver V2 API Test</h1>
      
      <button
        onClick={testWaiverV2API}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Testing...' : 'Test Waiver V2 API'}
      </button>
      
      {result && (
        <div className="space-y-6">
          {result.error ? (
            <div className="p-4 bg-red-100 text-red-800 rounded">
              <h2 className="text-lg font-semibold mb-2">Error:</h2>
              <p>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="p-4 border rounded">
                <h2 className="text-lg font-semibold mb-2">GET /api/waivers/v2?status=active</h2>
                <div className={`p-3 rounded ${result.get.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p><strong>Status:</strong> {result.get.status}</p>
                  <p><strong>Success:</strong> {result.get.success ? 'Yes' : 'No'}</p>
                  <div className="mt-2">
                    <p><strong>Data:</strong></p>
                    <pre className="mt-2 text-sm overflow-auto bg-gray-100 p-2 rounded">
                      {JSON.stringify(result.get.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded">
                <h2 className="text-lg font-semibold mb-2">POST /api/waivers/v2 (waive action)</h2>
                <div className={`p-3 rounded ${result.post.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p><strong>Status:</strong> {result.post.status}</p>
                  <p><strong>Success:</strong> {result.post.success ? 'Yes' : 'No'}</p>
                  <div className="mt-2">
                    <p><strong>Data:</strong></p>
                    <pre className="mt-2 text-sm overflow-auto bg-gray-100 p-2 rounded">
                      {JSON.stringify(result.post.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Expected Results:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>GET:</strong> Should return 200 with waivers array (may be empty)</li>
          <li><strong>POST:</strong> Should return 404 with "Player not found" (correct for test data)</li>
          <li>Both should work without 500 errors</li>
        </ul>
      </div>
    </div>
  )
}
