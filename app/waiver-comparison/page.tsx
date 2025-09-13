// Midnight Studios INTl - All rights reserved
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  Code,
  Database,
  Zap,
  Shield,
  Smartphone,
  Palette
} from "lucide-react"
import Link from "next/link"

const comparisonData = {
  oldSystem: {
    name: "Waiver System V2",
    status: "Broken",
    issues: [
      "500 Internal Server Errors",
      "JSON parsing failures",
      "Response body consumed errors",
      "Outdated UI design",
      "Poor error handling",
      "No priority management",
      "Limited functionality"
    ],
    endpoints: [
      "/api/waivers/v2",
      "/api/waivers/check-expired",
      "/api/waivers/claim"
    ],
    features: [
      "Basic waiver creation",
      "Simple claim system",
      "Basic UI"
    ]
  },
  newSystem: {
    name: "Waiver System V3",
    status: "Fully Functional",
    improvements: [
      "Robust error handling",
      "Valid JSON responses",
      "Comprehensive logging",
      "Modern UI with hockey theme",
      "Complete priority system",
      "Real-time updates",
      "Mobile responsive design",
      "Admin management tools"
    ],
    endpoints: [
      "/api/waivers/v3",
      "/api/waivers/v3/reset-priority",
      "/api/waivers/v3/process",
      "/api/cron/process-waivers-v3"
    ],
    features: [
      "Complete waiver management",
      "Priority-based claiming",
      "Team roster management",
      "Real-time status updates",
      "Comprehensive error handling",
      "Admin priority management",
      "Automated processing",
      "Modern responsive UI"
    ]
  }
}

export default function WaiverComparisonPage() {
  const [selectedTab, setSelectedTab] = useState("overview")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Waiver System Comparison</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Old vs New: Complete system overhaul and improvements
        </p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/test-waiver-v2" className="group">
          <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-red-200 hover:border-red-400">
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2 group-hover:text-red-400 transition-colors" />
              <h3 className="font-semibold text-lg mb-1">Old System (V2)</h3>
              <p className="text-sm text-muted-foreground">Broken - 500 errors</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/test-waiver-v3" className="group">
          <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-green-200 hover:border-green-400">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
              <h3 className="font-semibold text-lg mb-1">New System (V3)</h3>
              <p className="text-sm text-muted-foreground">Fully functional</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/management/waivers" className="group">
          <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-blue-200 hover:border-blue-400">
            <CardContent className="p-6 text-center">
              <Database className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
              <h3 className="font-semibold text-lg mb-1">Live System</h3>
              <p className="text-sm text-muted-foreground">Production interface</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Comparison Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues Fixed</TabsTrigger>
          <TabsTrigger value="features">New Features</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old System */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  {comparisonData.oldSystem.name}
                </CardTitle>
                <CardDescription>
                  Previous implementation with critical issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="destructive" className="mb-4">
                  {comparisonData.oldSystem.status}
                </Badge>
                
                <div>
                  <h4 className="font-semibold mb-2">Critical Issues:</h4>
                  <ul className="space-y-1 text-sm">
                    {comparisonData.oldSystem.issues.map((issue, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-500" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Available Features:</h4>
                  <ul className="space-y-1 text-sm">
                    {comparisonData.oldSystem.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* New System */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  {comparisonData.newSystem.name}
                </CardTitle>
                <CardDescription>
                  Complete rewrite with modern architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className="bg-green-100 text-green-800 mb-4">
                  {comparisonData.newSystem.status}
                </Badge>
                
                <div>
                  <h4 className="font-semibold mb-2">Key Improvements:</h4>
                  <ul className="space-y-1 text-sm">
                    {comparisonData.newSystem.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">New Features:</h4>
                  <ul className="space-y-1 text-sm">
                    {comparisonData.newSystem.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Issues Fixed Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Issues Resolved
              </CardTitle>
              <CardDescription>
                All major problems from the old system have been fixed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    issue: "500 Internal Server Errors",
                    description: "Server was returning 500 errors for most waiver operations",
                    solution: "Comprehensive error handling with proper HTTP status codes and detailed error messages",
                    icon: <XCircle className="h-5 w-5 text-red-500" />
                  },
                  {
                    issue: "JSON Parsing Failures",
                    description: "Client was receiving invalid JSON responses causing parsing errors",
                    solution: "All API responses now return valid JSON with consistent structure",
                    icon: <Code className="h-5 w-5 text-red-500" />
                  },
                  {
                    issue: "Response Body Consumed Errors",
                    description: "Multiple attempts to read response body causing errors",
                    solution: "Proper response handling with single read operations",
                    icon: <Database className="h-5 w-5 text-red-500" />
                  },
                  {
                    issue: "Poor Error Handling",
                    description: "No user feedback for errors, making debugging difficult",
                    solution: "Comprehensive error logging and user-friendly error messages",
                    icon: <Shield className="h-5 w-5 text-red-500" />
                  },
                  {
                    issue: "Outdated UI Design",
                    description: "Basic interface without modern design principles",
                    solution: "Complete UI overhaul with hockey theme and responsive design",
                    icon: <Palette className="h-5 w-5 text-red-500" />
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {item.icon}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{item.issue}</h3>
                            <p className="text-muted-foreground mb-2">{item.description}</p>
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-700 font-medium">{item.solution}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Management Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Complete waiver management dashboard",
                  "Real-time status updates",
                  "Team roster management",
                  "Priority system visualization",
                  "Search and filter capabilities",
                  "Mobile responsive design"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "RESTful API design",
                  "Comprehensive error handling",
                  "Input validation and sanitization",
                  "Detailed logging and monitoring",
                  "Automated processing",
                  "Admin management tools"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Old System (V2)</CardTitle>
                <CardDescription>Previous implementation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">API Endpoints:</h4>
                  <div className="space-y-1">
                    {comparisonData.oldSystem.endpoints.map((endpoint, index) => (
                      <code key={index} className="block text-xs bg-gray-100 p-2 rounded">
                        {endpoint}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Issues:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• No error handling</li>
                    <li>• Invalid JSON responses</li>
                    <li>• No validation</li>
                    <li>• Basic UI only</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New System (V3)</CardTitle>
                <CardDescription>Modern implementation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">API Endpoints:</h4>
                  <div className="space-y-1">
                    {comparisonData.newSystem.endpoints.map((endpoint, index) => (
                      <code key={index} className="block text-xs bg-green-100 p-2 rounded">
                        {endpoint}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Improvements:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Comprehensive error handling</li>
                    <li>• Valid JSON responses</li>
                    <li>• Input validation</li>
                    <li>• Modern responsive UI</li>
                    <li>• Real-time updates</li>
                    <li>• Admin tools</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Use the New System?</h2>
          <p className="text-muted-foreground mb-6">
            The new waiver system is fully functional and ready for production use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/management/waivers">
              <Button size="lg" className="w-full sm:w-auto">
                <Database className="h-5 w-5 mr-2" />
                Access Waiver Management
              </Button>
            </Link>
            <Link href="/test-waiver-v3">
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
