'use client'

import { useState, useEffect } from 'react'

interface Player {
  id: string
  name: string
  position: string
  overall_rating: number
  salary: number
  team_id?: string
}

interface Team {
  id: string
  name: string
  logo_url: string
}

interface Waiver {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: string
  winning_team_id?: string
  processed_at?: string
  players: Player
  waiving_team: Team
  winning_team?: Team
}

export default function WaiverWire() {
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [userTeamId, setUserTeamId] = useState<string>('4250000') // Your team ID
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [processing, setProcessing] = useState<string>('')

  useEffect(() => {
    loadWaiverData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadWaiverData()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadWaiverData = async () => {
    try {
      setError('')
      console.log('🔄 Loading waiver data...')
      
      const response = await fetch('/api/waivers?status=active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ API Response Error:', response.status, errorData)
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load waivers')
      }

      console.log('✅ Waivers loaded:', data.waivers?.length || 0)
      setWaivers(data.waivers || [])
      
    } catch (err) {
      console.error('❌ Load waivers error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load waivers')
    } finally {
      setLoading(false)
    }
  }

  const claimPlayer = async (waiverId: string) => {
    if (!userTeamId) {
      setError('Please select your team first')
      return
    }

    try {
      setProcessing(waiverId)
      setError('')

      console.log('📝 Submitting waiver claim...', { waiverId, userTeamId })

      const response = await fetch('/api/waivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim',
          waiverId,
          teamId: userTeamId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to claim player')
      }

      console.log('✅ Claim successful:', data.message)
      
      // Refresh waiver data
      await loadWaiverData()
      
      // Show success message
      alert('Waiver claim submitted successfully!')

    } catch (err) {
      console.error('❌ Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim player')
    } finally {
      setProcessing('')
    }
  }

  const processExpiredWaivers = async () => {
    try {
      setProcessing('expired')
      setError('')

      console.log('⚡ Processing expired waivers...')

      const response = await fetch('/api/waivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_expired'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process expired waivers')
      }

      console.log('✅ Processed expired waivers:', data.processedWaivers?.length || 0)
      
      await loadWaiverData()
      alert(`Processed ${data.processedWaivers?.length || 0} expired waivers`)

    } catch (err) {
      console.error('❌ Process expired error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process expired waivers')
    } finally {
      setProcessing('')
    }
  }

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date()
    const end = new Date(deadline)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'EXPIRED'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Waiver Wire
        </h1>
        <div className="flex gap-4">
          <button
            onClick={processExpiredWaivers}
            disabled={processing === 'expired'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing === 'expired' ? 'Processing...' : 'Process Expired'}
          </button>
          <button
            onClick={loadWaiverData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Waiver Process Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">
          Waiver Process
        </h2>
        <div className="space-y-2 text-blue-800 dark:text-blue-200">
          <p>• Players are placed on waivers for 8 hours</p>
          <p>• You can cancel within 30 minutes of waiving</p>
          <p>• Teams can claim players based on waiver priority (worst record gets first priority)</p>
          <p>• If multiple teams claim, highest priority wins</p>
          <p>• Winning team moves to bottom of waiver priority</p>
          <p>• Unclaimed players become free agents</p>
          <p>• Waivers are automatically processed when they expire</p>
        </div>
      </div>

      {/* Available Players */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Available Players</h2>
        {waivers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No players currently on waivers</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4">Player</th>
                  <th className="text-left py-3 px-4">Position</th>
                  <th className="text-left py-3 px-4">Rating</th>
                  <th className="text-left py-3 px-4">Salary</th>
                  <th className="text-left py-3 px-4">Waiving Team</th>
                  <th className="text-left py-3 px-4">Time Remaining</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {waivers.map((waiver) => (
                  <tr key={waiver.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 font-medium">{waiver.players.name}</td>
                    <td className="py-3 px-4">{waiver.players.position}</td>
                    <td className="py-3 px-4">{waiver.players.overall_rating}</td>
                    <td className="py-3 px-4">${waiver.players.salary?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4">{waiver.waiving_team.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        formatTimeRemaining(waiver.claim_deadline) === 'EXPIRED' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {formatTimeRemaining(waiver.claim_deadline)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => claimPlayer(waiver.id)}
                        disabled={processing === waiver.id || formatTimeRemaining(waiver.claim_deadline) === 'EXPIRED'}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {processing === waiver.id ? 'Claiming...' : 'Claim'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
