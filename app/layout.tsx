// Midnight Studios INTl - All rights reserved
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MantineProviderWrapper } from "@/components/providers/mantine-provider"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/supabase/client"
// import { Analytics } from "@vercel/analytics/next" // Temporarily disabled
import { Suspense } from "react"
import { BannedUserModal } from "@/components/auth/banned-user-modal"
import { MobileScalingProvider } from "@/components/mobile-scaling-provider"
import "@/lib/download-tracker" // Initialize download tracking

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Secret Chel Society",
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
          src="https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} hockey-scrollbar`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <MantineProviderWrapper>
            <SupabaseProvider>
              <MobileScalingProvider>
              <div className="flex min-h-screen w-full">
                <Navigation />
                {/* Main content area */}
                <div className="flex-1 flex flex-col md:ml-72 mobile-content w-full">
                  <Suspense>
                    <main className="flex-1 p-6 hockey-scrollbar w-full">
                      {children}
                    </main>
                  </Suspense>
                  <Footer />
                </div>
              </div>
              <Toaster />
              <BannedUserModal />
              {/* <Analytics /> */}
              </MobileScalingProvider>
            </SupabaseProvider>
          </MantineProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
