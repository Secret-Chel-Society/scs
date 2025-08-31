import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Users, Trophy, Calendar, AlertTriangle, Gavel, BookOpen, FileText, Award } from "lucide-react"

function RulesStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-red-200 mb-2">Code</div>
        <div className="text-red-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Of Conduct
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">45</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" />
          Games/Season
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">$30M</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Salary Cap
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">8</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5" />
          Playoff Teams
        </div>
      </div>
    </div>
  )
}

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-200 to-orange-200 bg-clip-text text-transparent">
              League Rules
            </h1>
            <p className="text-xl text-red-200 mb-8">
              Official rules and regulations for the Secret Chel Society
            </p>
          </div>

          {/* Rules Statistics */}
          <RulesStats />

          {/* Main Content */}
          <div className="mt-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="mb-8 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <h2 className="text-2xl font-bold text-white">
                        Please read the Rules and Regulations stated here. You should visit this frequently to review the Rules and
                        Regulations, SCS has the right to add, remove, modify, or otherwise change any part of these Rules and
                        Regulations in whole or in part at any time. Changes will be effective when notice of such change is posted.
                      </h2>
                    </div>
                  </div>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "600ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-red-400" />
                      <h3 className="text-xl font-semibold text-white">1. Code of Conduct</h3>
                    </div>
                    <p className="text-white/80">
                      Harassment of other users. Abuse or disruption within the league. Blackmail and cyber-bullying Racist or
                      sexist comments Advertising of third party services or other leagues, unless authorized by us in advance and
                      in writing. Abusive language and excessive trolling of players within the league and/or discord.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "700ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Gavel className="h-6 w-6 text-orange-400" />
                      <h3 className="text-xl font-semibold text-white">2. Disconnections (DC's) & Lag-Outs</h3>
                    </div>
                    <p className="text-white/80 mb-3">
                      2.1.1 DC's experienced in game by a team, must finish the period in which the player DC'ed from. End the
                      game, collect stats and restart the game. The game is to resume from when the previous DC'ed game ended. At
                      the start of the next period.
                    </p>
                    <p className="text-white/80 mb-3">
                      2.1.2 The DC'ed player must take a Penalty at the opening faceoff. For each player that DC's from a game, a
                      penalty must be taken. Penalties are to be taken once the previous penalty has concluded. Never served
                      simultaneously, only served consecutively. This is called Penalty Stacking
                    </p>
                    <p className="text-white/80">
                      2.1.3 In the event of a goalie disconnect upon the game restarting; the offending team must win the
                      restarted games opening faceoff. The puck will be held by the offending team in the offending teams
                      defensive zone ONLY. The puck is to be held to the point at which the goalie disconnected. (within a 5
                      second time frame will not make or break the game). Play resumes at the start of the next faceoff. Any
                      fooling around that results in goals or other penalties unrelated to the disconnect will count and not be
                      stripped from the game.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "800ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-yellow-400" />
                      <h3 className="text-xl font-semibold text-white">3. AI/Computer Player(s)</h3>
                    </div>
                    <p className="text-white/80 mb-3">
                      3.1.1 All goals scored by a computer player from a DC or Player Quitting do not count towards the final
                      score & will be deducted from the final score upon proof via the box score or video proof. This does NOT
                      apply to players serving Fighting Majors since those players are still in game.
                    </p>
                    <p className="text-white/80">
                      3.1.2Any Player attempting to use an EA generic Computer player name to deceive staff and/or stats, will
                      automatically be assumed that all points scored were done so by a computer player, therefore not count if it
                      has been brought to the attention of league staff..
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "900ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">4. On Ice Infractions</h3>
                    </div>
                    <p className="text-white/80">
                      4.1.1 Players caught diving on the ice in attempts to purposely take penalties, throwing the game, or
                      otherwise not play the game as it was intended are susceptible to suspension by league staff on a case by
                      case basis. 4.1.2 Players cannot use the goalie position to trap, trip, or obstruct other players in a
                      manner that exceeds what would be considered realistic gameplay.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1000ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">5. Management & Responsibilities</h3>
                    </div>
                    <p className="text-white/80 mb-3">
                      5.1.1 All Management must follow the rules and guidelines set forth by the league. If the league determines
                      a team to be poorly managed and the management is hurting the league, Staff can step in, remove management,
                      and make any restoration moves necessary.
                    </p>
                    <p className="text-white/80 mb-3">
                      5.1.2 In cases where an Owner cannot fulfill their duties as Owner, GMs will be asked to fill in until new
                      management can be appointed.
                    </p>
                    <p className="text-white/80 mb-3">
                      5.1.3 Managers are considered and expected to be the spokesperson for their team & players. Owners and GMs
                      should be the primary/only point of contact between league admins and players. AGMs do not carry any
                      authority as an official spokesperson unless deemed the point of contact for the evening or period in which
                      the Owner or GM are unavailable.
                    </p>
                    <p className="text-white/80">
                      5.1.4 If management and/or players in SCS are caught in violation of the rules, attempting to circumvent,
                      or any action deemed detrimental to the league operation, league removal, bans, fines or additional action
                      can be taken by the league and not limited to the defined punishments in the rulebook. Punishable offenses
                      are below but not limited to: Failure to update stats Illegal rosters Failure to have the roster comply with
                      game requirements Player Tampering Manipulating of Stats Quitting Toxic Behavior Using other player accounts
                      Any action deemed detrimental to the league integrity or operations.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1100ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">Team Management</h2>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">1. Salary Cap</h3>
                    </div>
                    <p className="text-white/80 mb-6">Each team has a salary cap of $30,000,000. Teams must stay under the salary cap at all times.</p>

                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">2. Roster Size</h3>
                    </div>
                    <p className="text-white/80 mb-6">Teams must maintain a roster size of minimum 12 players and no more than 15 players.</p>

                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-yellow-400" />
                      <h3 className="text-xl font-semibold text-white">3. Free Agency</h3>
                    </div>
                    <p className="text-white/80">
                      Free agency operates on a bidding system. Teams can place bids on free agents, and the highest bidder after
                      12 hours wins the rights to the player.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1200ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-indigo-400" />
                      <h2 className="text-2xl font-bold text-white">Season Structure</h2>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">1. Regular Season</h3>
                    </div>
                    <p className="text-white/80 mb-6">
                      The regular season consists of 45 games. Points are awarded as follows: 2 points for a win, 1 point for a
                      overtime/shootout loss, 0 points for a regulation loss.
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <Award className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">2. Playoffs</h3>
                    </div>
                    <p className="text-white/80 mb-6">
                      The top 8 teams qualify for the playoffs. The playoff format is a best-of-7 series for the playoffs. The
                      format schedule is as follows Wednesday Game 1: 8:00 PM EST Wednesday Game 2: 8:35 PM EST Wednesday Game 3:
                      9:10 PM EST Thursday Game 4: 8:35 PM EST Thursday Game 5: 9:10 PM EST Friday Game 6: 8:35 PM EST Friday Game
                      7: 9:10 PM EST
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">3. Draft</h3>
                    </div>
                    <p className="text-white/80">
                      The entry draft is held before each season. Draft order is determined by reverse standings from the previous
                      season, with a lottery for the top 3 picks. (This Will be implemented in Season 2)
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
