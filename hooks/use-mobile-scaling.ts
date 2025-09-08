"use client"

import { useEffect } from 'react'
import { initializeMobileScaling } from '@/lib/mobile-scaling'

/**
 * Hook to initialize mobile scaling
 * This should be used in the root layout or main app component
 */
export function useMobileScaling() {
  useEffect(() => {
    initializeMobileScaling()
  }, [])
}
