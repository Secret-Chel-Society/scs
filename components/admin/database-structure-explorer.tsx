"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database } from "lucide-react"

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
    <Card className="hockey-premium-card">
      <CardHeader>
        <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
          <div className="hockey-feature-icon">
            <Database className="h-5 w-5 text-white" />
          </div>
          Database Structure Explorer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ea-tables">
          <TabsList className="hockey-tabs-list">
            <TabsTrigger value="ea-tables" className="hockey-tab-trigger">EA-Related Tables</TabsTrigger>
            <TabsTrigger value="all-tables" className="hockey-tab-trigger">All Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="ea-tables">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {eaRelatedTables.map((table) => (
                <Button
                  key={table}
                  variant={selectedTable === table ? "default" : "outline"}
                  onClick={() => fetchTableInfo(table)}
                  className={selectedTable === table ? "hockey-button-enhanced" : "hockey-nav-item"}
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
                  className={selectedTable === table ? "hockey-button-enhanced" : "hockey-nav-item"}
                >
                  {table}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {isLoading ? (
          <div className="hockey-premium-card text-center py-8">
            <div className="hockey-feature-icon mx-auto mb-4">
              <Database className="h-6 w-6 text-white animate-pulse" />
            </div>
            <p className="hockey-subtitle">Loading table information...</p>
          </div>
        ) : tableInfo ? (
          <div className="hockey-premium-card overflow-hidden">
            <div className="mb-4">
              <h3 className="hockey-title text-xl text-center">{tableInfo.name}</h3>
              <p className="hockey-subtitle text-center">Table structure and column information</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="hockey-standings-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Column Name</TableHead>
                    <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Data Type</TableHead>
                    <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Nullable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableInfo.columns.map((column, index) => (
                    <TableRow key={index} className="hover:bg-gradient-to-r hover:from-ice-blue-50/50 hover:to-rink-blue-50/50 dark:hover:from-ice-blue-900/20 dark:hover:to-rink-blue-900/20 transition-all duration-200">
                      <TableCell className="font-medium text-hockey-silver-900 dark:text-hockey-silver-100">{column.column_name}</TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">{column.data_type}</TableCell>
                      <TableCell className="text-hockey-silver-700 dark:text-hockey-silver-300">{column.is_nullable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="hockey-premium-card text-center py-8">
            <div className="hockey-feature-icon mx-auto mb-4">
              <Database className="h-6 w-6 text-white" />
            </div>
            <p className="hockey-subtitle">Select a table to view its structure</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
