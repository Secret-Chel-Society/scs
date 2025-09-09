import * as React from "react"
import { Textarea as HeroUITextarea } from "@heroui/react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<typeof HeroUITextarea> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <HeroUITextarea
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }