import { PageHeader } from "@/components/ui/page-header"

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="League Rules"
        description="Official rules and regulations for the Major Gaming Hockey League"
      />

      <div className="mt-8 max-w-4xl mx-auto prose dark:prose-invert">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Please read the Rules and Regulations stated here. You should visit this frequently to review the Rules and
            Regulations, MGHL has the right to add, remove, modify, or otherwise change any part of these Rules and
            Regulations in whole or in part at any time. Changes will be effective when notice of such change is posted.
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-2">1. Code of Conduct</h3>
          <p>
            Harassment of other users. Abuse or disruption within the league. Blackmail and cyber-bullying Racist or
            sexist comments Advertising of third party services or other leagues, unless authorized by us in advance and
            in writing. Abusive language and excessive trolling of players within the league and/or discord.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">2. Disconnections (DC's) & Lag-Outs</h3>
          <p>
            2.1.1 DC’s experienced in game by a team, must finish the period in which the player DC’ed from. End the
            game, collect stats and restart the game. The game is to resume from when the previous DC’ed game ended. At
            the start of the next period.
          </p>
          <p>
            2.1.2 The DC’ed player must take a Penalty at the opening faceoff. For each player that DC’s from a game, a
            penalty must be taken. Penalties are to be taken once the previous penalty has concluded. Never served
            simultaneously, only served consecutively. This is called Penalty Stacking
          </p>
          <p>
            2.1.3 In the event of a goalie disconnect upon the game restarting; the offending team must win the
            restarted games opening faceoff. The puck will be held by the offending team in the offending teams
            defensive zone ONLY. The puck is to be held to the point at which the goalie disconnected. (within a 5
            second time frame will not make or break the game). Play resumes at the start of the next faceoff. Any
            fooling around that results in goals or other penalties unrelated to the disconnect will count and not be
            stripped from the game.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mt-6 mb-2">3. AI/Computer Player(s)</h3>
          <p>
            3.1.1 All goals scored by a computer player from a DC or Player Quitting do not count towards the final
            score & will be deducted from the final score upon proof via the box score or video proof. This does NOT
            apply to players serving Fighting Majors since those players are still in game.
          </p>
          <p>
            3.1.2Any Player attempting to use an EA generic Computer player name to deceive staff and/or stats, will
            automatically be assumed that all points scored were done so by a computer player, therefore not count if it
            has been brought to the attention of league staff..
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">4. On Ice Infractions</h3>
          <p>
            4.1.1 Players caught diving on the ice in attempts to purposely take penalties, throwing the game, or
            otherwise not play the game as it was intended are susceptible to suspension by league staff on a case by
            case basis. 4.1.2 Players cannot use the goalie position to trap, trip, or obstruct other players in a
            manner that exceeds what would be considered realistic gameplay.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">5. Management & Responsibilities</h3>
          <p>
            5.1.1 All Management must follow the rules and guidelines set forth by the league. If the league determines
            a team to be poorly managed and the management is hurting the league, Staff can step in, remove management,
            and make any restoration moves necessary.
          </p>
          <p>
            5.1.2 In cases where an Owner cannot fulfill their duties as Owner, GMs will be asked to fill in until new
            management can be appointed.
          </p>
          <p>
            5.1.3 Managers are considered and expected to be the spokesperson for their team & players. Owners and GMs
            should be the primary/only point of contact between league admins and players. AGMs do not carry any
            authority as an official spokesperson unless deemed the point of contact for the evening or period in which
            the Owner or GM are unavailable.
          </p>
          <p>
            5.1.4 If management and/or players in MGHL are caught in violation of the rules, attempting to circumvent,
            or any action deemed detrimental to the league operation, league removal, bans, fines or additional action
            can be taken by the league and not limited to the defined punishments in the rulebook. Punishable offenses
            are below but not limited to: Failure to update stats Illegal rosters Failure to have the roster comply with
            game requirements Player Tampering Manipulating of Stats Quitting Toxic Behavior Using other player accounts
            Any action deemed detrimental to the league integrity or operations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Team Management</h2>

          <h3 className="text-xl font-semibold mt-6 mb-2">1. Salary Cap</h3>
          <p>Each team has a salary cap of $30,000,000. Teams must stay under the salary cap at all times.</p>

          <h3 className="text-xl font-semibold mt-6 mb-2">2. Roster Size</h3>
          <p>Teams must maintain a roster size of minimum 12 players and no more than 15 players.</p>

          <h3 className="text-xl font-semibold mt-6 mb-2">3. Free Agency</h3>
          <p>
            Free agency operates on a bidding system. Teams can place bids on free agents, and the highest bidder after
            12 hours wins the rights to the player.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Season Structure</h2>

          <h3 className="text-xl font-semibold mt-6 mb-2">1. Regular Season</h3>
          <p>
            The regular season consists of 45 games. Points are awarded as follows: 2 points for a win, 1 point for an
            overtime/shootout loss, 0 points for a regulation loss.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">2. Playoffs</h3>
          <p>
            The top 8 teams qualify for the playoffs. The playoff format is a best-of-7 series for the playoffs. The
            format schedule is as follows Wednesday Game 1: 8:00 PM EST Wednesday Game 2: 8:35 PM EST Wednesday Game 3:
            9:10 PM EST Thursday Game 4: 8:35 PM EST Thursday Game 5: 9:10 PM EST Friday Game 6: 8:35 PM EST Friday Game
            7: 9:10 PM EST
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">3. Draft</h3>
          <p>
            The entry draft is held before each season. Draft order is determined by reverse standings from the previous
            season, with a lottery for the top 3 picks. (This Will be implemented in Season 2)
          </p>
        </section>
      </div>
    </div>
  )
}
