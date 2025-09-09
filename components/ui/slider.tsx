"use client"

import * as React from "react"
import { Slider as HeroUISlider } from "@heroui/react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUISlider>>(
  ({ className, ...props }, ref) => (
    <HeroUISlider ref={ref} className={cn(className)} {...props} />
  )
)
Slider.displayName = "Slider"

export { Slider }