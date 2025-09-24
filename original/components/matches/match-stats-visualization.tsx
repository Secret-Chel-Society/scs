// Replace the entire component with a simpler table-based visualization

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MatchStatsVisualizationProps {
  homeTeam: any
  awayTeam: any
  homeScore: number
  awayScore: number
  periodScores?: any
}

export function MatchStatsVisualization({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  periodScores,
}: MatchStatsVisualizationProps) {
  // Format period scores for display
  const formattedPeriodScores = periodScores
    ? Array.isArray(periodScores)
      ? periodScores
      : Object.entries(periodScores).map(([period, scores]: [string, any]) => ({
          period,
          home: scores.home,
          away: scores.away,
        }))
    : []

  // Ensure we have at least 3 periods
  while (formattedPeriodScores.length < 3) {
    formattedPeriodScores.push({
      period: formattedPeriodScores.length + 1,
      home: 0,
      away: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Team</th>
                <th className="py-2 px-4 text-center">P1</th>
                <th className="py-2 px-4 text-center">P2</th>
                <th className="py-2 px-4 text-center">P3</th>
                {formattedPeriodScores.length > 3 && <th className="py-2 px-4 text-center">OT</th>}
                <th className="py-2 px-4 text-center font-bold">Final</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">{homeTeam?.name || "Home Team"}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[0]?.home || 0}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[1]?.home || 0}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[2]?.home || 0}</td>
                {formattedPeriodScores.length > 3 && (
                  <td className="py-3 px-4 text-center">{formattedPeriodScores[3]?.home || 0}</td>
                )}
                <td className="py-3 px-4 text-center font-bold">{homeScore || 0}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">{awayTeam?.name || "Away Team"}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[0]?.away || 0}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[1]?.away || 0}</td>
                <td className="py-3 px-4 text-center">{formattedPeriodScores[2]?.away || 0}</td>
                {formattedPeriodScores.length > 3 && (
                  <td className="py-3 px-4 text-center">{formattedPeriodScores[3]?.away || 0}</td>
                )}
                <td className="py-3 px-4 text-center font-bold">{awayScore || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
