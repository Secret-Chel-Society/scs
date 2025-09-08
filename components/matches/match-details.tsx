"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { useState } from "react"
import { EditScoreModal } from "./edit-score-modal"
import { TeamLogo } from "@/components/team-logo"

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
    <div className="clean-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="clean-section-header">Match Details</h2>
        {isAdmin && (
          <Button
            onClick={() => setOpenScoreModal(true)}
            variant="outline"
            size="sm"
            className="clean-button-outline flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Score</span>
          </Button>
        )}
      </div>
      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center space-y-3 w-1/3">
            <div className="w-16 h-16 sm:w-20 sm:h-20">
              <TeamLogo 
                teamName={homeTeam}
                logoUrl={match.home_team?.logo_url}
                size="lg"
              />
            </div>
            <span className="font-semibold text-center text-sm sm:text-lg text-slate-700 dark:text-slate-300">{homeTeam}</span>
          </div>

          <div className="flex flex-col items-center w-1/3">
            <div className="text-3xl sm:text-4xl font-bold mb-2 text-slate-800 dark:text-slate-200">
              {homeScore} - {awayScore} {wentToOvertime && <span className="text-xl sm:text-2xl text-blue-500">(OT)</span>}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
              {match.status === "completed" ? "Final" : match.status || "Scheduled"}
              {match.status === "completed" && wentToOvertime && " - Overtime"}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3 w-1/3">
            <div className="w-16 h-16 sm:w-20 sm:h-20">
              <TeamLogo 
                teamName={awayTeam}
                logoUrl={match.away_team?.logo_url}
                size="lg"
              />
            </div>
            <span className="font-semibold text-center text-sm sm:text-lg text-slate-700 dark:text-slate-300">{awayTeam}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="clean-feature-card">
              <div className="clean-icon-container mb-3">
                <div className="text-xl">📅</div>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Date</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{formattedDate}</div>
            </div>
            {match.season_name && (
              <div className="clean-feature-card">
                <div className="clean-icon-container-emerald mb-3">
                  <div className="text-xl">🏆</div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Season</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{match.season_name}</div>
              </div>
            )}
            {match.status && (
              <div className="clean-feature-card">
                <div className="clean-icon-container-red mb-3">
                  <div className="text-xl">⚡</div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Status</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 capitalize">{match.status}</div>
              </div>
            )}
            {wentToOvertime && (
              <div className="clean-feature-card">
                <div className="clean-icon-container-indigo mb-3">
                  <div className="text-xl">⏰</div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Game Type</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Overtime</div>
              </div>
            )}
          </div>
        </div>

        {/* Display period scores if available */}
        {match.period_scores && match.period_scores.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="clean-section-header mb-6">Period Scores</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-4 text-sm min-w-[300px]">
                <div className="font-semibold text-slate-600 dark:text-slate-400">Period</div>
                <div className="font-semibold text-slate-600 dark:text-slate-400">{homeTeam}</div>
                <div className="font-semibold text-slate-600 dark:text-slate-400">{awayTeam}</div>
                <div></div>

                {match.period_scores.map((period: any, index: number) => (
                  <div key={`period-${index}`} className="contents">
                    <div className="py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                      {index < 3 ? `Period ${index + 1}` : `OT ${index - 2}`}
                    </div>
                    <div className="py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-semibold text-blue-700 dark:text-blue-300 text-center">
                      {period.home}
                    </div>
                    <div className="py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-semibold text-blue-700 dark:text-blue-300 text-center">
                      {period.away}
                    </div>
                    <div></div>
                  </div>
                ))}

                <div className="py-2 px-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200">Total</div>
                <div className="py-2 px-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg font-bold text-blue-800 dark:text-blue-200 text-center">
                  {homeScore}
                </div>
                <div className="py-2 px-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg font-bold text-blue-800 dark:text-blue-200 text-center">
                  {awayScore}
                </div>
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
