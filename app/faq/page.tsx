import type { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = {
  title: "FAQ - Secret Chel Society",
  description: "Frequently asked questions about the Secret Chel Society (SCS)",
}

export default function FAQPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container py-8 max-w-4xl mx-auto px-4">
        <PageHeader
          heading="Frequently Asked Questions"
          subheading="Find answers to common questions about the Secret Chel Society"
        />

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">How do I join the SCS?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  To join the SCS, you need to register on our website during the registration period. Follow these
                  steps:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Create an account on the SCS website</li>
                  <li>Complete your player profile with your gamer tag and contact information</li>
                  <li>Register for the current or upcoming season during the registration window</li>
                  <li>
                    You'll either be drafted by a team or can participate in free agency depending on the league schedule
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">What are the league rules?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  The SCS has a comprehensive set of rules covering gameplay, conduct, team management, and more. You can
                  find the complete rulebook on our{" "}
                  <a href="/rules" className="text-purple-300 hover:underline">
                    Rules page
                  </a>
                  .
                </p>
                <p>Some key rules include:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Code Of Conduct</li>
                  <li>Player Expectations</li>
                  <li>Match Expectations</li>
                  <li>Match scheduling and reporting procedures</li>
                  <li>Disciplinary actions for rule violations</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">How does free agency work?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  Free agency is the process where players without a team can be signed by team managers. The process
                  works as follows:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Players register as free agents during the registration period</li>
                  <li>Teams can view available free agents on the Free Agency page</li>
                  <li>Teams place bids on players they want to sign</li>
                  <li>Once 12 hours pass without another bid the team with the winning bid, wins the player</li>
                  <li>Once a bidding period is finished, the player is added to the team's roster</li>
                </ol>
                <p className="mt-2">
                  You can view current free agents on the{" "}
                  <a href="/free-agency" className="text-purple-300 hover:underline">
                    Free Agency page
                  </a>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">What positions can I play?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">In the SCS, you can play as a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Forward (Left Wing, Center, Right Wing)</li>
                  <li>Defenseman (Left Defense, Right Defense)</li>
                  <li>Goaltender</li>
                  <li>If you sign up as ex. LW,LD you can play both Forward and Defense positions.</li>
                </ul>
                <p className="mt-2">
                  When registering, you'll be asked to specify your Primary and Secondary positions. Teams may recruit you
                  based on their needs and your position preferences.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">How are teams formed?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  Teams in the SCS are formed through a combination of drafting and free agency:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Team managers are selected based on experience and commitment</li>
                  <li>Managers draft players during the league draft</li>
                  <li>Undrafted players become free agents</li>
                  <li>Teams can sign free agents through the bidding system</li>
                  <li>Teams must maintain roster size and salary cap requirements</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">What is the season schedule?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  The SCS season typically follows this schedule:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Registration period (varies by season)</li>
                  <li>Draft and team formation</li>
                  <li>Regular season games (typically 45 games)</li>
                  <li>Playoffs for qualifying teams</li>
                  <li>Off-season for trades and roster changes</li>
                </ul>
                <p className="mt-2">
                  Specific dates and schedules are announced before each season begins.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">How do I report match results?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  Match results should be reported by the winning team's manager:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Take screenshots of the final score and stats</li>
                  <li>Submit the results through the league management system</li>
                  <li>Include any notable incidents or rule violations</li>
                  <li>Both teams should confirm the results</li>
                </ol>
                <p className="mt-2">
                  Failure to report results may result in penalties for the team.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-white/20">
              <AccordionTrigger className="text-left text-white hover:text-purple-300 transition-colors">What happens if I can't make a game?</AccordionTrigger>
              <AccordionContent className="text-white/80">
                <p className="mb-2">
                  If you can't make a scheduled game:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Notify your team manager as soon as possible</li>
                  <li>Your team may need to find a substitute player</li>
                  <li>Repeated no-shows may result in disciplinary action</li>
                  <li>Teams are responsible for fielding a full roster for each game</li>
                </ul>
                <p className="mt-2">
                  Communication with your team is essential for league success.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
