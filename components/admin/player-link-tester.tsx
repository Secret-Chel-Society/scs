"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PlayerClickableLinkFlexible } from "@/components/matches/player-clickable-link-flexible"

export function PlayerLinkTester() {
  const [playerName, setPlayerName] = useState("LispDoge")
  const [mappingTable, setMappingTable] = useState("ea_player_mappings")
  const [nameColumn, setNameColumn] = useState("persona_name")
  const [testValues, setTestValues] = useState<{
    playerName: string
    mappingTable: string
    nameColumn: string
  }>({
    playerName: "LispDoge",
    mappingTable: "ea_player_mappings",
    nameColumn: "persona_name",
  })

  const runTest = () => {
    setTestValues({
      playerName,
      mappingTable,
      nameColumn,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Link Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter EA player name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mappingTable">Mapping Table</Label>
              <Input
                id="mappingTable"
                value={mappingTable}
                onChange={(e) => setMappingTable(e.target.value)}
                placeholder="ea_player_mappings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameColumn">Name Column</Label>
              <Input
                id="nameColumn"
                value={nameColumn}
                onChange={(e) => setNameColumn(e.target.value)}
                placeholder="persona_name"
              />
            </div>
          </div>

          <Button onClick={runTest}>Test Link</Button>

          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Test Result:</h3>
            <div className="p-2 bg-muted rounded-md">
              <PlayerClickableLinkFlexible
                playerName={testValues.playerName}
                mappingTable={testValues.mappingTable}
                nameColumn={testValues.nameColumn}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Common EA Column Names to Try:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>persona_name</code> - Common in EA Sports games
              </li>
              <li>
                <code>persona_id</code> - Sometimes used for numeric IDs
              </li>
              <li>
                <code>player_name</code> - Generic player name
              </li>
              <li>
                <code>ea_name</code> - Custom mapping name
              </li>
              <li>
                <code>gamertag</code> - Used for Xbox/PlayStation identifiers
              </li>
              <li>
                <code>username</code> - Generic username
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
