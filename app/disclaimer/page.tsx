import { PageHeader } from "@/components/ui/page-header"

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Disclaimer"
        description="Important legal information and terms regarding the use of MGHL services"
      />

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated:</strong> July 1, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. General Disclaimer</h2>
          <p>
            The information contained on the Major Gaming Hockey League (MGHL) website is for general information
            purposes only. While we endeavor to keep the information up to date and correct, we make no representations
            or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability,
            or availability of the website or the information, products, services, or related graphics contained on the
            website for any purpose.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. EA Sports Non-Affiliation</h2>
          <p>
            <strong>IMPORTANT:</strong> Major Gaming Hockey League (MGHL) is an independent gaming community and is NOT
            affiliated with, endorsed by, or connected to EA Sports, Electronic Arts Inc., or the National Hockey League
            (NHL).
          </p>
          <ul className="list-disc pl-6 mb-4">
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
          <h2 className="text-2xl font-bold mb-4">3. Limitation of Liability</h2>
          <p>
            In no event will MGHL, its administrators, moderators, or affiliates be liable for any loss or damage
            including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever
            arising from:
          </p>
          <ul className="list-disc pl-6 mb-4">
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
          <h2 className="text-2xl font-bold mb-4">4. User Responsibility</h2>
          <p>By participating in MGHL activities, users acknowledge and agree that:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>They participate at their own risk and responsibility</li>
            <li>They must comply with all applicable laws and regulations</li>
            <li>They are responsible for their own gaming equipment and internet connection</li>
            <li>They must follow MGHL rules and code of conduct</li>
            <li>They are responsible for maintaining the confidentiality of their account information</li>
            <li>They must respect other players and maintain good sportsmanship</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Game-Related Disclaimers</h2>

          <h3 className="text-xl font-semibold mb-3">5.1 Game Performance</h3>
          <p>MGHL cannot guarantee:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Stable game connections during matches</li>
            <li>Absence of game bugs or glitches</li>
            <li>EA Sports server availability</li>
            <li>Consistent game performance across all platforms</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.2 Statistics and Data</h3>
          <p>While we strive for accuracy in recording game statistics and results:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Statistics are dependent on EA Sports API availability and accuracy</li>
            <li>Data may be subject to delays or temporary unavailability</li>
            <li>We reserve the right to correct statistical errors</li>
            <li>Historical data may be subject to change due to corrections or updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Content Disclaimer</h2>
          <p>
            The content on this website, including but not limited to text, graphics, images, and other material, is for
            informational purposes only. The material on this site is provided on an "as is" basis without any
            warranties of any kind.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.1 User-Generated Content</h3>
          <p>MGHL is not responsible for:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Content posted by users in forums, chat, or other interactive areas</li>
            <li>Accuracy of user-submitted information</li>
            <li>Offensive or inappropriate content posted by users</li>
            <li>Copyright infringement by users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. External Links Disclaimer</h2>
          <p>
            Our website may contain links to external websites that are not provided or maintained by MGHL. We do not
            guarantee the accuracy, relevance, timeliness, or completeness of any information on these external
            websites. The inclusion of any links does not necessarily imply a recommendation or endorse the views
            expressed within them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Competitive Integrity</h2>
          <p>While MGHL strives to maintain fair and competitive gameplay:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>We cannot guarantee the absence of cheating or unsportsmanlike conduct</li>
            <li>Disciplinary decisions are made at the discretion of league administrators</li>
            <li>Appeals processes are available but decisions may be final</li>
            <li>Rule interpretations and enforcement may evolve over time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Technical Disclaimers</h2>

          <h3 className="text-xl font-semibold mb-3">9.1 Website Availability</h3>
          <p>We do not warrant that:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>The website will be constantly available or uninterrupted</li>
            <li>The website will be free from errors, viruses, or other harmful components</li>
            <li>Defects will be corrected immediately</li>
            <li>The website will meet your specific requirements</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">9.2 Data Security</h3>
          <p>While we implement security measures to protect user data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>No system is completely secure</li>
            <li>Users are responsible for maintaining the security of their accounts</li>
            <li>We cannot guarantee absolute protection against all security threats</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">10. Modification of Services</h2>
          <p>
            MGHL reserves the right to modify, suspend, or discontinue any aspect of our services at any time without
            prior notice. This includes but is not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>League formats and structures</li>
            <li>Rules and regulations</li>
            <li>Website features and functionality</li>
            <li>Scoring systems and statistics tracking</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
          <p>
            This disclaimer and any disputes arising out of or related to it shall be governed by and construed in
            accordance with applicable local laws. Any legal action or proceeding arising under this disclaimer will be
            brought exclusively in the appropriate courts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">12. Changes to This Disclaimer</h2>
          <p>
            We reserve the right to update or modify this disclaimer at any time without prior notice. Changes will be
            effective immediately upon posting to the website. Your continued use of our services after any such changes
            constitutes acceptance of the new disclaimer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
          <p>If you have any questions about this disclaimer or need clarification on any points, please contact us:</p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:lispdoge@gmail.com" className="text-primary hover:underline">
                lispdoge@gmail.com
              </a>
            </p>
            <p>
              <strong>Discord:</strong>{" "}
              <a
                href="https://discord.gg/mghl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MGHL Discord Server
              </a>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">14. Acknowledgment</h2>
          <p>
            By using the MGHL website and services, you acknowledge that you have read, understood, and agree to be
            bound by this disclaimer. If you do not agree with any part of this disclaimer, please discontinue use of
            our services immediately.
          </p>
        </section>
      </div>
    </div>
  )
}
