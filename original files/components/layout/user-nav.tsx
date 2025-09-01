"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function UserNav({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [playerRole, setPlayerRole] = useState<string | null>(null)
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return

      setIsLoading(true)

      try {
        // Fetch user data, player role, and team information in a single query
        const { data, error } = await supabase
          .from("users")
          .select(`
            *,
            players(
              id,
              role,
              team_id,
              teams:team_id(
                id,
                name,
                logo_url
              )
            )
          `)
          .eq("id", user.id)
          .single()

        if (data && !error) {
          console.log("UserNav: User profile loaded", data)
          setUserProfile(data)

          // Set player role and team info if available
          if (data.players && data.players.length > 0) {
            console.log("Player data found:", data.players[0])
            setPlayerRole(data.players[0].role)

            // Make sure we're setting the player ID correctly
            const playerIdFromData = data.players[0].id
            console.log("Setting player ID to:", playerIdFromData)
            setPlayerId(playerIdFromData)

            if (data.players[0].teams) {
              setTeamInfo({
                id: data.players[0].teams.id,
                name: data.players[0].teams.name,
                logo_url: data.players[0].teams.logo_url,
              })
            }
          } else {
            console.log("No player data found for user")
          }

          // Check if user has admin role
          const { data: adminData } = await supabase.from("admins").select("*").eq("user_id", user.id).single()
          setIsAdmin(!!adminData)
        } else {
          console.error("Error fetching user profile in UserNav:", error)
        }
      } catch (error) {
        console.error("Exception in UserNav:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    })
    // Force a hard navigation to ensure complete page refresh with new auth state
    window.location.href = "/"
  }

  const getInitials = () => {
    if (userProfile?.gamer_tag_id) {
      return userProfile.gamer_tag_id.substring(0, 2).toUpperCase()
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  // Get role badge color based on role
  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "Owner":
        return "bg-purple-500 hover:bg-purple-600"
      case "GM":
        return "bg-red-500 hover:bg-red-600"
      case "AGM":
        return "bg-blue-500 hover:bg-blue-600"
      case "Player":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Check if user has management role
  const hasManagementRole = () => {
    console.log("Checking management role for:", playerRole) // Debug log
    if (!playerRole) return false
    const managementRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager"]
    const hasRole = managementRoles.includes(playerRole)
    console.log("Has management role:", hasRole) // Debug log
    return hasRole
  }

  // Get the profile URL
  const getProfileUrl = () => {
    // If we have a player ID, use it
    if (playerId) {
      return `/players/${playerId}`
    }

    // If we have a user ID, use that for the player page
    if (user?.id) {
      return `/players/${user.id}`
    }

    // Last resort fallback
    return "/players"
  }

  if (isLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Display team badge if available */}
      {teamInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/teams/${teamInfo.id}`} className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-background">
                  {teamInfo.logo_url ? (
                    <Image
                      src={teamInfo.logo_url || "/placeholder.svg"}
                      alt={teamInfo.name}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">{teamInfo.name.substring(0, 2)}</span>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{teamInfo.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userProfile?.avatar_url || "/placeholder.svg?height=32&width=32"}
                alt={userProfile?.gamer_tag_id || "User"}
              />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  const url = playerId ? `/players/${playerId}` : user?.id ? `/players/${user.id}` : "/players"
                  console.log("Direct navigation to:", url)
                  router.push(url)
                }}
                className="text-left group hover:cursor-pointer"
              >
                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                  {userProfile?.gamer_tag_id || "User"}
                </p>
              </button>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                {playerRole && (
                  <Badge variant="outline" className="w-fit">
                    {playerRole}
                  </Badge>
                )}
                {teamInfo && (
                  <Badge variant="secondary" className="w-fit">
                    {teamInfo.name}
                  </Badge>
                )}
              </div>
              {/* Debug info - remove this after testing */}
              <div className="text-xs text-muted-foreground">
                Role: {playerRole || "None"} | Management: {hasManagementRole() ? "Yes" : "No"}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <button
                onClick={() => {
                  const url = playerId ? `/players/${playerId}` : user?.id ? `/players/${user.id}` : "/players"
                  console.log("Profile navigation to:", url)
                  router.push(url)
                }}
                className="flex items-center w-full text-left"
              >
                <span className="mr-2">👤</span>
                View My Profile
              </button>
            </DropdownMenuItem>

            {/* Management Panel - Force show for debugging */}
            {(playerRole === "Owner" || playerRole === "GM" || playerRole === "AGM" || hasManagementRole()) && (
              <DropdownMenuItem asChild>
                <Link href="/management" className="flex items-center">
                  <span className="mr-2">🏢</span>
                  Management Panel
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <span className="mr-2">⚙️</span>
                Account Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/register/season" className="flex items-center">
                <span className="mr-2">🏒</span>
                Season Registration
              </Link>
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  <span className="mr-2">🔧</span>
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <span className="mr-2">🚪</span>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
