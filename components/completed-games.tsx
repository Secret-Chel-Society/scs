"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
// import { motion } from "framer-motion"
import { Calendar, Clock, Trophy, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
      <Card className="p-8 text-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/20">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
            <Trophy className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-white/70">No completed games yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {games.map((game) => {
          const matchDate = new Date(game.match_date)
          const homeWon = game.home_score > game.away_score
          const awayWon = game.away_score > game.home_score

          return (
            <CarouselItem key={game.id} className="md:basis-1/2 lg:basis-1/3 h-full">
              <Link href={`/matches/${game.id}`}>
                <div 
                  className="hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                >
                  <Card className="h-full overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20 hover:border-blue-500/50 transition-all duration-300 group">
                    <CardContent className="flex flex-col items-center p-6 relative">
                      {/* Background glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Header with date and time */}
                      <div className="w-full flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 text-sm text-blue-300">
                          <Calendar className="h-4 w-4" />
                          {format(matchDate, "MMM d")}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <Clock className="h-4 w-4" />
                          {format(matchDate, "h:mm a")}
                        </div>
                      </div>

                      {/* Teams and Scores */}
                      <div className="flex items-center justify-between w-full relative z-10">
                        {/* Home Team */}
                        <div className="flex flex-col items-center">
                          <div className="relative h-20 w-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                            {game.home_team.logo_url ? (
                              <Image
                                src={game.home_team.logo_url || "/placeholder.svg"}
                                alt={game.home_team.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-20 w-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                                <span className="text-blue-300 font-bold text-lg">{game.home_team.name.substring(0, 2)}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-center text-white mb-2">{game.home_team.name}</span>
                          <div className={`text-3xl font-bold ${homeWon ? 'text-green-400' : 'text-white/70'}`}>
                            {game.home_score}
                          </div>
                          {homeWon && (
                            <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
                              <Trophy className="h-3 w-3 mr-1" />
                              WIN
                            </Badge>
                          )}
                        </div>

                        {/* VS Divider */}
                        <div className="mx-6 flex flex-col items-center">
                          <div className="text-2xl font-bold text-white/50 mb-2">VS</div>
                          <div className="w-px h-16 bg-gradient-to-b from-blue-500/50 to-purple-500/50" />
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center">
                          <div className="relative h-20 w-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                            {game.away_team.logo_url ? (
                              <Image
                                src={game.away_team.logo_url || "/placeholder.svg"}
                                alt={game.away_team.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-20 w-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
                                <span className="text-purple-300 font-bold text-lg">{game.away_team.name.substring(0, 2)}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-center text-white mb-2">{game.away_team.name}</span>
                          <div className={`text-3xl font-bold ${awayWon ? 'text-green-400' : 'text-white/70'}`}>
                            {game.away_score}
                          </div>
                          {awayWon && (
                            <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
                              <Trophy className="h-3 w-3 mr-1" />
                              WIN
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 text-center relative z-10">
                        <div className="flex items-center justify-center gap-2 text-blue-300">
                          <Zap className="h-4 w-4" />
                          <span className="text-sm font-medium">Final Score</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="bg-slate-800/80 border-white/20 text-white hover:bg-slate-700/80" />
      <CarouselNext className="bg-slate-800/80 border-white/20 text-white hover:bg-slate-700/80" />
    </Carousel>
  )
}
