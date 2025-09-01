"use client"

import Link from "next/link"

interface ClickablePlayerNameProps {
  playerName: string
}

export function ClickablePlayerName({ playerName }: ClickablePlayerNameProps) {
  // For immediate testing, we'll make all player names clickable
  // Later you can uncomment the database check to only make real players clickable

  return (
    <Link
      href={`/players/${encodeURIComponent(playerName)}`}
      className="text-primary hover:underline hover:text-primary/80 font-medium cursor-pointer"
    >
      {playerName}
    </Link>
  )

  /* Uncomment this for real database checks
  const { supabase } = useSupabase()
  const [isClickable, setIsClickable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPlayer = async () => {
      try {
        setIsLoading(true)
        
        // Check if this player name exists in the database
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("gamer_tag", playerName)
          .limit(1)
        
        if (data && data.length > 0) {
          setIsClickable(true)
        }
      } catch (error) {
        console.error("Error checking player:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPlayer()
  }, [playerName, supabase])

  if (isLoading || !isClickable) {
    return <span>{playerName}</span>
  }

  return (
    <Link 
      href={`/players/${encodeURIComponent(playerName)}`} 
      className="text-primary hover:underline hover:text-primary/80 font-medium cursor-pointer"
    >
      {playerName}
    </Link>
  )
  */
}
