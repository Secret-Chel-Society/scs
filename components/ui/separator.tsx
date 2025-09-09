"use client"

import * as React from "react"
import { Divider } from "@heroui/react"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Divider>>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <Divider
      ref={ref}
      orientation={orientation}
      className={cn(className)}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }