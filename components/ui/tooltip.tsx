"use client"

import * as React from "react"
import { Tooltip as HeroUITooltip } from "@heroui/react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children, ...props }: React.ComponentProps<typeof HeroUITooltip>) => (
  <HeroUITooltip {...props}>
    {children}
  </HeroUITooltip>
)

const TooltipTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
TooltipContent.displayName = "TooltipContent"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
}