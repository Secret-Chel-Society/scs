import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Trophy, Calendar, Target, Award, Star, Heart, Shield } from "lucide-react"

function AboutStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">2024</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5" />
          Founded
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">15+</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">60</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" />
          Games/Season
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">24/7</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Support
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              About SCS
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Learn about the Secret Chel Society
            </p>
          </div>

          {/* About Statistics */}
          <AboutStats />

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12 animate-slide-up" style={{ animationDelay: "500ms" }}>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-white">Our Mission</h2>
                <p className="text-lg mb-4 text-white/80">
                  The Secret Chel Society (SCS) is dedicated to creating a competitive, fair, and enjoyable
                  environment for NHL gaming enthusiasts. We strive to build a community that values sportsmanship,
                  teamwork, and skill development.
                </p>
                <p className="text-lg mb-6 text-white/80">
                  Founded in 2024, SCS has grown to become one of the premier NHL gaming leagues, with players from across
                  North America and Europe competing at the highest level.
                </p>
                <Link href="/register/season">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 transition-all duration-300"
                  >
                    Join SCS Today
                  </Button>
                </Link>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden">
                <Image src="/placeholder.svg?height=400&width=600" alt="SCS Players" fill className="object-cover" />
              </div>
            </div>

            <div className="mb-12 animate-slide-up" style={{ animationDelay: "600ms" }}>
              <h2 className="text-3xl font-bold mb-6 text-center text-white">League Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="h-6 w-6 text-yellow-400" />
                      <h3 className="text-xl font-semibold text-white">Regular Season</h3>
                    </div>
                    <p className="text-white/80">
                      28-game regular season with teams competing for playoff positions. Games are played on a weekly schedule
                      with divisions based on console type.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">Playoffs</h3>
                    </div>
                    <p className="text-white/80">
                      Top 8 teams qualify for the playoffs, competing in best-of-5 and best-of-7 series to determine the SCS
                      champion.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">Off-Season</h3>
                    </div>
                    <p className="text-white/80">
                      Features the entry draft, free agency period, and pre-season tournaments to prepare for the upcoming
                      season.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mb-12 animate-slide-up" style={{ animationDelay: "700ms" }}>
              <h2 className="text-3xl font-bold mb-6 text-center text-white">League Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    name: "Zacharia Johnson",
                    role: "Web Tech",
                    image: "/placeholder.svg?height=200&width=200",
                  },
                  {
                    name: "John Smith",
                    role: "League Commissioner",
                    image: "/placeholder.svg?height=200&width=200",
                  },
                  {
                    name: "Sarah Johnson",
                    role: "Deputy Commissioner",
                    image: "/placeholder.svg?height=200&width=200",
                  },
                  {
                    name: "Mike Williams",
                    role: "Player Relations",
                    image: "/placeholder.svg?height=200&width=200",
                  },
                  {
                    name: "Emily Davis",
                    role: "Media Director",
                    image: "/placeholder.svg?height=200&width=200",
                  },
                ].map((staff, index) => (
                  <Card 
                    key={index} 
                    className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 animate-slide-in"
                    style={{ animationDelay: `${800 + index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden mb-4">
                        <Image src={staff.image || "/placeholder.svg"} alt={staff.name} fill className="object-cover" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{staff.name}</h3>
                      <p className="text-purple-300">{staff.role}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "900ms" }}>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 p-8 rounded-lg">
                <h2 className="text-3xl font-bold mb-6 text-center text-white">Contact Us</h2>
                <p className="text-center text-lg mb-6 text-white/80">
                  Have questions about the league or interested in joining? Reach out to us!
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    asChild
                    className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  >
                    <Link href="mailto:info@SCS.com">Email Us</Link>
                  </Button>
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 transition-all duration-300"
                  >
                    <Link href="https://discord.gg/SCS">Join Our Discord</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
