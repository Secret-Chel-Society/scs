"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestResetPage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCodeExchange = async () => {
    if (!code) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const supabase = createClient()
      
      console.log("Testing code exchange with:", code)
      
      // Try exchangeCodeForSession
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("exchangeCodeForSession failed:", error)
        
        // Try verifyOtp
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: "recovery"
        })
        
        if (otpError) {
          setResult({
            success: false,
            method1: { error: error.message },
            method2: { error: otpError.message }
          })
        } else {
          setResult({
            success: true,
            method: "verifyOtp",
            data: otpData
          })
        }
      } else {
        setResult({
          success: true,
          method: "exchangeCodeForSession",
          data: data
        })
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Password Reset Code Exchange</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reset Code:</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the code from the reset URL here"
              className="w-full"
            />
          </div>
          
          <Button onClick={testCodeExchange} disabled={loading || !code}>
            {loading ? "Testing..." : "Test Code Exchange"}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
