import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Users } from "lucide-react"

export default function ContactPage() {
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
          title="Contact Us"
          description="Get in touch with the SCS team for support, questions, or feedback."
        />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Information */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-purple-300" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-white/60">Reach out to us through any of these channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-white">General Inquiries</h3>
                <p className="text-white/60 mb-2">For general questions, support, or feedback about the league.</p>
                <p className="font-medium text-purple-300">
                  Email:{" "}
                  <a href="mailto:midnightstudiosintl@outlook.com" className="text-purple-300 hover:text-purple-200 hover:underline">
                    midnightstudiosintl@outlook.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-white">Discord Community</h3>
                <p className="text-white/60 mb-2">
                  Join our Discord server for real-time chat, announcements, and community discussions.
                </p>
                <p className="font-medium">
                  <a
                    href="https://discord.gg/scs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 hover:text-purple-200 hover:underline flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Join SCS Discord
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-white">Response Time</h3>
                <p className="text-white/60">
                  We typically respond to emails within 24-48 hours. For urgent matters, please reach out on Discord for
                  faster assistance.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Team */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-purple-300" />
                Leadership Team
              </CardTitle>
              <CardDescription className="text-white/60">Meet the team behind SCS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Tech */}
              <div className="flex items-start gap-4">
                <img
                  src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/Untitled%20design%20(42).png"
                  alt="DarkWolf"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">DARKWOLF9235</h3>
                  <p className="text-sm text-purple-300 font-medium">Website Tech</p>
                  <p className="text-sm text-white/60 mt-1">
                    Oversees the technical development and overall vision of the SCS platform. Responsible for website
                    functionality, user experience, and strategic planning.
                  </p>
                </div>
              </div>

              {/* League President */}
              <div className="flex items-start gap-4">
                <img
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/default-avatar-profile-icon-grey-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-no-photo-default-images-for-unfilled-user-profile-free-vector.jpg"
                  alt="Inked_Reaper91"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">Inked_Reaper91</h3>
                  <p className="text-sm text-purple-300 font-medium">League President</p>
                  <p className="text-sm text-white/60 mt-1">
                    Manages league operations, player relations, and overall community development. Ensures fair play and
                    maintains the league's competitive integrity.
                  </p>
                </div>
              </div>

              {/* League Commissioner */}
              <div className="flex items-start gap-4">
                <img
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/default-avatar-profile-icon-grey-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-no-photo-default-images-for-unfilled-user-profile-free-vector.jpg"
                  alt="League Commissioner"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">League Commissioner</h3>
                  <p className="text-sm text-purple-300 font-medium">League Commissioner</p>
                  <p className="text-sm text-white/60 mt-1">
                    Oversees game scheduling, rule enforcement, and dispute resolution. Works to maintain competitive
                    balance and ensure all teams have fair opportunities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Getting Help</CardTitle>
              <CardDescription className="text-white/60">
                Here are some additional ways to get support and stay connected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2 text-white">Community Guidelines</h3>
                  <p className="text-white/60 mb-2">
                    Review our community guidelines and rules to ensure a positive experience for all members.
                  </p>
                  <a href="/rules" className="text-purple-300 hover:text-purple-200 hover:underline">
                    View Rules & Guidelines
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-white">FAQ Section</h3>
                  <p className="text-white/60 mb-2">
                    Check our frequently asked questions for quick answers to common questions.
                  </p>
                  <a href="/faq" className="text-purple-300 hover:text-purple-200 hover:underline">
                    Browse FAQ
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
