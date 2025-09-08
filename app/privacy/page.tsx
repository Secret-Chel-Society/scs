import { PageHeader } from "@/components/ui/page-header"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Privacy Policy" description="How we collect, use, and protect your personal information" />

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated:</strong> July 1, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p>
            Major Gaming Hockey League ("MGHL," "we," "us," or "our") is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
            website and use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Register for an account</li>
            <li>Join our Discord server</li>
            <li>Participate in league activities</li>
            <li>Contact us for support</li>
            <li>Subscribe to newsletters or updates</li>
          </ul>

          <p>This information may include:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and username</li>
            <li>Email address</li>
            <li>Gaming platform usernames (PlayStation, Xbox)</li>
            <li>Discord username and ID</li>
            <li>Profile pictures and avatars</li>
            <li>Game statistics and performance data</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>IP address and location data</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referral sources</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul className="list-disc pl-6 mb-4">
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

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information in
            the following circumstances:
          </p>

          <h3 className="text-xl font-semibold mb-3">4.1 With Your Consent</h3>
          <p>We may share your information when you have given us explicit consent to do so.</p>

          <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
          <p>We may share information with trusted third-party service providers who assist us in:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Website hosting and maintenance</li>
            <li>Database management</li>
            <li>Email communications</li>
            <li>Analytics and performance monitoring</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Legal Requirements</h3>
          <p>We may disclose your information if required by law or in response to valid legal requests.</p>

          <h3 className="text-xl font-semibold mb-3">4.4 Public Information</h3>
          <p>Certain information may be publicly displayed, including:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Usernames and team affiliations</li>
            <li>Game statistics and rankings</li>
            <li>Match results and highlights</li>
            <li>Public forum posts and comments</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over
            the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
            Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need
            your information, we will securely delete or anonymize it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul className="list-disc pl-6 mb-4">
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
          <p>
            To exercise these rights, please contact us at{" "}
            <a href="mailto:lispdoge@gmail.com" className="text-primary hover:underline">
              lispdoge@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our website. You can control
            cookie settings through your browser preferences, but disabling cookies may affect website functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices or
            content of these external sites. We encourage you to review the privacy policies of any third-party sites
            you visit.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
          <p>
            Our services are not intended for children under the age of 13. We do not knowingly collect personal
            information from children under 13. If we become aware that we have collected such information, we will take
            steps to delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure that such
            transfers comply with applicable data protection laws and implement appropriate safeguards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
            the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services
            after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us at:</p>
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
      </div>
    </div>
  )
}
