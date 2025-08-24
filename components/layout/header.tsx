'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import SidebarNavigation from "./sidebar-navigation"

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <>
      {/* Mobile header - only visible on mobile */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex items-center">
            <span className="font-semibold">MGHL</span>
          </div>
        </div>
      </header>

      <SidebarNavigation 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
      />
    </>
  )
}
