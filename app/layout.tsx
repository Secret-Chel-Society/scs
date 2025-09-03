import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import MainContent from "@/components/layout/main-content"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/supabase/client"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Secret Chel Society (SCS)",
  description: "Official website for the NHL 26 Secret Chel Society",
  viewport: "width=device-width, initial-scale=1",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
      <body className={`${inter.className} sidebar-layout`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            <div className="flex min-h-screen">
              {/* Enhanced Professional Championship Sidebar */}
              <Sidebar />
              
              {/* Main Content Area with Dynamic Sidebar Layout */}
              <MainContent>
                <Suspense>
                  {children}
                </Suspense>
                <Footer />
              </MainContent>
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
