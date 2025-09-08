import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
      {/* Hero Section */}
      <div className="clean-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="clean-title mb-6">About SCS</h1>
          <p className="clean-subtitle mb-8">Learn about the Secret Chel Society</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="clean-section-header mb-6">Our Mission</h2>
              <p className="text-lg mb-6 text-slate-600 dark:text-slate-300">
                The Secret Chel Society (SCS) is dedicated to creating a competitive, fair, and enjoyable
                environment for NHL gaming enthusiasts. We strive to build a community that values sportsmanship,
                teamwork, and skill development.
              </p>
              <p className="text-lg mb-8 text-slate-600 dark:text-slate-300">
                Founded in 2024, SCS has grown to become one of the premier NHL gaming leagues, with players from across
                North America and Europe competing at the highest level.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="clean-button">Join SCS Today</Button>
              </Link>
            </div>
            <div className="relative h-80 rounded-xl overflow-hidden clean-card">
              <Image src="/placeholder.svg?height=400&width=600" alt="SCS Players" fill className="object-cover" />
            </div>
          </div>

          <div className="mb-16">
            <h2 className="clean-section-header text-center mb-12">League Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="clean-feature-card">
                <div className="clean-icon-container mb-4">
                  <div className="text-2xl">🏆</div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Regular Season</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  28-game regular season with teams competing for playoff positions. Games are played on a weekly schedule
                  with divisions based on console type.
                </p>
              </div>
              <div className="clean-feature-card">
                <div className="clean-icon-container-emerald mb-4">
                  <div className="text-2xl">⚡</div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Playoffs</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Top 8 teams qualify for the playoffs, competing in best-of-5 and best-of-7 series to determine the SCS
                  champion.
                </p>
              </div>
              <div className="clean-feature-card">
                <div className="clean-icon-container-red mb-4">
                  <div className="text-2xl">🔄</div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Off-Season</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Features the entry draft, free agency period, and pre-season tournaments to prepare for the upcoming
                  season.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="clean-section-header mb-12">League Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
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
                <div key={index} className="text-center clean-feature-card">
                  <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 clean-card">
                    <Image src={staff.image || "/placeholder.svg"} alt={staff.name} fill className="object-cover" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{staff.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{staff.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="clean-card p-12 text-center">
            <h2 className="clean-section-header mb-6">Contact Us</h2>
            <p className="text-lg mb-8 text-slate-600 dark:text-slate-300">
              Have questions about the league or interested in joining? Reach out to us!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="outline" asChild className="clean-button-outline">
                <Link href="mailto:info@SCS.com">Email Us</Link>
              </Button>
              <Button asChild className="clean-button">
                <Link href="https://discord.gg/SCS">Join Our Discord</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
