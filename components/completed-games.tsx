"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Clock } from "lucide-react"

interface CompletedGame {
  id: string
  match_date: string
  home_score: number
  away_score: number
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

interface CompletedGamesProps {
  games: CompletedGame[]
}

export default function CompletedGames({ games }: CompletedGamesProps) {
  if (!games || games.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No completed games yet.</p>
      </Card>
    )
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {games.map((game) => {
          const matchDate = new Date(game.match_date)

          return (
            <CarouselItem key={game.id} className="md:basis-1/2 lg:basis-1/3 h-full">
              <Link href={`/matches/${game.id}`}>
                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary">
                    <CardContent className="flex flex-col items-center p-6">
                      <div className="w-full flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(matchDate, "MMM d")}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(matchDate, "h:mm a")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-center">
                          <div className="relative h-16 w-16 mb-2">
                            {game.home_team.logo_url ? (
                              <Image
                                src={game.home_team.logo_url || "/placeholder.svg"}
                                alt={game.home_team.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                {game.home_team.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-center">{game.home_team.name}</span>
                          <span className="text-2xl font-bold mt-1">{game.home_score}</span>
                        </div>

                        <div className="mx-4 text-xl font-bold">VS</div>

                        <div className="flex flex-col items-center">
                          <div className="relative h-16 w-16 mb-2">
                            {game.away_team.logo_url ? (
                              <Image
                                src={game.away_team.logo_url || "/placeholder.svg"}
                                alt={game.away_team.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                {game.away_team.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-center">{game.away_team.name}</span>
                          <span className="text-2xl font-bold mt-1">{game.away_score}</span>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <span className="text-sm text-muted-foreground">Final</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
