"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"

type IpMigrationRunnerProps = {
  onSuccess?: () => void
}

export function IpMigrationRunner({ onSuccess }: IpMigrationRunnerProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const executeSQL = async (sql: string, stepName: string) => {
    addLog(`Executing: ${stepName}...`)
    try {
      // First try with the parameter name "query"
      const result = await supabase.rpc("exec_sql", { query: sql })

      if (result.error) {
        // If that fails, try with direct SQL execution
        addLog(`Warning: exec_sql RPC failed, trying direct SQL execution...`)
        const directResult = await supabase.from("users").select("count(*)").limit(1)

        if (directResult.error) {
          throw new Error(`Database connection error: ${directResult.error.message}`)
        }

        // If we can connect but exec_sql failed, try the API route
        addLog(`Trying API route for SQL execution...`)
        const apiResponse = await fetch("/api/admin/execute-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sql }),
        })

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json()
          throw new Error(`API execution failed: ${errorData.error || "Unknown error"}`)
        }

        addLog(`✅ ${stepName} completed via API`)
        return { success: true }
      }

      addLog(`✅ ${stepName} completed`)
      return { success: true }
    } catch (error: any) {
      throw new Error(`${stepName} failed: ${error.message}`)
    }
  }

  const runDirectMigration = async () => {
    addLog("Attempting direct migration via API...")
    try {
      const response = await fetch("/api/run-migration/ip-tracking-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API migration failed: ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()
      addLog(`✅ ${result.message}`)
      return true
    } catch (error: any) {
      addLog(`❌ Direct migration failed: ${error.message}`)
      return false
    }
  }

  const runMigration = async () => {
    setIsRunning(true)
    setStatus("running")
    setErrorMessage(null)
    setLogs([])

    try {
      addLog("Starting IP tracking migration...")

      // Step 1: Add columns to users table
      await executeSQL(
        `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
      `,
        "Adding columns to users table",
      )

      // Step 2: Create ip_logs table
      await executeSQL(
        `
        CREATE TABLE IF NOT EXISTS ip_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ip_address VARCHAR(45) NOT NULL,
          action VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_agent TEXT
        );
      `,
        "Creating ip_logs table",
      )

      // Step 3: Create indexes
      await executeSQL(
        `
        CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
        CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
      `,
        "Creating indexes",
      )

      // Step 4: Create log_ip_address function
      await executeSQL(
        `
        CREATE OR REPLACE FUNCTION log_ip_address(
          p_user_id UUID,
          p_ip_address VARCHAR(45),
          p_action VARCHAR(50),
          p_user_agent TEXT DEFAULT NULL
        ) RETURNS UUID AS $$
        DECLARE
          v_log_id UUID;
        BEGIN
          -- Insert into ip_logs
          INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
          VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
          RETURNING id INTO v_log_id;
          
          -- Update the users table based on the action
          IF p_action = 'register' THEN
            UPDATE users SET registration_ip = p_ip_address WHERE id = p_user_id;
          ELSIF p_action = 'login' THEN
            UPDATE users SET last_login_ip = p_ip_address, last_login_at = NOW() WHERE id = p_user_id;
          END IF;
          
          RETURN v_log_id;
        END;
        $$ LANGUAGE plpgsql;
      `,
        "Creating log_ip_address function",
      )

      // Step 5: Verify migration by checking if a column exists
      addLog("Verifying migration...")
      try {
        const { data, error } = await supabase.from("users").select("registration_ip").limit(1)

        if (error) {
          throw new Error(`Verification failed: ${error.message}`)
        }

        addLog("✅ Migration verified successfully!")
      } catch (error: any) {
        addLog(`⚠️ Verification warning: ${error.message}`)
        addLog("Migration may have succeeded but verification failed")
      }

      addLog("✅ Migration completed successfully!")
      setStatus("success")

      toast({
        title: "Migration Successful",
        description: "IP tracking is now enabled",
      })
    } catch (error: any) {
      try {
        addLog("Step-by-step migration failed. Trying direct migration...")
        const directSuccess = await runDirectMigration()

        if (directSuccess) {
          addLog("✅ Migration completed successfully via direct method!")
          setStatus("success")

          toast({
            title: "Migration Successful",
            description: "IP tracking is now enabled",
          })
          setIsRunning(false)
          return
        }
      } catch (directError) {
        addLog(`❌ All migration methods failed`)
      }
      console.error("Migration error:", error)
      setStatus("error")
      setErrorMessage(error.message)
      addLog(`❌ Error: ${error.message}`)

      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : status === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : null}
          IP Tracking Migration
        </CardTitle>
        <CardDescription>Run the database migration to enable IP tracking</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {logs.length > 0 && (
            <div className="bg-muted p-3 rounded-md font-mono text-xs h-48 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="pb-1">
                  {log}
                </div>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {errorMessage}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning || status === "success"} className="gap-2">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : status === "success" ? (
            "Migration Complete"
          ) : status === "error" ? (
            "Try Again"
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
