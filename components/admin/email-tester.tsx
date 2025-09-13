"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function EmailTester() {
  const [email, setEmail] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)
  const [suggestion, setSuggestion] = useState("")
  const { toast } = useToast()

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !adminKey) {
      toast({
        title: "Required fields missing",
        description: "Please enter both email and admin key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStatus("idle")
    setMessage("")
    setDetails(null)
    setSuggestion("")

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, adminKey }),
      })

      let data
      let responseText = ""

      try {
        // Parse as JSON
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        // Try to get text for debugging (response body already consumed)
        try {
          responseText = "Response body already consumed"
        } catch (textError) {
          responseText = "Unable to read response text"
        }
        throw new Error(`Server returned invalid JSON response: ${responseText || "Unable to read response text"}`)
      }

      if (!response.ok) {
        setSuggestion(data?.suggestion || "")
        throw new Error(data?.error || `Server error: ${response.status}`)
      }

      setStatus("success")
      setMessage("Test email sent successfully!")
      setDetails(data)

      toast({
        title: "Email sent",
        description: "Test email sent successfully",
      })
    } catch (error) {
      console.error("Error sending test email:", error)
      setStatus("error")

      // Handle DNS lookup errors specifically
      const errorMessage = error instanceof Error ? error.message : "Failed to send test email"
      setMessage(errorMessage)

      if (errorMessage.includes("dns.lookup")) {
        setSuggestion(
          "DNS lookup failed. This is a limitation of the preview environment. Try using an IP address for your SMTP host or test in a deployed environment.",
        )
      }

      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to try alternative SMTP settings
  const tryAlternativeSettings = async () => {
    // This would be implemented to try different port/security combinations
    toast({
      title: "Alternative settings",
      description: "This feature is not yet implemented",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email System Tester</CardTitle>
        <CardDescription>Test the email system configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleTestEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

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
                Sending...
              </>
            ) : (
              "Send Test Email"
            )}
          </Button>
        </form>

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Email Sent!</AlertTitle>
            <AlertDescription>
              {message}
              {details && (
                <div className="mt-2 text-xs">
                  <p>Message ID: {details.messageId}</p>
                  {details.alternativeUsed && (
                    <p className="mt-1 font-semibold">Note: Alternative SMTP settings were used.</p>
                  )}
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="config">
                      <AccordionTrigger className="text-xs">Configuration Details</AccordionTrigger>
                      <AccordionContent>
                        <pre className="p-2 bg-green-100 dark:bg-green-900/40 rounded overflow-x-auto">
                          {JSON.stringify(details.config, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{message}</p>

              {suggestion && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                  <p className="text-sm font-medium flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Suggestion:
                  </p>
                  <p className="text-sm mt-1">{suggestion}</p>
                </div>
              )}

              {details && (
                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="details">
                    <AccordionTrigger className="text-xs">Technical Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs">
                        {details.details && (
                          <div className="mt-1">
                            <p className="font-semibold">Error Details:</p>
                            <pre className="p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-x-auto mt-1">
                              {details.details}
                            </pre>
                          </div>
                        )}

                        {details.config && (
                          <div className="mt-2">
                            <p className="font-semibold">Configuration:</p>
                            <pre className="p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-x-auto mt-1">
                              {JSON.stringify(details.config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="mt-3">
                <Button variant="outline" size="sm" className="text-xs" onClick={tryAlternativeSettings}>
                  Try Alternative Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground space-y-1 w-full">
          <p>This tool is for administrators to test the email system configuration.</p>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="troubleshooting">
              <AccordionTrigger className="text-xs">Troubleshooting Tips</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verify your SMTP host and port are correct</li>
                  <li>Check that your username and password are valid</li>
                  <li>For SSL/TLS (port 465), ensure SMTP_SECURE is set to "true"</li>
                  <li>For STARTTLS (port 587), ensure SMTP_SECURE is set to "false"</li>
                  <li>Some email providers require app-specific passwords</li>
                  <li>Check if your email provider blocks connections from new locations</li>
                  <li>
                    The preview environment has limitations with DNS lookups. For full testing, deploy your application.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardFooter>
    </Card>
  )
}

export default EmailTester
