"use client"

import { useState, useEffect } from 'react'
import SimpleWaiverManager from '@/components/waivers/SimpleWaiverManager'

export default function TestSimpleWaiverPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock some test players
    setPlayers([
      {
        id: 'test-player-1',
        team_id: 'test-team-1',
        status: 'active',
        salary: 1000000,
        users: {
          gamer_tag_id: 'TestPlayer1',
          primary_position: 'C'
        }
      },
      {
        id: 'test-player-2',
        team_id: 'test-team-1',
        status: 'active',
        salary: 2000000,
        users: {
          gamer_tag_id: 'TestPlayer2',
          primary_position: 'LW'
        }
      }
    ])
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Simple Waiver Manager Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">Test Instructions:</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>This page tests the new Simple Waiver Manager component</li>
          <li>Try waiving a test player - it should work without errors</li>
          <li>Check the browser console for detailed logs</li>
          <li>Expected: 404 "Player not found" error (correct for test data)</li>
        </ul>
      </div>

      <SimpleWaiverManager
        teamId="test-team-1"
        teamName="Test Team"
        players={players}
        onPlayerWaived={() => {
          console.log('Player waived callback triggered')
        }}
      />
    </div>
  )
}
