import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, Users, Calendar, FileText, Mail, MessageSquare } from "lucide-react"

function PrivacyStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">Secure</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Data Protection
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">24/7</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Lock className="h-5 w-5" />
          Privacy Control
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">GDPR</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Eye className="h-5 w-5" />
          Compliant
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">Your</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Rights Protected
        </div>
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              How we collect, use, and protect your personal information
            </p>
          </div>

          {/* Privacy Statistics */}
          <PrivacyStats />

          {/* Main Content */}
          <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="mb-8 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-blue-400" />
                      <p className="text-sm text-blue-300">
                        <strong>Last Updated:</strong> July 1, 2025
                      </p>
                    </div>
                  </div>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "600ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-6 w-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                    </div>
                    <p className="text-white/80">
                      Secret Chel Society ("SCS," "we," "us," or "our") is committed to protecting your privacy. This
                      Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                      website and use our services.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "700ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="h-6 w-6 text-green-400" />
                      <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">2.1 Personal Information</h3>
                    </div>
                    <p className="text-white/80 mb-4">We may collect personal information that you voluntarily provide to us when you:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Register for an account</li>
                      <li>Join our Discord server</li>
                      <li>Participate in league activities</li>
                      <li>Contact us for support</li>
                      <li>Subscribe to newsletters or updates</li>
                    </ul>

                    <p className="text-white/80 mb-4">This information may include:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Name and username</li>
                      <li>Email address</li>
                      <li>Gaming platform usernames (PlayStation, Xbox)</li>
                      <li>Discord username and ID</li>
                      <li>Profile pictures and avatars</li>
                      <li>Game statistics and performance data</li>
                    </ul>

                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-yellow-400" />
                      <h3 className="text-xl font-semibold text-white">2.2 Automatically Collected Information</h3>
                    </div>
                    <p className="text-white/80 mb-4">When you visit our website, we may automatically collect:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Pages visited and time spent</li>
                      <li>Referral sources</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "800ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="h-6 w-6 text-indigo-400" />
                      <h2 className="text-2xl font-bold text-white">3. How We Use Your Information</h2>
                    </div>
                    <p className="text-white/80 mb-4">We use the collected information for:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
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
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "900ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-orange-400" />
                      <h2 className="text-2xl font-bold text-white">4. Information Sharing and Disclosure</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      We do not sell, trade, or rent your personal information to third parties. We may share your information in
                      the following circumstances:
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">4.1 With Your Consent</h3>
                    </div>
                    <p className="text-white/80 mb-4">We may share your information when you have given us explicit consent to do so.</p>

                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">4.2 Service Providers</h3>
                    </div>
                    <p className="text-white/80 mb-4">We may share information with trusted third-party service providers who assist us in:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Website hosting and maintenance</li>
                      <li>Database management</li>
                      <li>Email communications</li>
                      <li>Analytics and performance monitoring</li>
                    </ul>

                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-6 w-6 text-red-400" />
                      <h3 className="text-xl font-semibold text-white">4.3 Legal Requirements</h3>
                    </div>
                    <p className="text-white/80 mb-4">We may disclose your information if required by law or in response to valid legal requests.</p>

                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">4.4 Public Information</h3>
                    </div>
                    <p className="text-white/80 mb-4">Certain information may be publicly displayed, including:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Usernames and team affiliations</li>
                      <li>Game statistics and rankings</li>
                      <li>Match results and highlights</li>
                      <li>Public forum posts and comments</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1000ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="h-6 w-6 text-green-400" />
                      <h2 className="text-2xl font-bold text-white">5. Data Security</h2>
                    </div>
                    <p className="text-white/80">
                      We implement appropriate technical and organizational security measures to protect your personal information
                      against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over
                      the internet or electronic storage is 100% secure.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1100ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-yellow-400" />
                      <h2 className="text-2xl font-bold text-white">6. Data Retention</h2>
                    </div>
                    <p className="text-white/80">
                      We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
                      Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need
                      your information, we will securely delete or anonymize it.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1200ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">7. Your Rights and Choices</h2>
                    </div>
                    <p className="text-white/80 mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>
                        <strong>Access:</strong> Request access to your personal information
                      </li>
                      <li>
                        <strong>Correction:</strong> Request correction of inaccurate information
                      </li>
                      <li>
                        <strong>Deletion:</strong> Request deletion of your personal information
                      </li>
                      <li>
                        <strong>Portability:</strong> Request a copy of your information in a portable format
                      </li>
                      <li>
                        <strong>Objection:</strong> Object to certain processing of your information
                      </li>
                      <li>
                        <strong>Restriction:</strong> Request restriction of processing
                      </li>
                    </ul>
                    <p className="text-white/80">
                      To exercise these rights, please contact us at{" "}
                      <a href="mailto:midnightstudiosintl@outlook.com" className="text-blue-300 hover:text-blue-200 hover:underline">
                        midnightstudiosintl@outlook.com
                      </a>
                      .
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1300ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="h-6 w-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">8. Cookies and Tracking Technologies</h2>
                    </div>
                    <p className="text-white/80">
                      We use cookies and similar tracking technologies to enhance your experience on our website. You can control
                      cookie settings through your browser preferences, but disabling cookies may affect website functionality.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1400ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-orange-400" />
                      <h2 className="text-2xl font-bold text-white">9. Third-Party Links</h2>
                    </div>
                    <p className="text-white/80">
                      Our website may contain links to third-party websites. We are not responsible for the privacy practices or
                      content of these external sites. We encourage you to review the privacy policies of any third-party sites
                      you visit.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1500ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-red-400" />
                      <h2 className="text-2xl font-bold text-white">10. Children's Privacy</h2>
                    </div>
                    <p className="text-white/80">
                      Our services are not intended for children under the age of 13. We do not knowingly collect personal
                      information from children under 13. If we become aware that we have collected such information, we will take
                      steps to delete it promptly.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1600ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-indigo-400" />
                      <h2 className="text-2xl font-bold text-white">11. International Data Transfers</h2>
                    </div>
                    <p className="text-white/80">
                      Your information may be transferred to and processed in countries other than your own. We ensure that such
                      transfers comply with applicable data protection laws and implement appropriate safeguards.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1700ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-6 w-6 text-green-400" />
                      <h2 className="text-2xl font-bold text-white">12. Changes to This Privacy Policy</h2>
                    </div>
                    <p className="text-white/80">
                      We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                      the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services
                      after such changes constitutes acceptance of the updated policy.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1800ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-6 w-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">13. Contact Us</h2>
                    </div>
                    <p className="text-white/80 mb-4">If you have any questions about this Privacy Policy or our privacy practices, please contact us at:</p>
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 p-4 rounded-lg mt-4">
                      <p className="text-white/80 mb-2">
                        <strong>Email:</strong>{" "}
                        <a href="mailto:midnightstudiosintl@outlook.com" className="text-blue-300 hover:text-blue-200 hover:underline">
                          midnightstudiosintl@outlook.com
                        </a>
                      </p>
                      <p className="text-white/80">
                        <strong>Discord:</strong>{" "}
                        <a
                          href="https://discord.gg/scs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 hover:underline"
                        >
                          SCS Discord Server
                        </a>
                      </p>
                    </div>
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
