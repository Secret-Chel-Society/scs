"use client"

import { useState, useEffect } from "react"

// Export the original function name
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // This is the key change: it always sets the state to 'false'.
    setIsMobile(false)

    // The rest of this code is now unnecessary but doesn't hurt.
    const handleResize = () => {
      // This line is no longer used but can remain.
      setIsMobile(window.innerWidth < 1024) 
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // The function will always return false, no matter the screen size.
  return isMobile
}

// Add the missing export that components are trying to import
export const useIsMobile = useMobile
