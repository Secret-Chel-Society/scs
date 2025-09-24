import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="About MGHL" description="Learn about the Major Gaming Hockey League" />

      <div className="mt-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg mb-4">
              The Major Gaming Hockey League (MGHL) is dedicated to creating a competitive, fair, and enjoyable
              environment for NHL gaming enthusiasts. We strive to build a community that values sportsmanship,
              teamwork, and skill development.
            </p>
            <p className="text-lg mb-6">
              Founded in 2020, MGHL has grown to become one of the premier NHL gaming leagues, with players from across
              North America and Europe competing at the highest level.
            </p>
            <Link href="/sign-up">
              <Button size="lg">Join MGHL Today</Button>
            </Link>
          </div>
          <div className="relative h-80 rounded-lg overflow-hidden">
            <Image src="/placeholder.svg?height=400&width=600" alt="MGHL Players" fill className="object-cover" />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">League Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Regular Season</h3>
              <p>
                28-game regular season with teams competing for playoff positions. Games are played on a weekly schedule
                with divisions based on console type.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Playoffs</h3>
              <p>
                Top 8 teams qualify for the playoffs, competing in best-of-5 and best-of-7 series to determine the MGHL
                champion.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Off-Season</h3>
              <p>
                Features the entry draft, free agency period, and pre-season tournaments to prepare for the upcoming
                season.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">League Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
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
                <h3 className="text-xl font-semibold">{staff.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{staff.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-6 text-center">Contact Us</h2>
          <p className="text-center text-lg mb-6">
            Have questions about the league or interested in joining? Reach out to us!
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="mailto:info@mghl.com">Email Us</Link>
            </Button>
            <Button asChild>
              <Link href="https://discord.gg/mghl">Join Our Discord</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
