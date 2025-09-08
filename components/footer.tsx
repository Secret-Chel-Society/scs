"use client"

import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { 
  MessageSquare, 
  Users, 
  Trophy, 
  BarChart3, 
  Shield, 
  HelpCircle, 
  FileText, 
  Mail, 
  Settings, 
  User, 
  LogIn, 
  ExternalLink,
  Heart,
  Star,
  Zap,
  Target
} from "lucide-react"

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
    <footer className="relative bg-gradient-to-br from-hockey-silver-900 via-rink-blue-900 to-ice-blue-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10">
        {/* Top Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Secret Chel Society Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-white">Secret Chel Society</h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-ice-blue-400 to-rink-blue-500 rounded-full"></div>
                </div>
              </div>
              
              <p className="text-hockey-silver-300 leading-relaxed mb-6">
                The premier competitive NHL 26 league for elite console players across North America, powered by Midnight Studios.
              </p>
              
              <Link
                href="https://discord.gg/secretchelsociety"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-discord-500 to-discord-600 hover:from-discord-600 hover:to-discord-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group"
              >
                <img
                  src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png"
                  alt="Discord"
                  className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                <span className="font-medium">Join our Discord</span>
                <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>

            {/* Quick Links Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white">Quick Links</h3>
              </div>
              
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-ice-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/standings" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-ice-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Standings
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/statistics" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-ice-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Statistics
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/teams" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-ice-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Teams
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/matches" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-ice-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Matches
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white">Resources</h3>
              </div>
              
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/rules" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-rink-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Rules
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/faq" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-rink-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-rink-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/disclaimer" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-rink-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center gap-2 text-hockey-silver-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                  >
                    <div className="w-1 h-1 bg-rink-blue-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Enhanced User Panel Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white">User Panel</h3>
              </div>
              
              {user ? (
                <div className="space-y-4">
                  {/* User Info Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-blue-200 text-xs">Active Member</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Status</span>
                        <span className="text-green-400 font-medium">Online</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Member Since</span>
                        <span className="text-slate-300">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h4>
                    <ul className="space-y-2">
                      <li>
                        <Link 
                          href="/management" 
                          className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                        >
                          <div className="w-1 h-1 bg-emerald-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                          Management
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/admin" 
                          className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 hover:translate-x-1 group"
                        >
                          <div className="w-1 h-1 bg-red-400 rounded-full group-hover:bg-white transition-colors duration-200"></div>
                          Admin Panel
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
                    <User className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-300 text-sm mb-4">Join the community to access all features</p>
                    <div className="space-y-2">
                      <Link 
                        href="/login" 
                        className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-center py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        Sign In
                      </Link>
                      <Link 
                        href="/register" 
                        className="block w-full border border-white/30 hover:border-white/50 text-white text-center py-2 px-4 rounded-lg transition-all duration-200 hover:bg-white/10"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-hockey-silver-700/30 bg-gradient-to-r from-hockey-silver-900/50 to-rink-blue-900/50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-4">
              {/* Copyright Text */}
              <p className="text-hockey-silver-400 leading-relaxed">
                &copy; {currentYear} Secret Chel Society. All rights reserved.
                <br className="hidden sm:inline" />
                In official partnership with Midnight Studios.
                <br className="hidden sm:inline" />
                This site is an independent entity and is not affiliated with or endorsed by EA Sports.
              </p>
              
              {/* Additional Info */}
              <div className="flex items-center justify-center gap-6 text-sm text-hockey-silver-500">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-goal-red-400" />
                  <span>Made with passion for hockey</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-assist-green-400" />
                  <span>Elite gaming community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-ice-blue-400" />
                  <span>Powered by Midnight Studios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
