import { PageHeader } from "@/components/ui/page-header"

export default function DisclaimerPage() {
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
          title="Disclaimer"
          description="Important legal information and terms regarding the use of SCS services"
        />

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-white/70 mb-8">
            <strong>Last Updated:</strong> July 1, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">1. General Disclaimer</h2>
            <p className="text-white/80">
              The information contained on the Secret Chel Society (SCS) website is for general information
              purposes only. While we endeavor to keep the information up to date and correct, we make no representations
              or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability,
              or availability of the website or the information, products, services, or related graphics contained on the
              website for any purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">2. EA Sports Non-Affiliation</h2>
            <p className="text-white/80">
              <strong>IMPORTANT:</strong> Secret Chel Society (SCS) is an independent gaming community and is NOT
              affiliated with, endorsed by, or connected to EA Sports, Electronic Arts Inc., or the National Hockey League
              (NHL).
            </p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>We are not an official EA Sports league or tournament</li>
              <li>We do not represent EA Sports in any capacity</li>
              <li>EA Sports has not sponsored, approved, or endorsed our activities</li>
              <li>
                All EA Sports and NHL trademarks, logos, and game content remain the property of their respective owners
              </li>
              <li>Our use of game statistics and data is for informational and competitive purposes only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">3. Limitation of Liability</h2>
            <p className="text-white/80">
              In no event will SCS, its administrators, moderators, or affiliates be liable for any loss or damage
              including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever
              arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
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
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">4. User Responsibility</h2>
            <p className="text-white/80">By participating in SCS activities, users acknowledge and agree that:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>They participate at their own risk and responsibility</li>
              <li>They must comply with all applicable laws and regulations</li>
              <li>They are responsible for their own gaming equipment and internet connection</li>
              <li>They must follow SCS rules and code of conduct</li>
              <li>They are responsible for maintaining the confidentiality of their account information</li>
              <li>They must respect other players and maintain good sportsmanship</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">5. Game-Related Disclaimers</h2>

            <h3 className="text-xl font-semibold mb-3 text-white">5.1 Game Performance</h3>
            <p className="text-white/80">SCS cannot guarantee:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Stable game connections during matches</li>
              <li>Absence of game bugs or glitches</li>
              <li>EA Sports server availability</li>
              <li>Consistent game performance across all platforms</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">5.2 Statistics and Data</h3>
            <p className="text-white/80">While we strive for accuracy in recording game statistics and results:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Statistics are dependent on EA Sports API availability and accuracy</li>
              <li>Data may be subject to delays or temporary unavailability</li>
              <li>We reserve the right to correct statistical errors</li>
              <li>Historical data may be subject to change due to corrections or updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">6. Third-Party Services</h2>
            <p className="text-white/80">
              SCS may use third-party services for various functions including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Discord for communication and community management</li>
              <li>Supabase for database and authentication services</li>
              <li>Vercel for website hosting and deployment</li>
              <li>Various analytics and monitoring tools</li>
            </ul>
            <p className="text-white/80">
              We are not responsible for the privacy practices, security, or availability of these third-party services.
              Users should review the terms of service and privacy policies of these services independently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">7. Changes to Disclaimer</h2>
            <p className="text-white/80">
              SCS reserves the right to modify this disclaimer at any time. Changes will be effective immediately upon
              posting on the website. Continued use of SCS services after changes constitutes acceptance of the modified
              disclaimer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">8. Contact Information</h2>
            <p className="text-white/80">
              If you have questions about this disclaimer or need clarification on any terms, please contact us through
              our Discord server or website contact form.
            </p>
          </section>
        </div>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
    </div>
  )
}
