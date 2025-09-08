"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { TeamLogo } from "@/components/team-logo"

interface FeaturedMatchProps {
  match: {
    id: string
    match_date: string
    home_team: {
      id: string
      name: string
      logo_url: string | null
    }
    away_team: {
      id: string
      name: string
      logo_url: string | null
    }
  }
}

export default function FeaturedMatch({ match }: FeaturedMatchProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const matchTime = new Date(match.match_date).getTime()
      const now = new Date().getTime()
      const difference = matchTime - now

      if (difference <= 0) {
        // Match has started
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [match.match_date])

  const matchDate = new Date(match.match_date)
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = matchDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-2xl font-bold text-center">Featured Match</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Teams */}
            <div className="flex flex-1 items-center justify-center gap-4 md:gap-8">
              <motion.div
                className="flex flex-col items-center text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="relative h-24 w-24 mb-2">
                  <TeamLogo 
                    teamName={match.home_team.name}
                    logoUrl={match.home_team.logo_url}
                    size="lg"
                  />
                </div>
                <Link
                  href={`/teams/${match.home_team.id}`}
                  className="font-bold text-lg hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors"
                >
                  {match.home_team.name}
                </Link>
              </motion.div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-2">VS</div>
              </div>

              <motion.div
                className="flex flex-col items-center text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="relative h-24 w-24 mb-2">
                  <TeamLogo 
                    teamName={match.away_team.name}
                    logoUrl={match.away_team.logo_url}
                    size="lg"
                  />
                </div>
                <Link
                  href={`/teams/${match.away_team.id}`}
                  className="font-bold text-lg hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors"
                >
                  {match.away_team.name}
                </Link>
              </motion.div>
            </div>

            {/* Match Info */}
            <div className="flex flex-col items-center md:items-start gap-4 md:border-l md:pl-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              {/* Countdown */}
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Match starts in:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{timeRemaining.days}</span>
                    <span className="text-xs text-muted-foreground">Days</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{timeRemaining.hours}</span>
                    <span className="text-xs text-muted-foreground">Hours</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{timeRemaining.minutes}</span>
                    <span className="text-xs text-muted-foreground">Mins</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{timeRemaining.seconds}</span>
                    <span className="text-xs text-muted-foreground">Secs</span>
                  </div>
                </div>
              </div>

              <Button asChild className="mt-2 w-full md:w-auto">
                <Link href={`/matches/${match.id}`}>Match Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
