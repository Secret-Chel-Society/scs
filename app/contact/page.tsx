import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Users, Phone, Clock, MapPin, Shield, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

function ContactStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">24h</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          Response Time
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">3</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Leadership Team
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">Discord</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Live Support
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">24/7</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Available
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Get in touch with the SCS team for support, questions, or feedback.
            </p>
          </div>

          {/* Contact Statistics */}
          <ContactStats />

          {/* Main Content */}
          <div className="grid gap-8 md:grid-cols-2 animate-slide-up" style={{ animationDelay: "500ms" }}>
            {/* Contact Information */}
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-blue-300" />
                  Contact Information
                </CardTitle>
                <CardDescription className="text-white/60">Reach out to us through any of these channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-white">General Inquiries</h3>
                  <p className="text-white/60 mb-2">For general questions, support, or feedback about the league.</p>
                  <p className="font-medium text-blue-300">
                    Email:{" "}
                    <a href="mailto:midnightstudiosintl@outlook.com" className="text-blue-300 hover:text-blue-200 hover:underline">
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
                      className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-2"
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
                  <Users className="h-5 w-5 text-blue-300" />
                  Leadership Team
                </CardTitle>
                <CardDescription className="text-white/60">Meet the team behind SCS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Site Tech */}
                <div className="flex items-start gap-4 animate-slide-in" style={{ animationDelay: "600ms" }}>
                  <img
                    src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/Untitled%20design%20(42).png"
                    alt="DarkWolf"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/30"
                  />
                  <div>
                    <h3 className="font-semibold text-white">DARKWOLF9235</h3>
                    <p className="text-sm text-blue-300 font-medium">Website Tech</p>
                    <p className="text-sm text-white/60 mt-1">
                      Oversees the technical development and overall vision of the SCS platform. Responsible for website
                      functionality, user experience, and strategic planning.
                    </p>
                  </div>
                </div>

                {/* League President */}
                <div className="flex items-start gap-4 animate-slide-in" style={{ animationDelay: "700ms" }}>
                  <img
                    src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/default-avatar-profile-icon-grey-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-no-photo-default-images-for-unfilled-user-profile-free-vector.jpg"
                    alt="Inked_Reaper91"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/30"
                  />
                  <div>
                    <h3 className="font-semibold text-white">Inked_Reaper91</h3>
                    <p className="text-sm text-blue-300 font-medium">League President</p>
                    <p className="text-sm text-white/60 mt-1">
                      Leads the competitive operations of SCS, including season planning, team management, and ensuring
                      fair play across all divisions.
                    </p>
                  </div>
                </div>

                {/* SCS Commissioner */}
                <div className="flex items-start gap-4 animate-slide-in" style={{ animationDelay: "800ms" }}>
                  <img
                    src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/FB_IMG_1755920678962.webp"
                    alt="OldManGotchu"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/30"
                  />
                  <div>
                    <h3 className="font-semibold text-white">OldManGotchu</h3>
                    <p className="text-sm text-blue-300 font-medium">SCS Commissioner</p>
                    <p className="text-sm text-white/60 mt-1">
                      Handles league governance, rule enforcement, disciplinary actions, and maintains the integrity of
                      competitive play within SCS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card className="mt-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 animate-slide-up" style={{ animationDelay: "900ms" }}>
            <CardHeader>
              <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-white/60">Before reaching out, you might find your answer in our FAQ section</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/60">
                Visit our{" "}
                <a href="/faq" className="text-blue-300 hover:text-blue-200 hover:underline">
                  FAQ page
                </a>{" "}
                for answers to common questions about registration, gameplay, rules, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
