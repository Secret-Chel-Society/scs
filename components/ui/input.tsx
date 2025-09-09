import * as React from "react"
import { Input as HeroUIInput } from "@heroui/react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof HeroUIInput>>(
  ({ className, ...props }, ref) => (
    <HeroUIInput ref={ref} className={cn(className)} {...props} />
  ),
)
Input.displayName = "Input"

export { Input }