"use client"

import { useMobileScaling } from "@/hooks/use-mobile-scaling"

interface MobileScalingProviderProps {
  children: React.ReactNode
}

export function MobileScalingProvider({ children }: MobileScalingProviderProps) {
  useMobileScaling()
  return <>{children}</>
}
