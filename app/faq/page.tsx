import type { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageHeader } from "@/components/ui/page-header"
import { 
  HelpCircle, 
  Users, 
  Trophy, 
  Target, 
  Clock, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Star, 
  Zap, 
  Heart, 
  Award,
  BookOpen,
  GamepadIcon,
  Calendar,
  DollarSign,
  UserCheck,
  Shield,
  TrendingUp,
  Info
} from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ - Secret Chel Society",
  description: "Frequently asked questions about the Secret Chel Society (SCS)",
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Frequently Asked Questions
            </h1>
            <p className="hockey-subtitle mb-8">
              Find answers to common questions about the Secret Chel Society
            </p>
            
            {/* FAQ Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  Getting
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Started
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  League
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Rules
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Gameplay
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  & Positions
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Team
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Management
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Getting Started Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Getting Started
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-ice-blue-200 dark:border-ice-blue-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      How do I join the SCS?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                      <p className="mb-3">
                        To join the SCS, you need to register on our website during the registration period. Follow these
                        steps:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Create an account on the SCS website</li>
                        <li>Complete your player profile with your gamer tag and contact information</li>
                        <li>Register for the current or upcoming season during the registration window</li>
                        <li>
                          You'll either be drafted by a team or can participate in free agency depending on the league schedule
                        </li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* League Rules Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  League Rules
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-2" className="border-assist-green-200 dark:border-assist-green-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-assist-green-600 dark:hover:text-assist-green-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      What are the league rules?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                      <p className="mb-3">
                        The SCS has a comprehensive set of rules covering gameplay, conduct, team management, and more. You can
                        find the complete rulebook on our{" "}
                        <a href="/rules" className="text-assist-green-600 dark:text-assist-green-400 hover:text-assist-green-700 dark:hover:text-assist-green-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-assist-green-500 transition-all duration-200">
                          Rules page
                        </a>
                        .
                      </p>
                      <p className="mb-2">Some key rules include:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Code Of Conduct</li>
                        <li>Player Expectations</li>
                        <li>Match Expectations</li>
                        <li>Match scheduling and reporting procedures</li>
                        <li>Disciplinary actions for rule violations</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Free Agency Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Free Agency & Recruitment
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-3" className="border-rink-blue-200 dark:border-rink-blue-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-rink-blue-600 dark:hover:text-rink-blue-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      How does free agency work?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                      <p className="mb-3">
                        Free agency is the process where players without a team can be signed by team managers. The process
                        works as follows:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Players register as free agents during the registration period</li>
                        <li>Teams can view available free agents on the Free Agency page</li>
                        <li>Teams place bids on players they want to sign</li>
                        <li>Once 12 hours pass without another bid the team with the winning bid, wins the player</li>
                        <li>Once a bidding period is finished, the player is added to the team's roster</li>
                      </ol>
                      <p className="mt-3">
                        You can view current free agents on the{" "}
                        <a href="/free-agency" className="text-rink-blue-600 dark:text-rink-blue-400 hover:text-rink-blue-700 dark:hover:text-rink-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-rink-blue-500 transition-all duration-200">
                          Free Agency page
                        </a>
                        .
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Gameplay & Positions Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <GamepadIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Gameplay & Positions
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-4" className="border-ice-blue-200 dark:border-ice-blue-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      What positions can I play?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                      <p className="mb-3">In the SCS, you can play as a:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Forward (Left Wing, Center, Right Wing)</li>
                        <li>Defenseman (Left Defense, Right Defense)</li>
                        <li>Goaltender</li>
                        <li>If you sign up as ex. LW,LD you can play both Forward and Defense positions.</li>
                      </ul>
                      <p className="mt-3">
                        When registering, you'll be asked to specify your Primary and Secondary positions. Teams may recruit you
                        based on their needs and your position preferences.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Match Scheduling Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Match Scheduling
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-5" className="border-assist-green-200 dark:border-assist-green-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-assist-green-600 dark:hover:text-assist-green-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      How are matches scheduled?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                      <p className="mb-3">Match scheduling in the SCS follows these general guidelines:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>The league administrators create the season schedule with matchups</li>
                        <li>Games are typically scheduled for 8:00,8:35,9:10PM EST Wednesday,Thursday, and Friday</li>
                        <li>Team managers coordinate with their players to ensure availability</li>
                        <li>Match results must be reported by team managers after completion</li>
                      </ul>
                      <p className="mt-3">
                        You can view the current schedule on the{" "}
                        <a href="/matches" className="text-assist-green-600 dark:text-assist-green-400 hover:text-assist-green-700 dark:hover:text-assist-green-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-assist-green-500 transition-all duration-200">
                          Matches page
                        </a>
                        .
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Team Management
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-6" className="border-goal-red-200 dark:border-goal-red-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-goal-red-600 dark:hover:text-goal-red-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                        <UserCheck className="h-4 w-4 text-white" />
                      </div>
                      How do team management roles work?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 p-4 rounded-lg border-l-4 border-goal-red-500">
                      <p className="mb-3">Why Manage in SCS?:</p>
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
                      <p className="mt-3">
                        These roles have different permissions on the website for managing team operations. Team management can
                        access additional features through the Team Management dashboard.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Statistics & Tracking Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Statistics & Tracking
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-7" className="border-rink-blue-200 dark:border-rink-blue-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-rink-blue-600 dark:hover:text-rink-blue-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      How are player statistics tracked?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                      <p className="mb-3">Player statistics are tracked through our system:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Team managers report game results and individual player statistics</li>
                        <li>Stats are verified by league administrators</li>
                        <li>Player profiles are updated with the latest statistics</li>
                        <li>Season and career statistics are maintained in our database</li>
                      </ul>
                      <p className="mt-3">
                        You can view player and team statistics on the{" "}
                        <a href="/stats" className="text-rink-blue-600 dark:text-rink-blue-400 hover:text-rink-blue-700 dark:hover:text-rink-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-rink-blue-500 transition-all duration-200">
                          Stats page
                        </a>
                        .
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Contact & Support Section */}
          <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Contact & Support
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-8" className="border-hockey-silver-200 dark:border-hockey-silver-700">
                  <AccordionTrigger className="text-left text-hockey-silver-800 dark:text-hockey-silver-200 hover:text-hockey-silver-600 dark:hover:text-hockey-silver-400 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                      How do I contact league administration?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-hockey-silver-700 dark:text-hockey-silver-300">
                    <div className="bg-gradient-to-r from-hockey-silver-50 to-hockey-silver-100 dark:from-hockey-silver-900/20 dark:to-hockey-silver-800/20 p-4 rounded-lg border-l-4 border-hockey-silver-500">
                      <p className="mb-3">You can contact league administration through several channels:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Send a direct message to an admin through the website messaging system</li>
                        <li>Join our Discord server and message an admin (link available in your profile)</li>
                      </ul>
                      <p className="mt-3">For urgent matters, Discord is usually the fastest way to reach an administrator.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Help Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Still Have Questions?
                </h3>
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                Can't find the answer you're looking for? Our league staff is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/contact" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white rounded-lg hover:from-ice-blue-600 hover:to-rink-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact Us
                </a>
                <a 
                  href="/rules" 
                  className="inline-flex items-center gap-2 px-6 py-3 border border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 rounded-lg hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200 font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  View Rules
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
