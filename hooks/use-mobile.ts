"use client"

import { useState, useEffect } from "react"

// Export the original function name
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024) // Use lg breakpoint (1024px) to match navigation
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}

// Add the missing export that components are trying to import
export const useIsMobile = useMobile
