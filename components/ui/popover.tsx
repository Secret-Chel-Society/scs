"use client"

import * as React from "react"
import { Popover as HeroUIPopover, PopoverTrigger, PopoverContent } from "@heroui/react"
import { cn } from "@/lib/utils"

const Popover = ({ children, ...props }: React.ComponentProps<typeof HeroUIPopover>) => (
  <HeroUIPopover {...props}>
    {children}
  </HeroUIPopover>
)

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn(className)} {...props} />
  )
)
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
PopoverContent.displayName = "PopoverContent"

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
}