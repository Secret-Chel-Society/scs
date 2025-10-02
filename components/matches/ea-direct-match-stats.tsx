// components/matches/ea-direct-match-stats.tsx

// This component displays EA direct match stats.
// Since there was no existing code, I'm creating a basic functional component
// that can be expanded upon later.  The debugging code will be added within this component.

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EADirectMatchStatsProps {
  matchData: any // Replace 'any' with a more specific type if possible
}

const EADirectMatchStats: React.FC<EADirectMatchStatsProps> = ({ matchData }) => {
  // Add debugging for power play stats
  if (matchData && matchData.clubs) {
    console.log("Power play stats in EA direct match stats:")
    Object.keys(matchData.clubs).forEach((clubId) => {
      const club = matchData.clubs[clubId]
      console.log(`Club ${clubId}: PPG=${club.ppg || 0}, PPO=${club.ppo || 0}`)
    })

    if (matchData.isCombined) {
      console.log(`This is a combined match with ${matchData.combinedCount || 0} matches`)
      console.log(`Combined from: ${JSON.stringify(matchData.combinedFrom)}`)
    }
  }

  return (
    <Card className="border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-hockey-glow">
      <CardHeader className="bg-gradient-to-r from-ice-blue-50/50 via-hockey-silver-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:via-hockey-silver-900/20 dark:to-rink-blue-900/20">
        <CardTitle className="text-ice-blue-700 dark:text-ice-blue-300">EA Sports Match Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Display match stats here */}
        {matchData ? (
          <div className="space-y-4">
            {/* Example: Displaying some basic info */}
            {matchData.clubs &&
              Object.keys(matchData.clubs).map((clubId) => (
                <div key={clubId} className="p-3 rounded-lg bg-ice-blue-50/30 dark:bg-ice-blue-900/20 border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <span className="text-hockey-silver-700 dark:text-hockey-silver-300">Club {clubId}:</span>
                  {/* Add more detailed stats display here */}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-center py-8">No match data available.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default EADirectMatchStats
