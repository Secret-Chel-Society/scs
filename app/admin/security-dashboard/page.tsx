// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Download, Eye, AlertTriangle, Users, Globe } from "lucide-react"

interface SecurityEvent {
  type: string;
  severity: string;
  details: any;
  timestamp: number;
  ip: string;
  userAgent: string;
}

interface DownloadEvent {
  fileType: string;
  filename: string;
  ip: string;
  userAgent: string;
  timestamp: number;
}

export default function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [downloadEvents, setDownloadEvents] = useState<DownloadEvent[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Fetch data directly from Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch code downloads
      const { data: downloads, error: downloadsError } = await supabase
        .from('code_downloads')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!downloadsError && downloads) {
        setDownloadEvents(downloads.map(d => ({
          fileType: d.file_type,
          filename: d.filename,
          ip: d.ip_address,
          userAgent: d.user_agent,
          timestamp: new Date(d.timestamp).getTime()
        })));
      }

      // Fetch security events
      const { data: security, error: securityError } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!securityError && security) {
        setSecurityEvents(security.map(s => ({
          type: s.event_type,
          severity: s.severity,
          details: s.details,
          timestamp: new Date(s.timestamp).getTime(),
          ip: s.ip_address,
          userAgent: s.user_agent
        })));
      }

      // Fetch analytics summary
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!analyticsError && analyticsData) {
        setAnalytics({
          studio: 'Midnight Studios INTl',
          totalEvents: analyticsData.length,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading security dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Midnight Studios INTl - Code Protection Monitoring</p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Total security events detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downloadEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Files downloaded/accessed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Source Map Access</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {downloadEvents.filter(e => e.fileType === 'source_map').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential code inspections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([...securityEvents, ...downloadEvents].map(e => e.ip)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique IP addresses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="downloads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="downloads">Code Downloads</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Download Events</CardTitle>
              <CardDescription>
                Track when your code files are accessed or downloaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {downloadEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No download events recorded yet
                  </p>
                ) : (
                  downloadEvents.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={event.fileType === 'source_map' ? 'destructive' : 'default'}>
                            {event.fileType}
                          </Badge>
                          <span className="font-medium">{event.filename}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>IP:</strong> {event.ip}</p>
                        <p><strong>User Agent:</strong> {event.userAgent}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Monitor suspicious activity and security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No security events detected
                  </p>
                ) : (
                  securityEvents.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="font-medium">{event.type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>IP:</strong> {event.ip}</p>
                        <p><strong>Details:</strong> {JSON.stringify(event.details, null, 2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                General usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics ? (
                  <div className="space-y-2">
                    <p><strong>Studio:</strong> {analytics.studio}</p>
                    <p><strong>Last Updated:</strong> {analytics.timestamp}</p>
                    <p><strong>Status:</strong> {analytics.message}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No analytics data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Monitor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Browser Console</h4>
            <p className="text-sm text-muted-foreground">
              Open Developer Tools (F12) and check the Console tab for real-time tracking logs.
              Look for messages starting with "🔍", "📁", "📦", "🎨", "⚡", or "🚨".
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Server Logs</h4>
            <p className="text-sm text-muted-foreground">
              Check your deployment platform's logs (Vercel, Netlify, etc.) for server-side tracking events.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Database</h4>
            <p className="text-sm text-muted-foreground">
              If you've set up the database tables, query them directly for detailed tracking data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
