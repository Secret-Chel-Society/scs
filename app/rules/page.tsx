import { PageHeader } from "@/components/ui/page-header"
import { 
  Shield, 
  Users, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  Target, 
  Gavel, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Info,
  Star,
  Zap,
  Heart,
  Award,
  Calendar,
  DollarSign,
  UserCheck,
  GamepadIcon,
  BarChart3
} from "lucide-react"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              League Rules & Regulations
            </h1>
            <p className="hockey-subtitle mb-8">
              Official rules and regulations for the Secret Chel Society
            </p>
            
            {/* Rules Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  Code of
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Conduct
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Team
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Management
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Season
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Structure
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Rules &
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Enforcement
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Important Notice */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-goal-red-800 dark:text-goal-red-200 mb-3">
                    Important Notice
                  </h2>
                  <p className="text-goal-red-700 dark:text-goal-red-300 leading-relaxed">
                    Please read the Rules and Regulations stated here. You should visit this frequently to review the Rules and
                    Regulations, SCS has the right to add, remove, modify, or otherwise change any part of these Rules and
                    Regulations in whole or in part at any time. Changes will be effective when notice of such change is posted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code of Conduct Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  1. Code of Conduct
                </h2>
              </div>
              
              <div className="space-y-4 text-hockey-silver-700 dark:text-hockey-silver-300">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-goal-red-500 mt-0.5 flex-shrink-0" />
                  <p>Harassment of other users. Abuse or disruption within the league.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-goal-red-500 mt-0.5 flex-shrink-0" />
                  <p>Blackmail and cyber-bullying. Racist or sexist comments.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-goal-red-500 mt-0.5 flex-shrink-0" />
                  <p>Advertising of third party services or other leagues, unless authorized by us in advance and in writing.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-goal-red-500 mt-0.5 flex-shrink-0" />
                  <p>Abusive language and excessive trolling of players within the league and/or discord.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disconnections Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  2. Disconnections (DC's) & Lag-Outs
                </h2>
              </div>
              
              <div className="space-y-4 text-hockey-silver-700 dark:text-hockey-silver-300">
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                  <h4 className="font-semibold text-assist-green-800 dark:text-assist-green-200 mb-2">2.1.1 Game Continuation</h4>
                  <p>DC's experienced in game by a team, must finish the period in which the player DC'ed from. End the
                  game, collect stats and restart the game. The game is to resume from when the previous DC'ed game ended. At
                  the start of the next period.</p>
                </div>
                
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                  <h4 className="font-semibold text-assist-green-800 dark:text-assist-green-200 mb-2">2.1.2 Penalty Stacking</h4>
                  <p>The DC'ed player must take a Penalty at the opening faceoff. For each player that DC's from a game, a
                  penalty must be taken. Penalties are to be taken once the previous penalty has concluded. Never served
                  simultaneously, only served consecutively. This is called Penalty Stacking.</p>
                </div>
                
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                  <h4 className="font-semibold text-assist-green-800 dark:text-assist-green-200 mb-2">2.1.3 Goalie Disconnect Protocol</h4>
                  <p>In the event of a goalie disconnect upon the game restarting; the offending team must win the
                  restarted games opening faceoff. The puck will be held by the offending team in the offending teams
                  defensive zone ONLY. The puck is to be held to the point at which the goalie disconnected. (within a 5
                  second time frame will not make or break the game). Play resumes at the start of the next faceoff. Any
                  fooling around that results in goals or other penalties unrelated to the disconnect will count and not be
                  stripped from the game.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI/Computer Players Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <GamepadIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  3. AI/Computer Player(s)
                </h2>
              </div>
              
              <div className="space-y-4 text-hockey-silver-700 dark:text-hockey-silver-300">
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h4 className="font-semibold text-rink-blue-800 dark:text-rink-blue-200 mb-2">3.1.1 Computer Player Goals</h4>
                  <p>All goals scored by a computer player from a DC or Player Quitting do not count towards the final
                  score & will be deducted from the final score upon proof via the box score or video proof. This does NOT
                  apply to players serving Fighting Majors since those players are still in game.</p>
                </div>
                
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h4 className="font-semibold text-rink-blue-800 dark:text-rink-blue-200 mb-2">3.1.2 Deceptive Practices</h4>
                  <p>Any Player attempting to use an EA generic Computer player name to deceive staff and/or stats, will
                  automatically be assumed that all points scored were done so by a computer player, therefore not count if it
                  has been brought to the attention of league staff.</p>
                </div>
              </div>
            </div>
          </div>

          {/* On Ice Infractions Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  4. On Ice Infractions
                </h2>
              </div>
              
              <div className="space-y-4 text-hockey-silver-700 dark:text-hockey-silver-300">
                <div className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 p-4 rounded-lg border-l-4 border-goal-red-500">
                  <h4 className="font-semibold text-goal-red-800 dark:text-goal-red-200 mb-2">4.1.1 Diving & Unsportsmanlike Conduct</h4>
                  <p>Players caught diving on the ice in attempts to purposely take penalties, throwing the game, or
                  otherwise not play the game as it was intended are susceptible to suspension by league staff on a case by
                  case basis.</p>
                </div>
                
                <div className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 p-4 rounded-lg border-l-4 border-goal-red-500">
                  <h4 className="font-semibold text-goal-red-800 dark:text-goal-red-200 mb-2">4.1.2 Goalie Position Abuse</h4>
                  <p>Players cannot use the goalie position to trap, trip, or obstruct other players in a
                  manner that exceeds what would be considered realistic gameplay.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Management & Responsibilities Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  5. Management & Responsibilities
                </h2>
              </div>
              
              <div className="space-y-4 text-hockey-silver-700 dark:text-hockey-silver-300">
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-2">5.1.1 Management Compliance</h4>
                  <p>All Management must follow the rules and guidelines set forth by the league. If the league determines
                  a team to be poorly managed and the management is hurting the league, Staff can step in, remove management,
                  and make any restoration moves necessary.</p>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-2">5.1.2 Owner Duties</h4>
                  <p>In cases where an Owner cannot fulfill their duties as Owner, GMs will be asked to fill in until new
                  management can be appointed.</p>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-2">5.1.3 Management Authority</h4>
                  <p>Managers are considered and expected to be the spokesperson for their team & players. Owners and GMs
                  should be the primary/only point of contact between league admins and players. AGMs do not carry any
                  authority as an official spokesperson unless deemed the point of contact for the evening or period in which
                  the Owner or GM are unavailable.</p>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h4 className="font-semibold text-ice-blue-800 dark:text-ice-blue-200 mb-2">5.1.4 Rule Violations</h4>
                  <p>If management and/or players in SCS are caught in violation of the rules, attempting to circumvent,
                  or any action deemed detrimental to the league operation, league removal, bans, fines or additional action
                  can be taken by the league and not limited to the defined punishments in the rulebook.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Team Management
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border border-assist-green-200 dark:border-assist-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-assist-green-600" />
                    <h3 className="font-semibold text-assist-green-800 dark:text-assist-green-200">Salary Cap</h3>
                  </div>
                  <p className="text-assist-green-700 dark:text-assist-green-300">Each team has a salary cap of $30,000,000. Teams must stay under the salary cap at all times.</p>
                </div>
                
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border border-assist-green-200 dark:border-assist-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="h-5 w-5 text-assist-green-600" />
                    <h3 className="font-semibold text-assist-green-800 dark:text-assist-green-200">Roster Size</h3>
                  </div>
                  <p className="text-assist-green-700 dark:text-assist-green-300">Teams must maintain a roster size of minimum 12 players and no more than 15 players.</p>
                </div>
                
                <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border border-assist-green-200 dark:border-assist-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-assist-green-600" />
                    <h3 className="font-semibold text-assist-green-800 dark:text-assist-green-200">Free Agency</h3>
                  </div>
                  <p className="text-assist-green-700 dark:text-assist-green-300">Free agency operates on a bidding system. Teams can place bids on free agents, and the highest bidder after 12 hours wins the rights to the player.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Season Structure Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Season Structure
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border border-rink-blue-200 dark:border-rink-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-rink-blue-600" />
                    <h3 className="font-semibold text-rink-blue-800 dark:text-rink-blue-200">Regular Season</h3>
                  </div>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300">The regular season consists of 45 games. Points are awarded as follows: 2 points for a win, 1 point for an overtime/shootout loss, 0 points for a regulation loss.</p>
                </div>
                
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border border-rink-blue-200 dark:border-rink-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-rink-blue-600" />
                    <h3 className="font-semibold text-rink-blue-800 dark:text-rink-blue-200">Playoffs</h3>
                  </div>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300">The top 8 teams qualify for the playoffs. The playoff format is a best-of-7 series. Games are scheduled on Wednesday, Thursday, and Friday evenings.</p>
                </div>
                
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border border-rink-blue-200 dark:border-rink-blue-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-rink-blue-600" />
                    <h3 className="font-semibold text-rink-blue-800 dark:text-rink-blue-200">Draft</h3>
                  </div>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300">The entry draft is held before each season. Draft order is determined by reverse standings from the previous season, with a lottery for the top 3 picks. (This Will be implemented in Season 2)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Need Help Understanding the Rules?
                </h3>
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                If you have any questions about these rules or need clarification, please contact our league staff through Discord or the contact form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
