// Midnight Studios INTl - All rights reserved
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  Gavel, 
  Users, 
  Trophy,
  ExternalLink,
  Globe,
  Zap,
  Settings,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function WaiverGuidePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Secret Chel Society - Waiver System V3</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Complete guide to accessing the new waiver system on your production site
        </p>
        
        <Badge variant="outline" className="flex items-center gap-2 w-fit mx-auto">
          <Globe className="h-4 w-4" />
          secretchelsociety.com
        </Badge>
      </div>

      {/* Quick Access */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Zap className="h-5 w-5" />
            Quick Access Links
          </CardTitle>
          <CardDescription>
            Direct links to access the new waiver system on Secret Chel Society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/management/waivers" className="group">
              <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-blue-200 hover:border-blue-400">
                <CardContent className="p-6 text-center">
                  <Gavel className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Waiver Management</h3>
                  <p className="text-sm text-muted-foreground">Main waiver interface</p>
                  <code className="text-xs text-blue-600 mt-2 block">
                    /management/waivers
                  </code>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/management/waivers/priority" className="group">
              <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-green-200 hover:border-green-400">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Priority Management</h3>
                  <p className="text-sm text-muted-foreground">Team priority system</p>
                  <code className="text-xs text-green-600 mt-2 block">
                    /management/waivers/priority
                  </code>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/management" className="group">
              <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-purple-200 hover:border-purple-400">
                <CardContent className="p-6 text-center">
                  <Settings className="h-8 w-8 text-purple-500 mx-auto mb-2 group-hover:text-purple-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Management Hub</h3>
                  <p className="text-sm text-muted-foreground">All team management tools</p>
                  <code className="text-xs text-purple-600 mt-2 block">
                    /management
                  </code>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Full URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Complete URLs for Secret Chel Society
          </CardTitle>
          <CardDescription>
            Full URLs to access the waiver system on your production site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Main Waiver System</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1">
                      https://www.secretchelsociety.com/management/waivers
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Complete waiver management interface with all features
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Priority Management</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1">
                      https://www.secretchelsociety.com/management/waivers/priority
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Team priority order and management system
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Management Hub</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1">
                      https://www.secretchelsociety.com/management
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main management dashboard with navigation
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">System Testing</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1">
                      https://www.secretchelsociety.com/waiver-deployment
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Test and monitor the waiver system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's New */}
      <Card>
        <CardHeader>
          <CardTitle>What's New in Waiver System V3</CardTitle>
          <CardDescription>
            Complete overhaul of the waiver system for Secret Chel Society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">✅ Fixed Issues</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>500 Internal Server Errors resolved</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>JSON parsing failures fixed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Response body consumed errors eliminated</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Comprehensive error handling added</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-blue-600">🚀 New Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Modern hockey-themed UI design</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Complete priority management system</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Real-time status updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Mobile responsive design</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the New Waiver System</CardTitle>
          <CardDescription>
            Step-by-step guide to using the waiver system on Secret Chel Society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Access the System</h3>
                <p className="text-sm text-muted-foreground">
                  Go to <code className="bg-gray-100 px-2 py-1 rounded">https://www.secretchelsociety.com/management/waivers</code> 
                  or click the "Waiver System" card in the management hub.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Browse Active Waivers</h3>
                <p className="text-sm text-muted-foreground">
                  View all available players on waivers, their details, and time remaining for claims.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Claim Players</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Claim" on any available player to submit a waiver claim using your team's priority.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold">Manage Your Team</h3>
                <p className="text-sm text-muted-foreground">
                  Go to "My Team" tab to waive players from your roster or view your current team.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                5
              </div>
              <div>
                <h3 className="font-semibold">Monitor Priority</h3>
                <p className="text-sm text-muted-foreground">
                  Check your team's waiver priority and see the current order at 
                  <code className="bg-gray-100 px-2 py-1 rounded">/management/waivers/priority</code>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Use the New Waiver System?</h2>
          <p className="text-muted-foreground mb-6">
            The new waiver system is fully functional and ready for use on Secret Chel Society.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/management/waivers">
              <Button size="lg" className="w-full sm:w-auto">
                <Gavel className="h-5 w-5 mr-2" />
                Access Waiver Management
              </Button>
            </Link>
            <Link href="/waiver-deployment">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Zap className="h-5 w-5 mr-2" />
                Test the System
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
