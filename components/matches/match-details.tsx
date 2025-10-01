"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { useState } from "react"
import { EditScoreModal } from "./edit-score-modal"

interface MatchDetailsProps {
  match: any
  onMatchUpdated?: () => void
  isAdmin?: boolean
}

export function MatchDetails({ match, onMatchUpdated, isAdmin }: MatchDetailsProps) {
  const [openScoreModal, setOpenScoreModal] = useState(false)

  if (!match) return null

  const homeTeam = match.home_team?.name || "Home Team"
  const awayTeam = match.away_team?.name || "Away Team"
  const homeScore = match.home_score !== null ? match.home_score : "-"
  const awayScore = match.away_score !== null ? match.away_score : "-"

  // Check for match_date first, then fall back to date
  const matchDate = match.match_date

  // Format the date and time properly
  const formattedDate = matchDate
    ? new Date(matchDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " at " +
      new Date(matchDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD"

  // Check both overtime and has_overtime fields
  const wentToOvertime = match.overtime === true || match.has_overtime === true

  const handleScoreUpdate = (updatedMatch: any) => {
    if (onMatchUpdated) {
      onMatchUpdated()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center">Match Details</h2>
        {isAdmin && (
          <Button
            onClick={() => setOpenScoreModal(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Score</span>
          </Button>
        )}
      </div>
      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center space-y-2 w-1/3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {match.home_team?.logo_url ? (
                <img
                  src={match.home_team.logo_url || "/placeholder.svg"}
                  alt={homeTeam}
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                />
              ) : (
                <span className="text-sm sm:text-xl font-bold">{homeTeam.substring(0, 2)}</span>
              )}
            </div>
            <span className="font-semibold text-center text-xs sm:text-base">{homeTeam}</span>
          </div>

          <div className="flex flex-col items-center w-1/3">
            <div className="text-2xl sm:text-3xl font-bold mb-2">
              {homeScore} - {awayScore} {wentToOvertime && <span className="text-lg sm:text-xl">(OT)</span>}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
              {match.status === "completed" ? "Final" : match.status || "Scheduled"}
              {match.status === "completed" && wentToOvertime && " - Overtime"}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2 w-1/3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {match.away_team?.logo_url ? (
                <img
                  src={match.away_team.logo_url || "/placeholder.svg"}
                  alt={awayTeam}
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                />
              ) : (
                <span className="text-sm sm:text-xl font-bold">{awayTeam.substring(0, 2)}</span>
              )}
            </div>
            <span className="font-semibold text-center text-xs sm:text-base">{awayTeam}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Date</span>
              <span className="font-medium text-sm sm:text-base">{formattedDate}</span>
            </div>
            {match.season_name && (
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Season</span>
                <span className="font-medium text-sm sm:text-base">{match.season_name}</span>
              </div>
            )}
            {match.status && (
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-medium text-sm sm:text-base capitalize">{match.status}</span>
              </div>
            )}
            {wentToOvertime && (
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Game Type</span>
                <span className="font-medium text-sm sm:text-base">Overtime</span>
              </div>
            )}
          </div>
        </div>

        {/* Display period scores if available */}
        {match.period_scores && match.period_scores.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Period Scores</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm min-w-[300px]">
                <div className="font-medium">Period</div>
                <div className="font-medium">{homeTeam}</div>
                <div className="font-medium">{awayTeam}</div>
                <div></div>

                {match.period_scores.map((period: any, index: number) => (
                  <div key={`period-${index}`} className="contents">
                    <div>{index < 3 ? `Period ${index + 1}` : `OT ${index - 2}`}</div>
                    <div>{period.home}</div>
                    <div>{period.away}</div>
                    <div></div>
                  </div>
                ))}

                <div className="font-bold">Total</div>
                <div className="font-bold">{homeScore}</div>
                <div className="font-bold">{awayScore}</div>
                <div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Score Modal */}
      <EditScoreModal
        open={openScoreModal}
        onOpenChange={setOpenScoreModal}
        match={match}
        canEdit={isAdmin}
        onUpdate={handleScoreUpdate}
      />
    </div>
  )
}
