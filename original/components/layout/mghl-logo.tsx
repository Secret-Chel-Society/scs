"use client"

import Link from "next/link"
import Image from "next/image"

interface MGHLLogoProps {
  onClick?: () => void
}

export function MGHLLogo({ onClick }: MGHLLogoProps) {
  // This component is no longer used - we're embedding the logo directly in the Header
  return (
    <Link href="/" onClick={onClick}>
      <div className="flex items-center">
        <Image
          src="https://scexchiemhvhtjarnrrx.supabase.co/storage/v1/object/public/media//MGHL.png"
          alt="MGHL Logo"
          width={120}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
    </Link>
  )
}
