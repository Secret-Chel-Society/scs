"use client"

import * as React from "react"
import { Progress as HeroUIProgress } from "@heroui/react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof HeroUIProgress> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => (
    <HeroUIProgress
      ref={ref}
      value={value}
      maxValue={max}
      className={cn(className)}
      {...props}
    />
  )
)
Progress.displayName = "Progress"

export { Progress }