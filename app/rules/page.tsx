import { PageHeader } from "@/components/ui/page-header"

export default function RulesPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <PageHeader
          title="League Rules"
          description="Official rules and regulations for the Secret Chel Society"
        />

        <div className="mt-8 max-w-4xl mx-auto prose dark:prose-invert">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Please read the Rules and Regulations stated here. You should visit this frequently to review the Rules and
              Regulations, SCS has the right to add, remove, modify, or otherwise change any part of these Rules and
              Regulations in whole or in part at any time. Changes will be effective when notice of such change is posted.
            </h2>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">1. Code of Conduct</h3>
            <p className="text-white/80">
              Harassment of other users. Abuse or disruption within the league. Blackmail and cyber-bullying Racist or
              sexist comments Advertising of third party services or other leagues, unless authorized by us in advance and
              in writing. Abusive language and excessive trolling of players within the league and/or discord.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">2. Disconnections (DC's) & Lag-Outs</h3>
            <p className="text-white/80">
              2.1.1 DC's experienced in game by a team, must finish the period in which the player DC'ed from. End the
              game, collect stats and restart the game. The game is to resume from when the previous DC'ed game ended. At
              the start of the next period.
            </p>
            <p className="text-white/80">
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

          <section className="mb-8">
            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">3. AI/Computer Player(s)</h3>
            <p className="text-white/80">
              3.1.1 All goals scored by a computer player from a DC or Player Quitting do not count towards the final
              score & will be deducted from the final score upon proof via the box score or video proof. This does NOT
              apply to players serving Fighting Majors since those players are still in game.
            </p>
            <p className="text-white/80">
              3.1.2Any Player attempting to use an EA generic Computer player name to deceive staff and/or stats, will
              automatically be assumed that all points scored were done so by a computer player, therefore not count if it
              has been brought to the attention of league staff..
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">4. On Ice Infractions</h3>
            <p className="text-white/80">
              4.1.1 Players caught diving on the ice in attempts to purposely take penalties, throwing the game, or
              otherwise not play the game as it was intended are susceptible to suspension by league staff on a case by
              case basis. 4.1.2 Players cannot use the goalie position to trap, trip, or obstruct other players in a
              manner that exceeds what would be considered realistic gameplay.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">5. Management & Responsibilities</h3>
            <p className="text-white/80">
              5.1.1 All Management must follow the rules and guidelines set forth by the league. If the league determines
              a team to be poorly managed and the management is hurting the league, Staff can step in, remove management,
              and make any restoration moves necessary.
            </p>
            <p className="text-white/80">
              5.1.2 In cases where an Owner cannot fulfill their duties as Owner, GMs will be asked to fill in until new
              management can be appointed.
            </p>
            <p className="text-white/80">
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

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Team Management</h2>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">1. Salary Cap</h3>
            <p className="text-white/80">Each team has a salary cap of $30,000,000. Teams must stay under the salary cap at all times.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">2. Roster Size</h3>
            <p className="text-white/80">Each team can have a maximum of 20 players on their roster.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">3. Player Positions</h3>
            <p className="text-white/80">Teams must have players in all positions: Center, Left Wing, Right Wing, Left Defense, Right Defense, and Goalie.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">4. Trading</h3>
            <p className="text-white/80">Teams can trade players and draft picks. All trades must be approved by league management.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">5. Free Agency</h3>
            <p className="text-white/80">Teams can sign free agents during designated free agency periods.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Game Rules</h2>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">1. Game Settings</h3>
            <p className="text-white/80">All games must be played with the official SCS game settings.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">2. Game Length</h3>
            <p className="text-white/80">Regular season games are 3 periods of 20 minutes each.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">3. Overtime</h3>
            <p className="text-white/80">If a game is tied after regulation, a 5-minute 3-on-3 overtime period will be played.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">4. Shootout</h3>
            <p className="text-white/80">If the game is still tied after overtime, a shootout will determine the winner.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Playoffs</h2>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">1. Qualification</h3>
            <p className="text-white/80">The top 8 teams in the standings qualify for the playoffs.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">2. Format</h3>
            <p className="text-white/80">Playoffs are single elimination with best-of-3 series in the first round.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-white">3. Championship</h3>
            <p className="text-white/80">The championship series is best-of-5.</p>
          </section>
        </div>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
