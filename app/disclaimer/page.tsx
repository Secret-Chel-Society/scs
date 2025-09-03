import { PageHeader } from "@/components/ui/page-header"
import { 
  AlertTriangle, 
  Shield, 
  Gavel, 
  Users, 
  GamepadIcon, 
  FileText, 
  ExternalLink, 
  Target, 
  Settings, 
  Globe, 
  Clock, 
  MessageSquare, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Star, 
  Zap, 
  Heart, 
  Award,
  BookOpen,
  Info,
  Lock,
  Eye
} from "lucide-react"

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Legal Disclaimer
            </h1>
            <p className="hockey-subtitle mb-8">
              Important legal information and terms regarding the use of SCS services
            </p>
            
            {/* Disclaimer Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Legal
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Notice
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  User
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Protection
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Terms &
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Conditions
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Important
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Information
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Last Updated Notice */}
          <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                  <strong>Last Updated:</strong> July 1, 2025
                </p>
              </div>
            </div>
          </div>

          {/* General Disclaimer Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  1. General Disclaimer
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                The information contained on the Secret Chel Society (SCS) website is for general information
                purposes only. While we endeavor to keep the information up to date and correct, we make no representations
                or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability,
                or availability of the website or the information, products, services, or related graphics contained on the
                website for any purpose.
              </p>
            </div>
          </div>

          {/* EA Sports Non-Affiliation Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  2. EA Sports Non-Affiliation
                </h2>
              </div>
              <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500 mb-4">
                <p className="text-ice-blue-800 dark:text-ice-blue-200 font-semibold mb-3">
                  <strong>IMPORTANT:</strong> Secret Chel Society (SCS) is an independent gaming community and is NOT
                  affiliated with, endorsed by, or connected to EA Sports, Electronic Arts Inc., or the National Hockey League
                  (NHL).
                </p>
              </div>
              <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                <ul className="list-disc pl-6 space-y-1 text-ice-blue-700 dark:text-ice-blue-300">
                  <li>We are not an official EA Sports league or tournament</li>
                  <li>We do not represent EA Sports in any capacity</li>
                  <li>EA Sports has not sponsored, approved, or endorsed our activities</li>
                  <li>
                    All EA Sports and NHL trademarks, logos, and game content remain the property of their respective owners
                  </li>
                  <li>Our use of game statistics and data is for informational and competitive purposes only</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Limitation of Liability Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  3. Limitation of Liability
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">
                In no event will SCS, its administrators, moderators, or affiliates be liable for any loss or damage
                including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever
                arising from:
              </p>
              <div className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 p-4 rounded-lg border-l-4 border-goal-red-500">
                <ul className="list-disc pl-6 space-y-1 text-goal-red-700 dark:text-goal-red-300">
                  <li>Loss of data or profits arising out of or in connection with the use of this website</li>
                  <li>Technical issues, server downtime, or website unavailability</li>
                  <li>Disputes between players or teams</li>
                  <li>
                    Game-related issues, including but not limited to connection problems, game crashes, or EA Sports server
                    issues
                  </li>
                  <li>Any decisions made by league administrators or moderators</li>
                  <li>Third-party content or external links</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Responsibility Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  4. User Responsibility
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">By participating in SCS activities, users acknowledge and agree that:</p>
              <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                <ul className="list-disc pl-6 space-y-1 text-assist-green-700 dark:text-assist-green-300">
                  <li>They participate at their own risk and responsibility</li>
                  <li>They must comply with all applicable laws and regulations</li>
                  <li>They are responsible for their own gaming equipment and internet connection</li>
                  <li>They must follow SCS rules and code of conduct</li>
                  <li>They are responsible for maintaining the confidentiality of their account information</li>
                  <li>They must respect other players and maintain good sportsmanship</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Game-Related Disclaimers Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <GamepadIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  5. Game-Related Disclaimers
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-rink-blue-800 dark:text-rink-blue-200">5.1 Game Performance</h3>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300 mb-2">SCS cannot guarantee:</p>
                  <ul className="list-disc pl-6 space-y-1 text-rink-blue-700 dark:text-rink-blue-300">
                    <li>Stable game connections during matches</li>
                    <li>Absence of game bugs or glitches</li>
                    <li>EA Sports server availability</li>
                    <li>Consistent game performance across all platforms</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-rink-blue-800 dark:text-rink-blue-200">5.2 Statistics and Data</h3>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300 mb-2">While we strive for accuracy in recording game statistics and results:</p>
                  <ul className="list-disc pl-6 space-y-1 text-rink-blue-700 dark:text-rink-blue-300">
                    <li>Statistics are dependent on EA Sports API availability and accuracy</li>
                    <li>Data may be subject to delays or temporary unavailability</li>
                    <li>We reserve the right to correct statistical errors</li>
                    <li>Historical data may be subject to change due to corrections or updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Content Disclaimer Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  6. Content Disclaimer
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">
                The content on this website, including but not limited to text, graphics, images, and other material, is for
                informational purposes only. The material on this site is provided on an "as is" basis without any
                warranties of any kind.
              </p>
              
              <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                <h3 className="text-lg font-semibold mb-2 text-ice-blue-800 dark:text-ice-blue-200">6.1 User-Generated Content</h3>
                <p className="text-ice-blue-700 dark:text-ice-blue-300 mb-2">SCS is not responsible for:</p>
                <ul className="list-disc pl-6 space-y-1 text-ice-blue-700 dark:text-ice-blue-300">
                  <li>Content posted by users in forums, chat, or other interactive areas</li>
                  <li>Accuracy of user-submitted information</li>
                  <li>Offensive or inappropriate content posted by users</li>
                  <li>Copyright infringement by users</li>
                </ul>
              </div>
            </div>
          </div>

          {/* External Links Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  7. External Links Disclaimer
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                Our website may contain links to external websites that are not provided or maintained by SCS. We do not
                guarantee the accuracy, relevance, timeliness, or completeness of any information on these external
                websites. The inclusion of any links does not necessarily imply a recommendation or endorse the views
                expressed within them.
              </p>
            </div>
          </div>

          {/* Competitive Integrity Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  8. Competitive Integrity
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">While SCS strives to maintain fair and competitive gameplay:</p>
              <div className="bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 p-4 rounded-lg border-l-4 border-goal-red-500">
                <ul className="list-disc pl-6 space-y-1 text-goal-red-700 dark:text-goal-red-300">
                  <li>We cannot guarantee the absence of cheating or unsportsmanlike conduct</li>
                  <li>Disciplinary decisions are made at the discretion of league administrators</li>
                  <li>Appeals processes are available but decisions may be final</li>
                  <li>Rule interpretations and enforcement may evolve over time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Disclaimers Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  9. Technical Disclaimers
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-rink-blue-800 dark:text-rink-blue-200">9.1 Website Availability</h3>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300 mb-2">We do not warrant that:</p>
                  <ul className="list-disc pl-6 space-y-1 text-rink-blue-700 dark:text-rink-blue-300">
                    <li>The website will be constantly available or uninterrupted</li>
                    <li>The website will be free from errors, viruses, or other harmful components</li>
                    <li>Defects will be corrected immediately</li>
                    <li>The website will meet your specific requirements</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-rink-blue-800 dark:text-rink-blue-200">9.2 Data Security</h3>
                  <p className="text-rink-blue-700 dark:text-rink-blue-300 mb-2">While we implement security measures to protect user data:</p>
                  <ul className="list-disc pl-6 space-y-1 text-rink-blue-700 dark:text-rink-blue-300">
                    <li>No system is completely secure</li>
                    <li>Users are responsible for maintaining the security of their accounts</li>
                    <li>We cannot guarantee absolute protection against all security threats</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modification of Services Section */}
            <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-assist-green-800 dark:text-assist-green-200">
                    10. Modification of Services
                  </h3>
                </div>
                <p className="text-assist-green-700 dark:text-assist-green-300 mb-3">
                  SCS reserves the right to modify, suspend, or discontinue any aspect of our services at any time without
                  prior notice. This includes but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-assist-green-700 dark:text-assist-green-300">
                  <li>League formats and structures</li>
                  <li>Rules and regulations</li>
                  <li>Website features and functionality</li>
                  <li>Scoring systems and statistics tracking</li>
                </ul>
              </div>
            </div>

            {/* Governing Law Section */}
            <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-ice-blue-800 dark:text-ice-blue-200">
                    11. Governing Law
                  </h3>
                </div>
                <p className="text-ice-blue-700 dark:text-ice-blue-300">
                  This disclaimer and any disputes arising out of or related to it shall be governed by and construed in
                  accordance with applicable local laws. Any legal action or proceeding arising under this disclaimer will be
                  brought exclusively in the appropriate courts.
                </p>
              </div>
            </div>
          </div>

          {/* Changes to Disclaimer Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  12. Changes to This Disclaimer
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                We reserve the right to update or modify this disclaimer at any time without prior notice. Changes will be
                effective immediately upon posting to the website. Your continued use of our services after any such changes
                constitutes acceptance of the new disclaimer.
              </p>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  13. Contact Information
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">If you have any questions about this disclaimer or need clarification on any points, please contact us:</p>
              <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-6 rounded-lg border border-ice-blue-200 dark:border-ice-blue-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-ice-blue-600" />
                    <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                      <strong>Email:</strong>{" "}
                      <a href="mailto:lispdoge@gmail.com" className="text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-ice-blue-500 transition-all duration-200">
                        lispdoge@gmail.com
                      </a>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-ice-blue-600" />
                    <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                      <strong>Discord:</strong>{" "}
                      <a
                        href="https://discord.gg/scs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-ice-blue-500 transition-all duration-200"
                      >
                        SCS Discord Server
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgment Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  14. Acknowledgment
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                By using the SCS website and services, you acknowledge that you have read, understood, and agree to be
                bound by this disclaimer. If you do not agree with any part of this disclaimer, please discontinue use of
                our services immediately.
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Important Legal Notice
                </h3>
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                Please read this disclaimer carefully. By using our services, you agree to these terms and conditions.
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
