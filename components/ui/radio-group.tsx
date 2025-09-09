"use client"

import * as React from "react"
import { RadioGroup as HeroUIRadioGroup, Radio } from "@heroui/react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIRadioGroup>>(
  ({ className, ...props }, ref) => (
    <HeroUIRadioGroup ref={ref} className={cn(className)} {...props} />
  )
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Radio>>(
  ({ className, ...props }, ref) => (
    <Radio ref={ref} className={cn(className)} {...props} />
  )
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }