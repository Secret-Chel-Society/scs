import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Users } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Contact Us"
        description="Get in touch with the MGHL team for support, questions, or feedback."
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Reach out to us through any of these channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">General Inquiries</h3>
              <p className="text-muted-foreground">For general questions, support, or feedback about the league.</p>
              <p className="font-medium">
                Email:{" "}
                <a href="mailto:lispdoge@gmail.com" className="text-primary hover:underline">
                  lispdoge@gmail.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Discord Community</h3>
              <p className="text-muted-foreground">
                Join our Discord server for real-time chat, announcements, and community discussions.
              </p>
              <p className="font-medium">
                <a
                  href="https://discord.gg/mghl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Join MGHL Discord
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-muted-foreground">
                We typically respond to emails within 24-48 hours. For urgent matters, please reach out on Discord for
                faster assistance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leadership Team
            </CardTitle>
            <CardDescription>Meet the team behind MGHL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Site CEO */}
            <div className="flex items-start gap-4">
              <img
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/Screenshot%202025-07-01%20180349.png"
                alt="LispDoge"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">LispDoge</h3>
                <p className="text-sm text-primary font-medium">Site CEO</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Oversees the technical development and overall vision of the MGHL platform. Responsible for website
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
                <h3 className="font-semibold">Inked_Reaper91</h3>
                <p className="text-sm text-primary font-medium">League President</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Leads the competitive operations of MGHL, including season planning, team management, and ensuring
                  fair play across all divisions.
                </p>
              </div>
            </div>

            {/* MGHL Commissioner */}
            <div className="flex items-start gap-4">
              <img
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/default-avatar-profile-icon-grey-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-no-photo-default-images-for-unfilled-user-profile-free-vector.jpg"
                alt="OldManGotchu"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">OldManGotchu</h3>
                <p className="text-sm text-primary font-medium">MGHL Commissioner</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Handles league governance, rule enforcement, disciplinary actions, and maintains the integrity of
                  competitive play within MGHL.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Before reaching out, you might find your answer in our FAQ section</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Visit our{" "}
            <a href="/faq" className="text-primary hover:underline">
              FAQ page
            </a>{" "}
            for answers to common questions about registration, gameplay, rules, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
