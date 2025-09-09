// Midnight Studios INTl - All rights reserved
import * as React from "react"
import { Button as HeroUIButton, ButtonProps as HeroUIButtonProps } from "@heroui/react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends Omit<HeroUIButtonProps, 'variant'> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    // Map our variants to HeroUI variants
    const heroUIVariant = React.useMemo(() => {
      switch (variant) {
        case "destructive":
          return "solid"
        case "outline":
          return "bordered"
        case "secondary":
          return "flat"
        case "ghost":
          return "light"
        case "link":
          return "light"
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
      <HeroUIButton
        ref={ref}
        variant={heroUIVariant}
        color={heroUIColor}
        className={cn(className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }