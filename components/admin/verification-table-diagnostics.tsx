"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TableSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableInfo {
  exists: boolean
  schema: TableSchema[]
  error?: string
}

interface DiagnosticData {
  verification_tokens: TableInfo
  email_verification_tokens: TableInfo
  related_tables: { table_name: string }[]
  related_tables_error?: string
}

export function VerificationTableDiagnostics() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSchema = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/check-verification-table-schema")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to check schema")
      }

      setData(result)
    } catch (err: any) {
      console.error("Schema check error:", err)
      setError(err.message || "An error occurred while checking the schema")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSchema()
  }, [])

  const renderTableInfo = (tableName: string, tableInfo: TableInfo) => (
    <Card key={tableName} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {tableName}
        </CardTitle>
        <CardDescription>{tableInfo.exists ? "Table exists" : "Table does not exist"}</CardDescription>
      </CardHeader>
      <CardContent>
        {tableInfo.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{tableInfo.error}</AlertDescription>
          </Alert>
        )}

        {tableInfo.exists && tableInfo.schema.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Column Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Data Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nullable</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Default</th>
                </tr>
              </thead>
              <tbody>
                {tableInfo.schema.map((column, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2 font-mono">{column.column_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{column.data_type}</td>
                    <td className="border border-gray-300 px-4 py-2">{column.is_nullable}</td>
                    <td className="border border-gray-300 px-4 py-2">{column.column_default || "NULL"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No schema information available</p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verification Table Diagnostics</CardTitle>
          <CardDescription>Check the current schema of verification-related tables</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={checkSchema} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Checking Schema..." : "Refresh Schema"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {renderTableInfo("verification_tokens", data.verification_tokens)}
          {renderTableInfo("email_verification_tokens", data.email_verification_tokens)}

          <Card>
            <CardHeader>
              <CardTitle>Related Tables</CardTitle>
              <CardDescription>All tables containing 'verification' or 'token' in the name</CardDescription>
            </CardHeader>
            <CardContent>
              {data.related_tables_error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{data.related_tables_error}</AlertDescription>
                </Alert>
              )}

              {data.related_tables.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {data.related_tables.map((table, index) => (
                    <li key={index} className="font-mono">
                      {table.table_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No related tables found</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
