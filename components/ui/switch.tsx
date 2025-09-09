"use client"

import * as React from "react"
import { Switch as HeroUISwitch } from "@heroui/react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof HeroUISwitch>>(
  ({ className, ...props }, ref) => (
    <HeroUISwitch ref={ref} className={cn(className)} {...props} />
  )
)
Switch.displayName = "Switch"

export { Switch }