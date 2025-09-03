import { PageHeader } from "@/components/ui/page-header"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <PageHeader title="Privacy Policy" description="How we collect, use, and protect your personal information" />

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-white/70 mb-8">
            <strong>Last Updated:</strong> July 1, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">1. Introduction</h2>
            <p className="text-white/80">
              Secret Chel Society ("SCS," "we," "us," or "our") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
              website and use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 text-white">2.1 Personal Information</h3>
            <p className="text-white/80">We may collect personal information that you voluntarily provide to us when you:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Register for an account</li>
              <li>Join our Discord server</li>
              <li>Participate in league activities</li>
              <li>Contact us for support</li>
              <li>Subscribe to newsletters or updates</li>
            </ul>

            <p className="text-white/80">This information may include:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Name and username</li>
              <li>Email address</li>
              <li>Gaming platform usernames (PlayStation, Xbox)</li>
              <li>Discord username and ID</li>
              <li>Profile pictures and avatars</li>
              <li>Game statistics and performance data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">2.2 Automatically Collected Information</h3>
            <p className="text-white/80">When you visit our website, we may automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent</li>
              <li>Referral sources</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">3. How We Use Your Information</h2>
            <p className="text-white/80">We use the collected information for:</p>
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

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">4. Information Sharing and Disclosure</h2>
            <p className="text-white/80">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in
              the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white">4.1 With Your Consent</h3>
            <p className="text-white/80">We may share your information when you have given us explicit consent to do so.</p>

            <h3 className="text-xl font-semibold mb-3 text-white">4.2 Service Providers</h3>
            <p className="text-white/80">We may share information with trusted third-party service providers who assist us in:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Website hosting and maintenance</li>
              <li>Database management</li>
              <li>Email communications</li>
              <li>Analytics and performance monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white">4.3 Legal Requirements</h3>
            <p className="text-white/80">We may disclose your information if required by law or in response to valid legal requests.</p>

            <h3 className="text-xl font-semibold mb-3 text-white">4.4 Public Information</h3>
            <p className="text-white/80">Certain information may be publicly displayed, including:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Usernames and team affiliations</li>
              <li>Game statistics and rankings</li>
              <li>Match results and highlights</li>
              <li>Team rosters and standings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">5. Data Security</h2>
            <p className="text-white/80">
              We implement appropriate security measures to protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic
              storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">6. Your Rights</h2>
            <p className="text-white/80">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">7. Contact Us</h2>
            <p className="text-white/80">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-white/80">
              Email: privacy@secretchelsociety.com<br />
              Discord: Join our server and message an administrator
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
