"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"

interface MainContentProps {
  children: React.ReactNode
}

export default function MainContent({ children }: MainContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarOpen(event.detail.isOpen)
    }

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener)
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener)
    }
  }, [])

  // Calculate dynamic margins based on sidebar state
  const getMarginLeft = () => {
    if (isMobile) return "0px" // Mobile doesn't need margin as sidebar is overlay
    return sidebarOpen ? "280px" : "80px"
  }

  return (
    <div 
      className="flex-1 flex flex-col main-content"
      style={{ 
        marginLeft: getMarginLeft()
      }}
    >
      <div className="flex-1 relative">
        <div className="min-h-full bg-background relative">
          {children}
        </div>
      </div>
    </div>
  )
}
