import type { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = {
  title: "FAQ - Major Gaming Hockey League",
  description: "Frequently asked questions about the Major Gaming Hockey League (MGHL)",
}

export default function FAQPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <PageHeader
        heading="Frequently Asked Questions"
        subheading="Find answers to common questions about the Major Gaming Hockey League"
      />

      <div className="mt-8">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">How do I join the MGHL?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                To join the MGHL, you need to register on our website during the registration period. Follow these
                steps:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Create an account on the MGHL website</li>
                <li>Complete your player profile with your gamer tag and contact information</li>
                <li>Register for the current or upcoming season during the registration window</li>
                <li>
                  You'll either be drafted by a team or can participate in free agency depending on the league schedule
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">What are the league rules?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                The MGHL has a comprehensive set of rules covering gameplay, conduct, team management, and more. You can
                find the complete rulebook on our{" "}
                <a href="/rules" className="text-primary hover:underline">
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

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">How does free agency work?</AccordionTrigger>
            <AccordionContent>
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
                <a href="/free-agency" className="text-primary hover:underline">
                  Free Agency page
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">What positions can I play?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">In the MGHL, you can play as a:</p>
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

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">How are matches scheduled?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Match scheduling in the MGHL follows these general guidelines:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The league administrators create the season schedule with matchups</li>
                <li>Games are typically scheduled for 8:00,8:35,9:10PM EST Wednesday,Thursday, and Friday</li>
                <li>Team managers coordinate with their players to ensure availability</li>
                <li>Match results must be reported by team managers after completion</li>
              </ul>
              <p className="mt-2">
                You can view the current schedule on the{" "}
                <a href="/matches" className="text-primary hover:underline">
                  Matches page
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-left">How do team management roles work?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Why Manage in MGHL?:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Management get to pick a GM and AGM at a cheaper salary than them going into bidding.</li>
                <li>
                  <strong>Owner:</strong> Free Contract
                </li>
                <li>
                  <strong>General Manager (GM):</strong> Free Contract
                </li>
                <li>
                  <strong>Assistant General Manager (AGM):</strong> $1,500,000.00 Contract
                </li>
              </ul>
              <p className="mt-2">
                These roles have different permissions on the website for managing team operations. Team management can
                access additional features through the Team Management dashboard.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-left">How are player statistics tracked?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Player statistics are tracked through our system:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Team managers report game results and individual player statistics</li>
                <li>Stats are verified by league administrators</li>
                <li>Player profiles are updated with the latest statistics</li>
                <li>Season and career statistics are maintained in our database</li>
              </ul>
              <p className="mt-2">
                You can view player and team statistics on the{" "}
                <a href="/stats" className="text-primary hover:underline">
                  Stats page
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-left">How do I contact league administration?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">You can contact league administration through several channels:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Send a direct message to an admin through the website messaging system</li>
                <li>Join our Discord server and message an admin (link available in your profile)</li>
              </ul>
              <p className="mt-2">For urgent matters, Discord is usually the fastest way to reach an administrator.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
