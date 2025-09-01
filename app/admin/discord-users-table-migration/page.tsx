"use client"

import { useEffect, useState } from "react"

export default function DiscordUsersTableMigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function runMigration() {
      setMigrationStatus("running")
      try {
        const response = await fetch("/api/admin/migrate-discord-users-table", {
          method: "POST",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Migration failed with an unknown error.")
        }

        setMigrationStatus("completed")
      } catch (error: any) {
        setMigrationStatus("error")
        setErrorMessage(error.message)
      }
    }

    runMigration()
  }, [])

  let statusMessage = ""
  if (migrationStatus === "running") {
    statusMessage = "Migration is running..."
  } else if (migrationStatus === "completed") {
    statusMessage = "Migration completed successfully!"
  } else if (migrationStatus === "error") {
    statusMessage = `Migration failed: ${errorMessage}`
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Discord Users Table Migration</h1>
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            migrationStatus === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {statusMessage}
        </div>
      )}
      {migrationStatus === "idle" && <p>Migration will start automatically.</p>}
    </div>
  )
}
