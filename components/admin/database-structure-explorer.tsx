"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TableInfo {
  name: string
  columns: {
    column_name: string
    data_type: string
    is_nullable: string
  }[]
}

export function DatabaseStructureExplorer() {
  const { supabase } = useSupabase()
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [eaRelatedTables, setEaRelatedTables] = useState<string[]>([])

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setIsLoading(true)

      // Get list of all tables
      const { data, error } = await supabase.rpc("get_table_info")

      if (error) throw error

      const tableNames = data.map((t: any) => t.table_name)
      setTables(tableNames)

      // Filter for EA-related tables
      const eaTables = tableNames.filter(
        (name: string) => name.toLowerCase().includes("ea") || name.toLowerCase().includes("player"),
      )
      setEaRelatedTables(eaTables)

      if (eaTables.length > 0) {
        setSelectedTable(eaTables[0])
        fetchTableInfo(eaTables[0])
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast({
        title: "Error",
        description: "Failed to load database tables",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTableInfo = async (tableName: string) => {
    try {
      setIsLoading(true)
      setSelectedTable(tableName)

      // Get column information for the selected table
      const { data, error } = await supabase.rpc("get_column_info", { table_name: tableName })

      if (error) throw error

      setTableInfo({
        name: tableName,
        columns: data,
      })
    } catch (error) {
      console.error(`Error fetching info for table ${selectedTable}:`, error)
      toast({
        title: "Error",
        description: `Failed to load information for table ${selectedTable}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Structure Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ea-tables">
          <TabsList>
            <TabsTrigger value="ea-tables">EA-Related Tables</TabsTrigger>
            <TabsTrigger value="all-tables">All Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="ea-tables">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {eaRelatedTables.map((table) => (
                <Button
                  key={table}
                  variant={selectedTable === table ? "default" : "outline"}
                  onClick={() => fetchTableInfo(table)}
                >
                  {table}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all-tables">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {tables.map((table) => (
                <Button
                  key={table}
                  variant={selectedTable === table ? "default" : "outline"}
                  onClick={() => fetchTableInfo(table)}
                >
                  {table}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-4">Loading table information...</div>
        ) : tableInfo ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Nullable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableInfo.columns.map((column, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{column.column_name}</TableCell>
                    <TableCell>{column.data_type}</TableCell>
                    <TableCell>{column.is_nullable}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4">Select a table to view its structure</div>
        )}
      </CardContent>
    </Card>
  )
}
