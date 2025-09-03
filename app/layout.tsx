import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/supabase/client"
// import { Analytics } from "@vercel/analytics/next" // Temporarily disabled
import { Suspense } from "react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Secret Chel Society - NHL 26 Championship League",
  description: "The premier NHL 26 competitive gaming league with advanced stat tracking, free token rewards, and professional league management",
  viewport: "width=device-width, initial-scale=1",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  keywords: "NHL 26, hockey, gaming, league, competitive, Secret Chel Society, SCS, esports",
  authors: [{ name: "Secret Chel Society" }],
  openGraph: {
    title: "Secret Chel Society - NHL 26 Championship League",
    description: "The premier NHL 26 competitive gaming league with advanced stat tracking, free token rewards, and professional league management",
    type: "website",
    locale: "en_US",
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
          src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            <div className="flex min-h-screen w-full overflow-x-hidden">
              <Navigation />
              {/* Main content area - responsive to sidebar state */}
              <div className="flex-1 flex flex-col lg:ml-80 w-full min-w-0 transition-all duration-300">
                <Suspense>
                  <main className="flex-1 p-4 lg:p-8">
                    {children}
                  </main>
                </Suspense>
                <Footer />
              </div>
            </div>
            <Toaster />
            <BannedUserModal />
            {/* <Analytics /> */}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
