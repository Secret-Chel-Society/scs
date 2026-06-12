"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { DollarSign, Calendar, Building2 } from "lucide-react"

interface ContractHistory {
  id: string
  season_number: number
  team_id: string | null
  team_id_ahl: string | null
  team_name: string | null
  salary: number
  contract_type: string | null
  is_franchise_player: boolean
  retained_salary: number
  acquired_via: string | null
  acquired_from_team_name: string | null
  league: "NHL" | "AHL"
  role: string | null
  created_at: string
  teams?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  teams_ahl?: {
    id: string
    name: string
    logo_url: string | null
  } | null
}

interface PlayerContractsProps {
  playerId: string | null
  userId: string
}

export function PlayerContracts({ playerId, userId }: PlayerContractsProps) {
  const { supabase } = useSupabase()
  const [contracts, setContracts] = useState<ContractHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState<"all" | "nhl" | "ahl">("all")

  useEffect(() => {
    async function fetchContractHistory() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("player_salary_history")
          .select(`
            *,
            teams:team_id (id, name, logo_url),
            teams_ahl:team_id_ahl (id, name, logo_url)
          `)
          .eq("user_id", userId)
          .order("season_number", { ascending: false })

        if (error) {
          console.error("Error fetching contract history:", error)
          setContracts([])
        } else {
          setContracts(data || [])
        }
      } catch (err) {
        console.error("Error fetching contract history:", err)
        setContracts([])
      } finally {
        setLoading(false)
      }
    }

    fetchContractHistory()
  }, [supabase, userId])

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  const getAcquiredViaLabel = (via: string | null) => {
    switch (via) {
      case "draft":
        return "Draft"
      case "free_agency":
        return "Free Agency"
      case "bid":
        return "Free Agent Bid"
      case "trade":
        return "Trade"
      case "waiver_claim":
        return "Waiver Claim"
      case "signed":
        return "Contract Signing"
      case "ahl_call_up":
        return "AHL Call-Up"
      case "nhl_assignment":
        return "NHL Assignment"
      default:
        return via || "Unknown"
    }
  }

  const filteredContracts = contracts.filter((c) => {
    if (league === "all") return true
    return c.league.toLowerCase() === league
  })

  const nhlContracts = contracts.filter((c) => c.league === "NHL")
  const ahlContracts = contracts.filter((c) => c.league === "AHL")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Contract History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Contract History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contract history available</p>
            <p className="text-sm mt-2">Contract records will appear here once the player has been signed to a team.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate career totals
  const totalEarnings = {
    nhl: nhlContracts.reduce((sum, c) => sum + c.salary, 0),
    ahl: ahlContracts.reduce((sum, c) => sum + c.salary, 0),
    total: contracts.reduce((sum, c) => sum + c.salary, 0),
  }

  return (
    <div className="space-y-6">
      {/* Career Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Career Earnings</p>
                <p className="text-2xl font-bold">{formatSalary(totalEarnings.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NHL Earnings</p>
                <p className="text-2xl font-bold">{formatSalary(totalEarnings.nhl)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AHL Earnings</p>
                <p className="text-2xl font-bold">{formatSalary(totalEarnings.ahl)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contract History by Season
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={league} onValueChange={(v) => setLeague(v as "all" | "nhl" | "ahl")}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
              <TabsTrigger value="nhl">NHL ({nhlContracts.length})</TabsTrigger>
              <TabsTrigger value="ahl">AHL ({ahlContracts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={league} className="mt-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead>League</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Salary</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Acquired Via</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => {
                      const team = contract.league === "NHL" ? contract.teams : contract.teams_ahl
                      const teamName = team?.name || contract.team_name || "Unknown Team"
                      const logoUrl = team?.logo_url

                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            Season {contract.season_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant={contract.league === "NHL" ? "default" : "secondary"}>
                              {contract.league}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {logoUrl ? (
                                <Image
                                  src={logoUrl}
                                  alt={teamName}
                                  width={28}
                                  height={28}
                                  className="object-contain"
                                />
                              ) : (
                                <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <span>{teamName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatSalary(contract.salary)}
                            {contract.retained_salary > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({formatSalary(contract.retained_salary)} retained)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {contract.contract_type && (
                                <Badge variant="outline">{contract.contract_type}</Badge>
                              )}
                              {contract.is_franchise_player && (
                                <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                                  Franchise
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {getAcquiredViaLabel(contract.acquired_via)}
                              {contract.acquired_from_team_name && (
                                <span className="text-muted-foreground ml-1">
                                  from {contract.acquired_from_team_name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredContracts.map((contract) => {
                  const team = contract.league === "NHL" ? contract.teams : contract.teams_ahl
                  const teamName = team?.name || contract.team_name || "Unknown Team"
                  const logoUrl = team?.logo_url

                  return (
                    <Card key={contract.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {logoUrl ? (
                              <Image
                                src={logoUrl}
                                alt={teamName}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{teamName}</p>
                              <p className="text-sm text-muted-foreground">
                                Season {contract.season_number}
                              </p>
                            </div>
                          </div>
                          <Badge variant={contract.league === "NHL" ? "default" : "secondary"}>
                            {contract.league}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Salary</p>
                            <p className="font-mono font-semibold">{formatSalary(contract.salary)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Acquired Via</p>
                            <p>{getAcquiredViaLabel(contract.acquired_via)}</p>
                          </div>
                        </div>

                        {(contract.contract_type || contract.is_franchise_player || contract.retained_salary > 0) && (
                          <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                            {contract.contract_type && (
                              <Badge variant="outline">{contract.contract_type}</Badge>
                            )}
                            {contract.is_franchise_player && (
                              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                                Franchise
                              </Badge>
                            )}
                            {contract.retained_salary > 0 && (
                              <Badge variant="outline" className="text-muted-foreground">
                                {formatSalary(contract.retained_salary)} retained
                              </Badge>
                            )}
                          </div>
                        )}

                        {contract.acquired_from_team_name && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Acquired from {contract.acquired_from_team_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {filteredContracts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {league.toUpperCase()} contracts found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
