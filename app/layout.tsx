import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/lib/supabase/client"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Major Gaming Hockey League (MGHL)",
  description: "Official website for the NHL 25 Major Gaming Hockey League",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3668249624265877"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            <div className="flex min-h-screen overflow-hidden">
              <Navigation />
              {/* Main content area */}
              <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
                <div className="flex-1 flex flex-col">
                  <Suspense>
                    <main className="flex-1 p-6">
                      {children}
                    </main>
                  </Suspense>
                  <Footer />
                </div>
              </div>
            </div>
            <Toaster />
            <BannedUserModal />
            <Analytics />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
