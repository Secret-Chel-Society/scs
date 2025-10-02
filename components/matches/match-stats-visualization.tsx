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
    <Card className="border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-hockey-glow">
      <CardHeader className="bg-gradient-to-r from-ice-blue-50/50 via-hockey-silver-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:via-hockey-silver-900/20 dark:to-rink-blue-900/20">
        <CardTitle className="text-ice-blue-700 dark:text-ice-blue-300">Match Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ice-blue-200/50 dark:border-rink-blue-700/50">
                <th className="py-2 px-4 text-left text-ice-blue-600 dark:text-ice-blue-400">Team</th>
                <th className="py-2 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">P1</th>
                <th className="py-2 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">P2</th>
                <th className="py-2 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">P3</th>
                {formattedPeriodScores.length > 3 && <th className="py-2 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">OT</th>}
                <th className="py-2 px-4 text-center font-bold text-ice-blue-700 dark:text-ice-blue-300">Final</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ice-blue-200/30 dark:border-rink-blue-700/30 hover:bg-ice-blue-50/30 dark:hover:bg-ice-blue-900/20">
                <td className="py-3 px-4 font-medium text-hockey-silver-700 dark:text-hockey-silver-300">{homeTeam?.name || "Home Team"}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[0]?.home || 0}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[1]?.home || 0}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[2]?.home || 0}</td>
                {formattedPeriodScores.length > 3 && (
                  <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[3]?.home || 0}</td>
                )}
                <td className="py-3 px-4 text-center font-bold text-ice-blue-700 dark:text-ice-blue-300 text-lg">{homeScore || 0}</td>
              </tr>
              <tr className="hover:bg-ice-blue-50/30 dark:hover:bg-ice-blue-900/20">
                <td className="py-3 px-4 font-medium text-hockey-silver-700 dark:text-hockey-silver-300">{awayTeam?.name || "Away Team"}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[0]?.away || 0}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[1]?.away || 0}</td>
                <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[2]?.away || 0}</td>
                {formattedPeriodScores.length > 3 && (
                  <td className="py-3 px-4 text-center text-ice-blue-600 dark:text-ice-blue-400">{formattedPeriodScores[3]?.away || 0}</td>
                )}
                <td className="py-3 px-4 text-center font-bold text-ice-blue-700 dark:text-ice-blue-300 text-lg">{awayScore || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
