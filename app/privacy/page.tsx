import { PageHeader } from "@/components/ui/page-header"
import { 
  Shield, 
  Database, 
  Eye, 
  Share2, 
  Lock, 
  Clock, 
  UserCheck, 
  Cookie, 
  ExternalLink, 
  Users, 
  Globe, 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  Star, 
  Zap, 
  Heart, 
  Award,
  BookOpen,
  Settings,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Privacy Policy
            </h1>
            <p className="hockey-subtitle mb-8">
              How we collect, use, and protect your personal information
            </p>
            
            {/* Privacy Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  Data
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Protection
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Information
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Collection
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  Your
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Rights
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Security
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  & Safety
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

          {/* Introduction Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  1. Introduction
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                Secret Chel Society ("SCS," "we," "us," or "our") is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                website and use our services.
              </p>
            </div>
          </div>

          {/* Information Collection Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  2. Information We Collect
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-assist-green-800 dark:text-assist-green-200">2.1 Personal Information</h3>
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">We may collect personal information that you voluntarily provide to us when you:</p>
                  <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                    <ul className="list-disc pl-6 space-y-1 text-assist-green-700 dark:text-assist-green-300">
                      <li>Register for an account</li>
                      <li>Join our Discord server</li>
                      <li>Participate in league activities</li>
                      <li>Contact us for support</li>
                      <li>Subscribe to newsletters or updates</li>
                    </ul>
                  </div>
                  
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mt-3 mb-3">This information may include:</p>
                  <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                    <ul className="list-disc pl-6 space-y-1 text-assist-green-700 dark:text-assist-green-300">
                      <li>Name and username</li>
                      <li>Email address</li>
                      <li>Gaming platform usernames (PlayStation, Xbox)</li>
                      <li>Discord username and ID</li>
                      <li>Profile pictures and avatars</li>
                      <li>Game statistics and performance data</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-assist-green-800 dark:text-assist-green-200">2.2 Automatically Collected Information</h3>
                  <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-3">When you visit our website, we may automatically collect:</p>
                  <div className="bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 p-4 rounded-lg border-l-4 border-assist-green-500">
                    <ul className="list-disc pl-6 space-y-1 text-assist-green-700 dark:text-assist-green-300">
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Pages visited and time spent</li>
                      <li>Referral sources</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Usage Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  3. How We Use Your Information
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">We use the collected information for:</p>
              <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                <ul className="list-disc pl-6 space-y-1 text-rink-blue-700 dark:text-rink-blue-300">
                  <li>Providing and maintaining our services</li>
                  <li>Managing user accounts and authentication</li>
                  <li>Organizing and running league competitions</li>
                  <li>Tracking game statistics and leaderboards</li>
                  <li>Communicating with users about league activities</li>
                  <li>Sending newsletters and updates (with consent)</li>
                  <li>Improving our website and services</li>
                  <li>Preventing fraud and ensuring security</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Information Sharing Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  4. Information Sharing and Disclosure
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in
                the following circumstances:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-ice-blue-800 dark:text-ice-blue-200">4.1 With Your Consent</h3>
                  <p className="text-ice-blue-700 dark:text-ice-blue-300">We may share your information when you have given us explicit consent to do so.</p>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-ice-blue-800 dark:text-ice-blue-200">4.2 Service Providers</h3>
                  <p className="text-ice-blue-700 dark:text-ice-blue-300 mb-2">We may share information with trusted third-party service providers who assist us in:</p>
                  <ul className="list-disc pl-6 space-y-1 text-ice-blue-700 dark:text-ice-blue-300">
                    <li>Website hosting and maintenance</li>
                    <li>Database management</li>
                    <li>Email communications</li>
                    <li>Analytics and performance monitoring</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-ice-blue-800 dark:text-ice-blue-200">4.3 Legal Requirements</h3>
                  <p className="text-ice-blue-700 dark:text-ice-blue-300">We may disclose your information if required by law or in response to valid legal requests.</p>
                </div>
                
                <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-4 rounded-lg border-l-4 border-ice-blue-500">
                  <h3 className="text-lg font-semibold mb-2 text-ice-blue-800 dark:text-ice-blue-200">4.4 Public Information</h3>
                  <p className="text-ice-blue-700 dark:text-ice-blue-300 mb-2">Certain information may be publicly displayed, including:</p>
                  <ul className="list-disc pl-6 space-y-1 text-ice-blue-700 dark:text-ice-blue-300">
                    <li>Usernames and team affiliations</li>
                    <li>Game statistics and rankings</li>
                    <li>Match results and highlights</li>
                    <li>Public forum posts and comments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security Section */}
          <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  5. Data Security
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over
                the internet or electronic storage is 100% secure.
              </p>
            </div>
          </div>

          {/* Data Retention Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  6. Data Retention
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
                Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need
                your information, we will securely delete or anonymize it.
              </p>
            </div>
          </div>

          {/* Your Rights Section */}
          <div className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  7. Your Rights and Choices
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
              <div className="bg-gradient-to-r from-rink-blue-50 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-800/20 p-4 rounded-lg border-l-4 border-rink-blue-500">
                <ul className="space-y-2 text-rink-blue-700 dark:text-rink-blue-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Access:</strong> Request access to your personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Correction:</strong> Request correction of inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Deletion:</strong> Request deletion of your personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Portability:</strong> Request a copy of your information in a portable format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Objection:</strong> Object to certain processing of your information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-rink-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Restriction:</strong> Request restriction of processing</span>
                  </li>
                </ul>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:midnightstudiosintl@outlook.com" className="text-rink-blue-600 dark:text-rink-blue-400 hover:text-rink-blue-700 dark:hover:text-rink-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-rink-blue-500 transition-all duration-200">
                  midnightstudiosintl@outlook.com
                </a>
                .
              </p>
            </div>
          </div>

          {/* Additional Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cookies Section */}
            <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                    <Cookie className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    8. Cookies and Tracking
                  </h3>
                </div>
                <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                  We use cookies and similar tracking technologies to enhance your experience on our website. You can control
                  cookie settings through your browser preferences, but disabling cookies may affect website functionality.
                </p>
              </div>
            </div>

            {/* Third-Party Links Section */}
            <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    9. Third-Party Links
                  </h3>
                </div>
                <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or
                  content of these external sites. We encourage you to review the privacy policies of any third-party sites
                  you visit.
                </p>
              </div>
            </div>

            {/* Children's Privacy Section */}
            <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-goal-red-800 dark:text-goal-red-200">
                    10. Children's Privacy
                  </h3>
                </div>
                <p className="text-goal-red-700 dark:text-goal-red-300">
                  Our services are not intended for children under the age of 13. We do not knowingly collect personal
                  information from children under 13. If we become aware that we have collected such information, we will take
                  steps to delete it promptly.
                </p>
              </div>
            </div>

            {/* International Transfers Section */}
            <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-ice-blue-800 dark:text-ice-blue-200">
                    11. International Transfers
                  </h3>
                </div>
                <p className="text-ice-blue-700 dark:text-ice-blue-300">
                  Your information may be transferred to and processed in countries other than your own. We ensure that such
                  transfers comply with applicable data protection laws and implement appropriate safeguards.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Changes Section */}
          <div className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  12. Changes to This Privacy Policy
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services
                after such changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                  13. Contact Us
                </h2>
              </div>
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 mb-4">If you have any questions about this Privacy Policy or our privacy practices, please contact us at:</p>
              <div className="bg-gradient-to-r from-ice-blue-50 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-800/20 p-6 rounded-lg border border-ice-blue-200 dark:border-ice-blue-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-ice-blue-600" />
                    <p className="text-hockey-silver-700 dark:text-hockey-silver-300">
                      <strong>Email:</strong>{" "}
                      <a href="mailto:midnightstudiosintl@outlook.com" className="text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium underline decoration-2 underline-offset-2 hover:decoration-ice-blue-500 transition-all duration-200">
                        midnightstudiosintl@outlook.com
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

          {/* Footer Note */}
          <div className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-800/20">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                  Your Privacy Matters
                </h3>
              </div>
              <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-4">
                We're committed to protecting your personal information and ensuring transparency in how we handle your data.
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
                  href="/faq" 
                  className="inline-flex items-center gap-2 px-6 py-3 border border-ice-blue-200 dark:border-rink-blue-700 text-ice-blue-700 dark:text-ice-blue-300 rounded-lg hover:bg-ice-blue-50 dark:hover:bg-rink-blue-900/20 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-200 font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  View FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
