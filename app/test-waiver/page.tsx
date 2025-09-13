"use client"

import { useState } from 'react'

export default function TestWaiverPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testWaiverAPI = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Testing waiver API...')
      
      const response = await fetch('/api/waivers/simple', {
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
      
      const data = await response.json()
      
      console.log('🧪 API Response:', { status: response.status, data })
      
      setResult({
        status: response.status,
        data: data,
        success: response.ok
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Waiver API Test</h1>
      
      <button
        onClick={testWaiverAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Waiver API'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            {result.data && (
              <div>
                <p><strong>Data:</strong></p>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            {result.error && (
              <p><strong>Error:</strong> {result.error}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>This test will try to waive a player with test IDs. It should fail with a "Player not found" error, which means the API is working correctly.</p>
      </div>
    </div>
  )
}
