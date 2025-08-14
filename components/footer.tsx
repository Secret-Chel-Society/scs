"use client"

import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"

export default function Footer() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Major Gaming Hockey League</h3>
            <p className="text-muted-foreground mb-4">
              The premier competitive NHL 25 league for elite console players across North America.
            </p>
            <Link
              href="https://discord.gg/mghl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <img
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                alt="Discord"
                className="h-5 w-5"
              />
              Join our Discord
            </Link>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/standings" className="text-muted-foreground hover:text-foreground">
                  Standings
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="text-muted-foreground hover:text-foreground">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-muted-foreground hover:text-foreground">
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/matches" className="text-muted-foreground hover:text-foreground">
                  Matches
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/rules" className="text-muted-foreground hover:text-foreground">
                  Rules
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-muted-foreground hover:text-foreground">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Admin</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/management" className="text-muted-foreground hover:text-foreground">
                  Management Panel
                </Link>
              </li>
              {user && (
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    User Panel
                  </Link>
                </li>
              )}
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>
            &copy; {currentYear} Major Gaming Hockey League. All rights reserved. This site is an independent entity and
            is not affiliated with or endorsed by EA Sports.
          </p>
        </div>
      </div>
    </footer>
  )
}
