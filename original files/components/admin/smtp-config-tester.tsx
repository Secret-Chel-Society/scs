"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SmtpConfigTester() {
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [currentConfig, setCurrentConfig] = useState<any>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleTestConfigs = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminKey) {
      toast({
        title: "Admin key required",
        description: "Please enter the admin key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResults([])
    setCurrentConfig(null)
    setError("")

    try {
      const response = await fetch("/api/admin/test-smtp-configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setResults(data.results)
      setCurrentConfig(data.currentConfig)

      // Check if any configuration was successful
      const anySuccess = data.results.some((result: any) => result.success)

      if (anySuccess) {
        toast({
          title: "SMTP Test Complete",
          description: "At least one SMTP configuration works!",
        })
      } else {
        toast({
          title: "SMTP Test Complete",
          description: "None of the SMTP configurations worked. Check the results for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing SMTP configs:", error)
      setError(error instanceof Error ? error.message : "Failed to test SMTP configurations")

      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Configuration Tester</CardTitle>
        <CardDescription>Test multiple SMTP configurations to find one that works</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleTestConfigs} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Configurations...
              </>
            ) : (
              "Test SMTP Configurations"
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentConfig && (
          <Alert>
            <AlertTitle>Current Configuration</AlertTitle>
            <AlertDescription>
              <div className="text-sm">
                <p>Host: {currentConfig.host}</p>
                <p>Port: {currentConfig.port}</p>
                <p>Secure: {currentConfig.secure ? "Yes" : "No"}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Test Results</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Secure</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.port}</TableCell>
                    <TableCell>{result.secure ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Failed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {results.some((r) => !r.success) && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Error Details</h4>
                <div className="space-y-2">
                  {results
                    .filter((r) => !r.success)
                    .map((result, index) => (
                      <Alert key={index} variant="destructive" className="text-xs">
                        <AlertTitle>
                          {result.name} (Port: {result.port})
                        </AlertTitle>
                        <AlertDescription>
                          <pre className="whitespace-pre-wrap">{result.error}</pre>
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              </div>
            )}

            {results.some((r) => r.success) && (
              <Alert className="mt-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Recommended Configuration</AlertTitle>
                <AlertDescription>
                  {(() => {
                    const working = results.find((r) => r.success)
                    if (working) {
                      return (
                        <div className="text-sm">
                          <p>Use these settings in your environment variables:</p>
                          <pre className="mt-1 p-2 bg-green-100 dark:bg-green-900/40 rounded">
                            SMTP_PORT={working.port}
                            SMTP_SECURE={working.secure ? "true" : "false"}
                          </pre>
                        </div>
                      )
                    }
                    return null
                  })()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          This tool tests multiple SMTP configurations to find one that works with your email provider.
        </p>
      </CardFooter>
    </Card>
  )
}

export default SmtpConfigTester
