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
    <footer className="border-t bg-gradient-to-br from-muted/50 to-background relative overflow-hidden">
      <div className="absolute inset-0 hockey-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
      <div className="container mx-auto px-6 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-2xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Secret Chel Society
              </h3>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full mb-4" />
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The premier competitive NHL 26 league for elite console players across North America, powered by Midnight Studios.
              </p>
              <Link
                href="https://discord.gg/secretchelsociety"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20 rounded-lg text-primary hover:text-white hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg group"
              >
                <img
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                  alt="Discord"
                  className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
                />
                Join our Discord
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-xl mb-3 text-foreground">Quick Links</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full mb-4" />
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Home
                </Link>
              </li>
              <li>
                <Link href="/standings" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Standings
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Statistics
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Teams
                </Link>
              </li>
              <li>
                <Link href="/matches" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Matches
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-xl mb-3 text-foreground">Resources</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full mb-4" />
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/rules" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Rules
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-xl mb-3 text-foreground">Admin</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full mb-4" />
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/management" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Management Panel
                </Link>
              </li>
              {user && (
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                    → User Panel
                  </Link>
                </li>
              )}
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 block">
                  → Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-12 pt-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-0.5 w-20 bg-gradient-to-r from-transparent to-primary" />
            <div className="h-2 w-2 bg-primary rounded-full" />
            <div className="h-0.5 w-20 bg-gradient-to-r from-primary to-transparent" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
            &copy; {currentYear} <span className="font-semibold text-primary">Secret Chel Society</span>. All rights reserved.
            <br className="sm:hidden" /> In official partnership with <span className="font-semibold text-secondary">Midnight Studios</span>.
            <br />This site is an independent entity and is not affiliated with or endorsed by EA Sports.
          </p>
        </div>
      </div>
    </footer>
  )
}
