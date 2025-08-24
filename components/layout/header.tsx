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
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="container flex h-14 items-center justify-between">
