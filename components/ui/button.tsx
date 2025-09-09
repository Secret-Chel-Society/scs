// Midnight Studios INTl - All rights reserved
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-lg hover:shadow-xl hover:shadow-ice-blue-500/25 border border-ice-blue-400/20",
        destructive: "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-lg hover:shadow-xl hover:shadow-goal-red-500/25 border border-goal-red-400/20",
        outline: "border-2 border-ice-blue-200 dark:border-ice-blue-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 hover:border-ice-blue-300 dark:hover:border-ice-blue-600",
        secondary: "bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 text-hockey-silver-800 dark:text-hockey-silver-200 border border-hockey-silver-300 dark:border-hockey-silver-600 hover:from-hockey-silver-200 hover:to-hockey-silver-300 dark:hover:from-hockey-silver-700 dark:hover:to-hockey-silver-600",
        ghost: "text-ice-blue-600 dark:text-ice-blue-400 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 hover:text-ice-blue-700 dark:hover:text-ice-blue-300",
        link: "text-ice-blue-600 dark:text-ice-blue-400 underline-offset-4 hover:underline hover:text-ice-blue-700 dark:hover:text-ice-blue-300",
        success: "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-lg hover:shadow-xl hover:shadow-assist-green-500/25 border border-assist-green-400/20",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        xl: "h-15 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
