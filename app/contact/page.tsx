import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Users, Phone, Clock, MapPin, Shield, Trophy, Zap } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="hockey-title mb-6">
              Get in Touch
            </h1>
            <p className="hockey-subtitle mx-auto">
              Ready to join the SCS community? Have questions about the league? We're here to help you get started on your hockey journey.
            </p>
            
            {/* Quick Contact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="hockey-stat-item">
                <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">24-48 Hours</h3>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Response Time</p>
              </div>
              
              <div className="hockey-stat-item">
                <div className="w-12 h-12 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">24/7 Support</h3>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Discord Community</p>
              </div>
              
              <div className="hockey-stat-item">
                <div className="w-12 h-12 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Expert Team</h3>
                <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Professional Staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Information Card */}
          <Card className="hockey-card hockey-card-hover group">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <CardTitle className="flex items-center gap-3 text-2xl relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                Contact Information
              </CardTitle>
              <CardDescription className="text-lg relative z-10">
                Reach out to us through any of these channels for support, questions, or feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* General Inquiries */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-300">
                <h3 className="font-semibold text-lg mb-3 text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                  General Inquiries
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-3">
                  For general questions, support, or feedback about the league.
                </p>
                <a 
                  href="mailto:midnightstudiosintl@outlook.com" 
                  className="inline-flex items-center gap-2 text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium transition-colors duration-200 hover:scale-105"
                >
                  <span className="underline decoration-2 underline-offset-4 hover:decoration-ice-blue-400">midnightstudiosintl@outlook.com</span>
                  <Zap className="h-4 w-4" />
                </a>
              </div>

              {/* Discord Community */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border border-assist-green-200/50 dark:border-assist-green-700/50 hover:border-assist-green-300 dark:hover:border-assist-green-600 transition-all duration-300">
                <h3 className="font-semibold text-lg mb-3 text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                  Discord Community
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-3">
                  Join our Discord server for real-time chat, announcements, and community discussions.
                </p>
                <a
                  href="https://discord.gg/scs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-assist-green-600 dark:text-assist-green-400 hover:text-assist-green-700 dark:hover:text-assist-green-300 font-medium transition-all duration-200 hover:scale-105 group"
                >
                  <span className="underline decoration-2 underline-offset-4 group-hover:decoration-assist-green-400">Join SCS Discord</span>
                  <div className="w-6 h-6 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                </a>
              </div>

              {/* Response Time */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border border-goal-red-200/50 dark:border-goal-red-700/50 hover:border-goal-red-300 dark:hover:border-goal-red-600 transition-all duration-300">
                <h3 className="font-semibold text-lg mb-3 text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                  Response Time
                </h3>
                <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                  We typically respond to emails within 24-48 hours. For urgent matters, please reach out on Discord for faster assistance.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Team Card */}
          <Card className="hockey-card hockey-card-hover group">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800/30 dark:to-ice-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <CardTitle className="flex items-center gap-3 text-2xl relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-ice-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Leadership Team
              </CardTitle>
              <CardDescription className="text-lg relative z-10">
                Meet the dedicated team behind SCS - committed to delivering the best hockey experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Site Tech */}
              <div className="group/team p-4 rounded-xl bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:border-ice-blue-300 dark:hover:border-rink-blue-600 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/Untitled%20design%20(42).png"
                      alt="DarkWolf"
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-ice-blue-200 dark:ring-ice-blue-700 group-hover/team:ring-ice-blue-300 dark:group-hover/team:ring-ice-blue-600 transition-all duration-300"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full flex items-center justify-center">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200 group-hover/team:text-ice-blue-700 dark:group-hover/team:text-ice-blue-300 transition-colors duration-200">
                      DARKWOLF9235
                    </h3>
                    <div className="hockey-badge inline-block mb-2">Website Tech</div>
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-sm leading-relaxed">
                      Oversees the technical development and overall vision of the SCS platform. Responsible for website functionality, user experience, and strategic planning.
                    </p>
                  </div>
                </div>
              </div>

              {/* League President */}
              <div className="group/team p-4 rounded-xl bg-gradient-to-r from-assist-green-50 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-800/20 border border-assist-green-200/50 dark:border-assist-green-700/50 hover:border-assist-green-300 dark:hover:border-assist-green-600 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/default-avatar-profile-icon-grey-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-no-photo-default-images-for-unfilled-user-profile-free-vector.jpg"
                      alt="Inked_Reaper91"
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-assist-green-200 dark:ring-assist-green-700 group-hover/team:ring-assist-green-300 dark:group-hover/team:ring-assist-green-600 transition-all duration-300"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200 group-hover/team:text-assist-green-700 dark:group-hover/team:text-assist-green-300 transition-colors duration-200">
                      Inked_Reaper91
                    </h3>
                    <div className="hockey-badge inline-block mb-2 bg-gradient-to-r from-assist-green-100 to-assist-green-200 text-assist-green-800 border-assist-green-300 dark:from-assist-green-900/30 dark:to-assist-green-800/30 dark:text-assist-green-200 dark:border-assist-green-600">
                      League President
                    </div>
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-sm leading-relaxed">
                      Leads the competitive operations of SCS, including season planning, team management, and ensuring fair play across all divisions.
                    </p>
                  </div>
                </div>
              </div>

              {/* SCS Commissioner */}
              <div className="group/team p-4 rounded-xl bg-gradient-to-r from-goal-red-50 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-800/20 border border-goal-red-200/50 dark:border-goal-red-700/50 hover:border-goal-red-300 dark:hover:border-goal-red-600 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/FB_IMG_1755920678962.webp"
                      alt="OldManGotchu"
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-goal-red-200 dark:ring-goal-red-700 group-hover/team:ring-goal-red-300 dark:group-hover/team:ring-goal-red-600 transition-all duration-300"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-hockey-silver-800 dark:text-hockey-silver-200 group-hover/team:text-goal-red-700 dark:group-hover/team:text-goal-red-300 transition-colors duration-200">
                      OldManGotchu
                    </h3>
                    <div className="hockey-badge inline-block mb-2 bg-gradient-to-r from-goal-red-100 to-goal-red-200 text-goal-red-800 border-goal-red-300 dark:from-goal-red-900/30 dark:to-goal-red-800/30 dark:text-goal-red-200 dark:border-goal-red-600">
                      SCS Commissioner
                    </div>
                    <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-sm leading-relaxed">
                      Handles league governance, rule enforcement, disciplinary actions, and maintains the integrity of competitive play within SCS.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="hockey-card hockey-card-hover mt-12 group">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-hockey-silver-100 to-ice-blue-100 dark:from-hockey-silver-800/30 dark:to-ice-blue-900/30 rounded-full -mr-8 -mt-8 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <CardTitle className="text-2xl relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-hockey-silver-500 to-ice-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              Need More Information?
            </CardTitle>
            <CardDescription className="text-lg relative z-10">
              Before reaching out, you might find your answer in our comprehensive FAQ section
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="p-6 rounded-xl bg-gradient-to-r from-hockey-silver-50 to-ice-blue-50/30 dark:from-hockey-silver-800/30 dark:to-ice-blue-900/20 border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <p className="text-hockey-silver-700 dark:text-hockey-silver-300 text-lg mb-4">
                Visit our comprehensive FAQ page for answers to common questions about registration, gameplay, rules, and more.
              </p>
              <a 
                href="/faq" 
                className="inline-flex items-center gap-2 hockey-button group"
              >
                <span>Explore FAQ</span>
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MapPin className="h-3 w-3 text-white" />
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-ice-blue-500 via-rink-blue-600 to-ice-blue-700 text-white shadow-2xl shadow-ice-blue-500/25">
            <h2 className="text-3xl font-bold mb-4">Ready to Join SCS?</h2>
            <p className="text-ice-blue-100 text-lg mb-6">
              Don't wait to start your hockey journey. Get in touch today and become part of the most exciting competitive hockey community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:midnightstudiosintl@outlook.com"
                className="inline-flex items-center gap-2 bg-white text-ice-blue-700 hover:bg-ice-blue-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Mail className="h-5 w-5" />
                Send Email
              </a>
              <a 
                href="https://discord.gg/scs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-hockey-silver-800 hover:bg-hockey-silver-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <MessageSquare className="h-5 w-5" />
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
