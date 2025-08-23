import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// Changed the import to the new side navigation component
import SideNavigation from "@/components/side-navigation" 
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/supabase/client"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"

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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3668249624265877"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            {/* The main wrapper for the sidebar layout */}
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
              <SideNavigation />
              <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-64"> {/* Adjust md:pl-64 to your sidebar width */}
                <Suspense>
                  {/* The main content area now includes the children and the footer */}
                  <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                  </main>
                </Suspense>
                <Footer />
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
