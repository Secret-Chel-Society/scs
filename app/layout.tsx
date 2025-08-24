import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { SupabaseProvider } from "@/lib/supabase/client"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MGHL - Minor Guild Hockey League",
  description: "The official website for the Minor Guild Hockey League",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <div className="min-h-screen lg:flex">
              {/* Header with mobile menu and sidebar */}
              <Header />

              {/* Main Content - flex-1 to take remaining space */}
              <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
