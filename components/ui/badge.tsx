import type * as React from "react"
import { Badge as HeroUIBadge } from "@heroui/react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.ComponentProps<typeof HeroUIBadge> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  // Map our variants to HeroUI variants
  const heroUIVariant = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return "solid"
      case "secondary":
        return "flat"
      case "outline":
        return "bordered"
      default:
        return "solid"
    }
  }, [variant])

  // Map our color to HeroUI color
  const heroUIColor = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return "danger"
      case "secondary":
        return "secondary"
      default:
        return "primary"
    }
  }, [variant])

  return (
    <HeroUIBadge
      variant={heroUIVariant}
      color={heroUIColor}
      className={cn(className)}
      {...props}
    />
  )
}

export { Badge }