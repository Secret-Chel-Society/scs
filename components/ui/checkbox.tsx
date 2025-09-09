"use client"

import * as React from "react"
import { Checkbox as HeroUICheckbox } from "@heroui/react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof HeroUICheckbox>>(
  ({ className, ...props }, ref) => (
    <HeroUICheckbox ref={ref} className={cn(className)} {...props} />
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }