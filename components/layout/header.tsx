"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import SidebarNavigation from './sidebar-navigation'

export default function Header() {
  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <img src="/placeholder-logo.png" alt="MGHL" className="h-8 w-8" />
            <span className="font-bold text-xl">MGHL</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden lg:block">
        <SidebarNavigation />
      </div>
    </>
  )
}
