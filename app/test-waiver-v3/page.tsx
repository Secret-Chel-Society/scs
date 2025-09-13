// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSupabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Gavel, 
  Users, 
  Trophy,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code,
  Database,
  Zap
} from "lucide-react"
import Link from "next/link"

interface TestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  data: any
  error?: string
  timestamp: string
}

export default function TestWaiverV3Page() {
  const { supabase, session } = useSupabase()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [teamData, setTeamData] = useState<any>(null)
  const [waivers, setWaivers] = useState<any[]>([])
  const [priority, setPriority] = useState<any[]>([])

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      if (!session?.user) return

      const { data: player } = await supabase
        .from('players')
        .select(`
          team_id,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .eq('user_id', session.user.id)
        .single()

      if (player?.team_id) {
        setTeamData(player.teams)
      }
    } catch (error) {
      console.error('Error loading team data:', error)
    }
  }

  const runTest = async (endpoint: string, method: string, body?: any) => {
    const startTime = new Date()
    setLoading(true)
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()
      const endTime = new Date()
      
      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data,
        error: response.ok ? undefined : data.error || 'Unknown error',
        timestamp: endTime.toISOString()
      }

      setTestResults(prev => [result, ...prev])
      
      // If this was a waivers fetch, update the waivers state
      if (endpoint.includes('/api/waivers/v3') && method === 'GET') {
        setWaivers(data.waivers || [])
      }
      
      // If this was a priority fetch, update the priority state
      if (endpoint.includes('/api/waivers/v3/reset-priority') && method === 'POST') {
        setPriority(data.priority || [])
      }

      return result
    } catch (error) {
      const endTime = new Date()
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        timestamp: endTime.toISOString()
      }
      setTestResults(prev => [result, ...prev])
      return result
    } finally {
      setLoading(false)
    }
  }

  const testAllEndpoints = async () => {
    setTestResults([])
    
    // Test 1: Get active waivers
    await runTest('/api/waivers/v3?status=active', 'GET')
    
    // Test 2: Get all waivers
    await runTest('/api/waivers/v3?status=all', 'GET')
    
    // Test 3: Test waiver claim (will fail without valid IDs, but tests the endpoint)
    await runTest('/api/waivers/v3', 'POST', {
      action: 'claim_waiver',
      waiverId: 'test-waiver-id',
      teamId: teamData?.id || 'test-team-id'
    })
    
    // Test 4: Test waive player (will fail without valid IDs, but tests the endpoint)
    await runTest('/api/waivers/v3', 'POST', {
      action: 'waive_player',
      playerId: 'test-player-id',
      teamId: teamData?.id || 'test-team-id',
      userId: session?.user?.id || 'test-user-id'
    })
    
    // Test 5: Test process expired waivers
    await runTest('/api/waivers/v3', 'POST', {
      action: 'process_expired'
    })
    
    // Test 6: Test get team priority
    if (teamData?.id) {
      await runTest('/api/waivers/v3', 'POST', {
        action: 'get_team_priority',
        teamId: teamData.id
      })
    }
    
    // Test 7: Test reset priority (admin function)
    await runTest('/api/waivers/v3/reset-priority', 'POST')
    
    // Test 8: Test manual processing
    await runTest('/api/waivers/v3/process', 'POST')
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800'
    if (status >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Waiver System V3 - Deep Dive Test</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Complete testing and demonstration of the new waiver system
        </p>
        
        {teamData && (
          <Alert className="max-w-md mx-auto">
            <Users className="h-4 w-4" />
            <AlertDescription>
              Testing as: <strong>{teamData.name}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Access to New Waiver System
          </CardTitle>
          <CardDescription>
            Click these links to access the actual waiver management interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/management/waivers" className="group">
              <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-blue-200 hover:border-blue-400">
                <CardContent className="p-6 text-center">
                  <Gavel className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Waiver Management</h3>
                  <p className="text-sm text-muted-foreground">Main waiver interface with all features</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/management/waivers/priority" className="group">
              <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-green-200 hover:border-green-400">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Priority Management</h3>
                  <p className="text-sm text-muted-foreground">Manage team waiver priority order</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* API Testing Section */}
      <Tabs defaultValue="testing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="waivers">Live Waivers</TabsTrigger>
          <TabsTrigger value="priority">Priority System</TabsTrigger>
        </TabsList>

        {/* API Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Endpoint Testing
              </CardTitle>
              <CardDescription>
                Test all the new waiver system API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testAllEndpoints} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Run All Tests
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setTestResults([])}
                >
                  Clear Results
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Results:</h3>
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.success)}
                              <span className="font-mono text-sm">{result.method}</span>
                              <span className="font-mono text-sm text-muted-foreground">{result.endpoint}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(result.status)}>
                                {result.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          
                          {result.error && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                              <p className="text-sm text-red-800">
                                <strong>Error:</strong> {result.error}
                              </p>
                            </div>
                          )}
                          
                          {result.data && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Response Data
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Waivers Tab */}
        <TabsContent value="waivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Live Waiver Data
              </CardTitle>
              <CardDescription>
                Real-time data from the waiver system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {waivers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{waivers.length}</div>
                      <div className="text-sm text-muted-foreground">Total Waivers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {waivers.filter(w => w.status === 'active').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {waivers.filter(w => w.status === 'claimed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Claimed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {waivers.slice(0, 5).map((waiver, index) => (
                      <motion.div
                        key={waiver.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  {waiver.players?.users?.gamer_tag_id || 'Unknown Player'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {waiver.players?.users?.primary_position} • 
                                  ${waiver.players?.salary?.toLocaleString()} • 
                                  Waived by {waiver.waiving_team?.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(200)}>
                                  {waiver.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(waiver.waived_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No waiver data loaded. Run the API tests to fetch data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Priority System Tab */}
        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Waiver Priority System
              </CardTitle>
              <CardDescription>
                Team priority order and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priority.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">1</div>
                      <div className="text-sm text-muted-foreground">Highest Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {priority.filter(p => p.priority <= 3).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Top 3 Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {priority.filter(p => p.priority <= 6).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Top 6 Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {priority.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Teams</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {priority.slice(0, 10).map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            <span className="text-sm font-semibold">{team.priority}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{team.teams?.name || 'Unknown Team'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Last used: {team.last_used ? new Date(team.last_used).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <Badge className={team.priority === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                          {team.priority === 1 ? 'Next to Claim' : `#${team.priority}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No priority data loaded. Run the API tests to fetch data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>New Waiver System V3 Features</CardTitle>
          <CardDescription>
            Complete overview of what's been built
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">API Endpoints</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/api/waivers/v3</code> - Main waiver operations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/api/waivers/v3/reset-priority</code> - Reset priority order
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/api/waivers/v3/process</code> - Manual processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/api/cron/process-waivers-v3</code> - Automated processing
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">UI Components</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/management/waivers</code> - Main waiver interface
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code>/management/waivers/priority</code> - Priority management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Navigation integration in management area
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Responsive design with hockey theme
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
