"use client"

import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { 
  Users, 
  Trophy, 
  Gamepad2, 
  Star, 
  Shield, 
  Crown, 
  Target, 
  Award,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Heart
} from "lucide-react"

function FooterStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-2xl font-bold text-blue-200 mb-1">Elite</div>
        <div className="text-blue-300 flex items-center justify-center gap-1 text-sm">
          <Users className="h-4 w-4" />
          Players
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-2xl font-bold text-yellow-200 mb-1">Champions</div>
        <div className="text-yellow-300 flex items-center justify-center gap-1 text-sm">
          <Trophy className="h-4 w-4" />
          Crowned
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-2xl font-bold text-purple-200 mb-1">24/7</div>
        <div className="text-purple-300 flex items-center justify-center gap-1 text-sm">
          <Gamepad2 className="h-4 w-4" />
          Gaming
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-2xl font-bold text-green-200 mb-1">Premium</div>
        <div className="text-green-300 flex items-center justify-center gap-1 text-sm">
          <Star className="h-4 w-4" />
          Experience
        </div>
      </div>
    </div>
  )
}

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
    <footer className="relative border-t border-white/20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">
        {/* Footer Statistics */}
        <FooterStats />

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 animate-slide-up" style={{ animationDelay: "500ms" }}>
          {/* About Section */}
          <div className="animate-slide-in" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Secret Chel Society</h3>
            </div>
            <p className="text-blue-200 mb-4 leading-relaxed">
              The premier competitive NHL 26 league for elite console players across North America, powered by Midnight Studios.
            </p>
            <Link
              href="https://discord.gg/secretchelsociety"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 hover:underline transition-colors"
            >
              <img
                src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                alt="Discord"
                className="h-5 w-5"
              />
              Join our Discord
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Quick Links */}
          <div className="animate-slide-in" style={{ animationDelay: "700ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Quick Links</h3>
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/standings" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Standings
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/matches" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Matches
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="animate-slide-in" style={{ animationDelay: "800ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Resources</h3>
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/rules" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Rules
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:bg-white transition-colors"></div>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & User */}
          <div className="animate-slide-in" style={{ animationDelay: "900ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Admin & User</h3>
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/admin" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/management" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Management Panel
                </Link>
              </li>
              {user && (
                <>
                  <li>
                    <Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                      User Panel
                    </Link>
                  </li>
                  <li>
                    <Link href={`/players/${user.id}`} className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                      View Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                      Settings
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/login" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full group-hover:bg-white transition-colors"></div>
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "1000ms" }}>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Email</p>
              <p className="text-white font-medium">midnightstudiosintl@outlook.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-300">Discord</p>
              <p className="text-white font-medium">@secretchelsociety</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-300">Location</p>
              <p className="text-white font-medium">North America</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-8 text-center animate-slide-up" style={{ animationDelay: "1100ms" }}>
          <p className="text-blue-200 mb-2">
            &copy; {currentYear} Secret Chel Society. All rights reserved.
            <br />
            In official partnership with Midnight Studios.
          </p>
          <p className="text-blue-300 text-sm">
            This site is an independent entity and is not affiliated with or endorsed by EA Sports.
          </p>
          <div className="flex items-center justify-center gap-1 mt-4 text-blue-300">
            <span className="text-sm">Made with</span>
            <Heart className="h-4 w-4 text-red-400 animate-pulse" />
            <span className="text-sm">for the SCS community</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
