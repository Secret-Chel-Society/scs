import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Shield, Users, Calendar, FileText, Mail, MessageSquare, Info } from "lucide-react"

function DisclaimerStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-red-200 mb-2">Important</div>
        <div className="text-red-300 flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Legal Notice
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">Read</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <FileText className="h-5 w-5" />
          Carefully
        </div>
      </div>
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-orange-200 mb-2">Terms</div>
        <div className="text-orange-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          & Conditions
        </div>
      </div>
      <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-pink-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-pink-200 mb-2">Your</div>
        <div className="text-pink-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Responsibility
        </div>
      </div>
    </div>
  )
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-200 to-orange-200 bg-clip-text text-transparent">
              Legal Disclaimer
            </h1>
            <p className="text-xl text-red-200 mb-8">
              Important information about our services and your responsibilities
            </p>
          </div>

          {/* Disclaimer Statistics */}
          <DisclaimerStats />

          {/* Main Content */}
          <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="mb-8 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-red-400" />
                      <p className="text-sm text-red-300">
                        <strong>Last Updated:</strong> July 1, 2025
                      </p>
                    </div>
                  </div>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "600ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <h2 className="text-2xl font-bold text-white">1. General Disclaimer</h2>
                    </div>
                    <p className="text-white/80">
                      The information provided on the Secret Chel Society (SCS) website and through our services is for general
                      informational purposes only. While we strive to keep the information up to date and correct, we make no
                      representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability,
                      suitability, or availability of the information, products, services, or related graphics contained on the
                      website for any purpose.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "700ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-orange-400" />
                      <h2 className="text-2xl font-bold text-white">2. Gaming and Entertainment</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      SCS is a gaming community focused on NHL video game competitions. Please note:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Our services are for entertainment purposes only</li>
                      <li>We are not affiliated with the NHL, EA Sports, or any professional sports organization</li>
                      <li>Game outcomes and statistics are for recreational purposes</li>
                      <li>No real money gambling or betting is involved in our competitions</li>
                      <li>All prizes and rewards are virtual or community-based</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "800ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-yellow-400" />
                      <h2 className="text-2xl font-bold text-white">3. User Conduct and Responsibility</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      By participating in SCS activities, you acknowledge and agree to:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Maintain appropriate and respectful behavior at all times</li>
                      <li>Follow our community guidelines and code of conduct</li>
                      <li>Not engage in cheating, hacking, or exploiting game mechanics</li>
                      <li>Respect other players and community members</li>
                      <li>Report any violations or suspicious activity to moderators</li>
                      <li>Take responsibility for your own actions and communications</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "900ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Info className="h-6 w-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">4. Technical Disclaimers</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      We provide the following technical disclaimers:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Website availability and performance may vary</li>
                      <li>Game servers and connectivity are beyond our control</li>
                      <li>Data loss or corruption may occur despite our best efforts</li>
                      <li>Third-party services (Discord, gaming platforms) have their own terms of service</li>
                      <li>We are not responsible for technical issues with your gaming equipment or internet connection</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1000ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-6 w-6 text-green-400" />
                      <h2 className="text-2xl font-bold text-white">5. Intellectual Property</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      Intellectual property considerations:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>NHL and EA Sports trademarks and copyrights are owned by their respective companies</li>
                      <li>SCS branding and website content are our intellectual property</li>
                      <li>User-generated content remains the property of the creator</li>
                      <li>We reserve the right to use community content for promotional purposes</li>
                      <li>Unauthorized use of our branding or content is prohibited</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1100ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-6 w-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">6. Privacy and Data</h2>
                    </div>
                    <p className="text-white/80">
                      While we take privacy seriously, please understand that:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Online gaming inherently involves some data sharing</li>
                      <li>Gaming platforms may collect additional data beyond our control</li>
                      <li>Public gameplay and statistics may be visible to other users</li>
                      <li>We cannot guarantee complete anonymity in competitive environments</li>
                      <li>Please review our Privacy Policy for detailed information</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1200ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <h2 className="text-2xl font-bold text-white">7. Limitation of Liability</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      To the fullest extent permitted by applicable law, SCS and its administrators shall not be liable for:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Any direct, indirect, incidental, special, or consequential damages</li>
                      <li>Loss of profits, data, or business opportunities</li>
                      <li>Emotional distress or mental anguish</li>
                      <li>Damages resulting from third-party actions or services</li>
                      <li>Technical failures or service interruptions</li>
                      <li>Disputes between community members</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1300ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-6 w-6 text-indigo-400" />
                      <h2 className="text-2xl font-bold text-white">8. Community Guidelines</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      Our community is built on mutual respect and fair play. We expect all members to:
                    </p>
                    <ul className="list-disc pl-6 mb-4 text-white/80">
                      <li>Treat others with respect and dignity</li>
                      <li>Maintain sportsmanlike conduct during competitions</li>
                      <li>Follow Discord and gaming platform terms of service</li>
                      <li>Report violations to moderators promptly</li>
                      <li>Accept decisions made by league administrators</li>
                      <li>Contribute positively to the community atmosphere</li>
                    </ul>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1400ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-cyan-400" />
                      <h2 className="text-2xl font-bold text-white">9. Changes and Updates</h2>
                    </div>
                    <p className="text-white/80">
                      We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon
                      posting. Your continued use of our services constitutes acceptance of any modifications. We encourage you
                      to review this disclaimer periodically.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1500ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Info className="h-6 w-6 text-emerald-400" />
                      <h2 className="text-2xl font-bold text-white">10. Governing Law</h2>
                    </div>
                    <p className="text-white/80">
                      This disclaimer is governed by and construed in accordance with the laws of the jurisdiction where SCS
                      operates. Any disputes arising from this disclaimer or your use of our services shall be resolved through
                      appropriate legal channels.
                    </p>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1600ms" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-6 w-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">11. Contact Information</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      If you have questions about this disclaimer or need clarification on any terms, please contact us:
                    </p>
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 p-4 rounded-lg mt-4">
                      <p className="text-white/80 mb-2">
                        <strong>Email:</strong>{" "}
                        <a href="mailto:midnightstudiosintl@outlook.com" className="text-red-300 hover:text-red-200 hover:underline">
                          midnightstudiosintl@outlook.com
                        </a>
                      </p>
                      <p className="text-white/80">
                        <strong>Discord:</strong>{" "}
                        <a
                          href="https://discord.gg/scs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-300 hover:text-red-200 hover:underline"
                        >
                          SCS Discord Server
                        </a>
                      </p>
                    </div>
                  </section>

                  <section className="mb-8 animate-slide-in" style={{ animationDelay: "1700ms" }}>
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 p-6 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="h-8 w-8 text-yellow-400" />
                        <h3 className="text-xl font-bold text-yellow-200">Important Notice</h3>
                      </div>
                      <p className="text-yellow-300">
                        By using our services, you acknowledge that you have read, understood, and agree to be bound by this
                        disclaimer. If you do not agree with any part of this disclaimer, please do not use our services.
                        Participation in SCS activities indicates your acceptance of these terms.
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
