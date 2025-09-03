import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <PageHeader title="About SCS" description="Learn about the Secret Chel Society" />

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
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
              <Link href="/sign-up">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">Join SCS Today</Button>
              </Link>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden">
              <Image src="/placeholder.svg?height=400&width=600" alt="SCS Players" fill className="object-cover" />
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">League Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-white">Regular Season</h3>
                <p className="text-white/80">
                  28-game regular season with teams competing for playoff positions. Games are played on a weekly schedule
                  with divisions based on console type.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-white">Playoffs</h3>
                <p className="text-white/80">
                  Top 8 teams qualify for the playoffs, competing in best-of-5 and best-of-7 series to determine the SCS
                  champion.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-white">Off-Season</h3>
                <p className="text-white/80">
                  Features the entry draft, free agency period, and pre-season tournaments to prepare for the upcoming
                  season.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">League Management</h2>
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
                <div key={index} className="text-center">
                  <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden mb-4">
                    <Image src={staff.image || "/placeholder.svg"} alt={staff.name} fill className="object-cover" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{staff.name}</h3>
                  <p className="text-white/60">{staff.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Join the Community</h2>
            <p className="text-lg mb-6 text-white/80">
              Whether you're a seasoned NHL gamer or just starting out, SCS offers a welcoming environment for players
              of all skill levels. Join our Discord community to connect with other players, participate in discussions,
              and stay updated on league news and events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">Create Account</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations are handled by Tailwind classes */}
    </div>
  )
}
