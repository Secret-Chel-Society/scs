// Midnight Studios INTl - All rights reserved
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Users, 
  Gavel, 
  Trophy, 
  Calendar,
  DollarSign,
  Settings
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/management",
    icon: Home,
  },
  {
    name: "Lineups",
    href: "/management/lineups",
    icon: Users,
  },
  {
    name: "Waivers",
    href: "/management/waivers",
    icon: Gavel,
  },
  {
    name: "Bids",
    href: "/management/bids",
    icon: DollarSign,
  },
]

export function ManagementNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
