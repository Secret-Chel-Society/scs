// components/matches/ea-direct-match-stats.tsx

// This component displays EA direct match stats.
// Since there was no existing code, I'm creating a basic functional component
// that can be expanded upon later.  The debugging code will be added within this component.

import type React from "react"

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
    <div>
      {/* Display match stats here */}
      {matchData ? (
        <div>
          {/* Example: Displaying some basic info */}
          {matchData.clubs &&
            Object.keys(matchData.clubs).map((clubId) => (
              <div key={clubId}>
                Club {clubId}:{/* Add more detailed stats display here */}
              </div>
            ))}
        </div>
      ) : (
        <p>No match data available.</p>
      )}
    </div>
  )
}

export default EADirectMatchStats
