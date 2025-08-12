"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EaMatchImportModal } from "./ea-match-import-modal"
import { useSupabase } from "@/lib/supabase/client"
import { Upload } from "lucide-react"

interface UploadMatchButtonProps {
  match: any
  teamId?: string
  eaClubId?: string | null
  homeTeamEaClubId?: string | null
  awayTeamEaClubId?: string | null
  onImportSuccess?: () => void
  isAdmin?: boolean
}

export function UploadMatchButton({
  match,
  teamId,
  eaClubId,
  homeTeamEaClubId,
  awayTeamEaClubId,
  onImportSuccess,
  isAdmin = false,
}: UploadMatchButtonProps) {
  const { supabase } = useSupabase()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadAllowed, setIsUploadAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsLoading(true)

        // Admins can always upload
        if (isAdmin) {
          setIsUploadAllowed(true)
          setIsLoading(false)
          return
        }

        // Only allow uploads for "In Progress" matches
        const matchInProgress =
          match.status?.toLowerCase() === "in progress" || match.status?.toLowerCase() === "inprogress"

        if (!matchInProgress) {
          setIsUploadAllowed(false)
          setIsLoading(false)
          return
        }

        // Check if the user is a manager for one of the teams
        if (teamId) {
          const { data: user } = await supabase.auth.getUser()

          if (!user || !user.user) {
            setIsUploadAllowed(false)
            setIsLoading(false)
            return
          }

          // Get user's gamer_tag_id
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, gamer_tag_id")
            .eq("id", user.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user data:", userError)
            setIsUploadAllowed(false)
            setIsLoading(false)
            return
          }

          // Check players table for management role
          let playersQuery = supabase.from("players").select("role, team_id").eq("team_id", teamId)

          if (userData.gamer_tag_id) {
            playersQuery = playersQuery.or(`user_id.eq.${user.user.id},gamer_tag_id.eq.${userData.gamer_tag_id}`)
          } else {
            playersQuery = playersQuery.eq("user_id", user.user.id)
          }

          const { data: player, error: playerError } = await playersQuery.single()

          if (playerError) {
            console.error("Error checking player status:", playerError)
            // Fallback to team_managers table
            const { data: manager, error: managerError } = await supabase
              .from("team_managers")
              .select("role")
              .eq("user_id", user.user.id)
              .eq("team_id", teamId)
              .single()

            if (managerError) {
              console.error("Error checking manager status:", managerError)
              setIsUploadAllowed(false)
            } else if (manager) {
              const role = manager.role?.toLowerCase().trim()
              const hasManagerRole = [
                "owner",
                "gm",
                "general manager",
                "agm",
                "assistant general manager",
                "coach",
                "manager",
                "team manager",
              ].includes(role)
              setIsUploadAllowed(hasManagerRole)
            } else {
              setIsUploadAllowed(false)
            }
          } else if (player) {
            // Check if player has management role
            const role = player.role?.toLowerCase().trim()
            const hasManagerRole = [
              "owner",
              "gm",
              "general manager",
              "agm",
              "assistant general manager",
              "coach",
              "manager",
              "team manager",
            ].includes(role)
            setIsUploadAllowed(hasManagerRole)
          } else {
            setIsUploadAllowed(false)
          }
        } else {
          setIsUploadAllowed(false)
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
        setIsUploadAllowed(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [supabase, teamId, match, isAdmin])

  const handleOpenModal = () => {
    console.log("Opening modal with props:", {
      match,
      teamId,
      eaClubId,
      homeTeamEaClubId,
      awayTeamEaClubId,
      isAdmin,
    })
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        disabled={isLoading}
        className="flex items-center gap-1"
      >
        <Upload className="h-4 w-4" />
        Update Match Data
      </Button>

      <EaMatchImportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        match={match}
        teamId={teamId}
        eaClubId={eaClubId}
        homeTeamEaClubId={homeTeamEaClubId}
        awayTeamEaClubId={awayTeamEaClubId}
        onImportSuccess={onImportSuccess}
        isAdmin={isAdmin}
      />
    </>
  )
}
