"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw } from "lucide-react"

export const VerificationFunctionMigration = () => {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [method, setMethod] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setMethod(null)

      // First try the regular migration endpoint
      const response = await fetch("/api/admin/run-migration/verification-function", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setMethod(data.message || "Standard method")

        toast({
          title: "Migration Successful",
          description: "The admin force verify function has been created successfully.",
        })
        return
      }

      // If that fails, try the direct SQL method
      const sql = `
        -- Create a function to force verify a user
        CREATE OR REPLACE FUNCTION admin_force_verify_user(user_id_param UUID, email_param TEXT)
        RETURNS VOID AS $$
        BEGIN
          -- Update the auth.users table directly to set email_confirmed_at
          UPDATE auth.users
          SET 
            email_confirmed_at = NOW(),
            updated_at = NOW(),
            raw_app_meta_data = 
              CASE 
                WHEN raw_app_meta_data IS NULL THEN 
                  jsonb_build_object('email_verified', true)
                ELSE 
                  raw_app_meta_data || jsonb_build_object('email_verified', true)
              END,
            raw_user_meta_data = 
              CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                  jsonb_build_object('email_verified', true)
                ELSE 
                  raw_user_meta_data || jsonb_build_object('email_verified', true)
              END
          WHERE id = user_id_param;
          
          -- Insert a log entry if the verification_logs table exists
          BEGIN
            INSERT INTO verification_logs (
              user_id, 
              email, 
              action, 
              success, 
              details, 
              created_at
            )
            VALUES (
              user_id_param,
              email_param,
              'admin_force_verify_sql',
              TRUE,
              'Admin forced verification via SQL function',
              NOW()
            );
          EXCEPTION
            WHEN undefined_table THEN
              -- Table doesn't exist, just continue
              NULL;
          END;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      const directResponse = await fetch("/api/admin/direct-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      if (directResponse.ok) {
        setMethod("Direct SQL execution")
        toast({
          title: "Migration Successful",
          description: "The admin force verify function has been created successfully using direct SQL execution.",
        })
        return
      }

      // If both methods fail, try the run-migration endpoint
      const migrationResponse = await fetch("/api/admin/run-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "create_admin_force_verify_function",
          sql,
        }),
      })

      if (migrationResponse.ok) {
        setMethod("Generic migration runner")
        toast({
          title: "Migration Successful",
          description: "The admin force verify function has been created successfully using the migration runner.",
        })
        return
      }

      throw new Error("All migration methods failed")
    } catch (error) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin Force Verify Function</CardTitle>
        <CardDescription>
          Creates a SQL function that allows admins to force verify users directly in the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This migration creates a SQL function that can directly update the auth.users table to mark a user as
          verified. This is useful when the regular API methods fail to update the verification status.
        </p>
        {method && <p className="text-sm font-medium text-green-600 mt-2">Migration successful using: {method}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Add default export that re-exports the named export for backward compatibility
export default VerificationFunctionMigration
