"use client"

import Link from "next/link"
import { Crown, Trophy, Users, Gamepad2, Shield, Star, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    league: [
      { name: "Teams", href: "/teams" },
      { name: "Standings", href: "/standings" },
      { name: "Stats", href: "/stats" },
      { name: "Matches", href: "/matches" },
      { name: "Awards", href: "/awards" },
    ],
    community: [
      { name: "Forum", href: "/forum" },
      { name: "News", href: "/news" },
      { name: "Free Agency", href: "/free-agency" },
      { name: "Season Registration", href: "/register/season" },
    ],
    resources: [
      { name: "Rules", href: "/rules" },
      { name: "FAQ", href: "/faq" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
    ],
  }

  const socialLinks = [
    {
      name: "Discord",
      href: "https://discord.gg/secretchelsociety",
      icon: "https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media/photos/general/Discord-removebg-preview.png",
      description: "Join our community"
    },
    {
      name: "Newsletter",
      href: "/news",
      icon: "📧",
      description: "Stay updated"
    },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10 border-t border-hockey-blue/20 mt-16">
      {/* Hockey-themed decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-hockey-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-hockey-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-hockey-gold/5 rounded-full blur-2xl" />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold hockey-gradient-text">Secret Chel Society</h3>
                <p className="text-sm text-muted-foreground">NHL 26 Championship League</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              The premier NHL 26 competitive gaming league featuring advanced statistics, 
              free token rewards, and professional league management.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-hockey-gold" />
                <span>Championship Quality</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-hockey-blue" />
                <span>Professional League</span>
              </div>
            </div>
          </div>

          {/* League Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-hockey-blue" />
              League
            </h4>
            <ul className="space-y-3">
              {footerLinks.league.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-hockey-blue transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-hockey-blue/50 rounded-full group-hover:bg-hockey-blue transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-hockey-purple" />
              Community
            </h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-hockey-purple transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-hockey-purple/50 rounded-full group-hover:bg-hockey-purple transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Social */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-hockey-gold" />
              Resources
            </h4>
            <ul className="space-y-3 mb-6">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-hockey-gold transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-hockey-gold/50 rounded-full group-hover:bg-hockey-gold transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-muted-foreground">Connect With Us</h5>
              <div className="space-y-2">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-hockey-blue/10 transition-colors group"
                  >
                    {social.icon.startsWith("http") ? (
                      <img
                        src={social.icon}
                        alt={social.name}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <span className="text-lg">{social.icon}</span>
                    )}
                    <div>
                      <p className="text-sm font-medium group-hover:text-hockey-blue transition-colors">
                        {social.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{social.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-hockey-blue/10 via-hockey-purple/10 to-hockey-blue/10 rounded-2xl p-8 mb-8 border border-hockey-blue/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold hockey-gradient-text">Ready to Join the League?</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Experience the most competitive NHL 26 gaming environment with professional-grade statistics tracking, 
              free token rewards, and authentic hockey league management.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="btn-championship">
                <Link href="/register/season">Register for Season 1</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="btn-ice">
                <Link href="/teams">View Teams</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-hockey-blue/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© {currentYear} Secret Chel Society. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">NHL 26 Championship League</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-hockey-green" />
                <span className="text-muted-foreground">Advanced Stats</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-hockey-gold" />
                <span className="text-muted-foreground">Free Rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-hockey-blue" />
                <span className="text-muted-foreground">Professional League</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
