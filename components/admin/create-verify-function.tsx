"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function CreateVerifyFunction() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [manualSql, setManualSql] = useState("")
  const [showManual, setShowManual] = useState(false)

  const createFunction = async () => {
    try {
      setIsRunning(true)

      const response = await fetch("/api/admin/create-verify-function", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create function")
      }

      toast({
        title: "Success",
        description: "The admin force verify function has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating function:", error)
      toast({
        title: "Function Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })

      // Show manual SQL option if automatic creation fails
      setShowManual(true)
      setManualSql(`
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
  
  -- Try to insert a log entry if the table exists
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
      `)
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
        <p className="text-sm text-muted-foreground mb-4">
          This will create a SQL function that can directly update the auth.users table to mark a user as verified. This
          is useful when the regular API methods fail to update the verification status.
        </p>

        {showManual && (
          <div className="mt-4">
            <p className="text-sm font-medium text-amber-600 mb-2">
              Automatic creation failed. Please run this SQL manually in the Supabase SQL editor:
            </p>
            <Textarea
              value={manualSql}
              readOnly
              className="h-64 font-mono text-xs"
              onClick={(e) => {
                const textarea = e.target as HTMLTextAreaElement
                textarea.select()
                document.execCommand("copy")
                toast({
                  title: "SQL Copied",
                  description: "The SQL has been copied to your clipboard.",
                })
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">Click the text area to copy the SQL to your clipboard.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={createFunction} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating Function...
            </>
          ) : (
            "Create Function"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
