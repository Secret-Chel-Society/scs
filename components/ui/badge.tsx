import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white shadow-md hover:shadow-lg",
        secondary: "border-transparent bg-gradient-to-r from-hockey-silver-100 to-hockey-silver-200 dark:from-hockey-silver-800 dark:to-hockey-silver-700 text-hockey-silver-800 dark:text-hockey-silver-200 shadow-md hover:shadow-lg",
        destructive: "border-transparent bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white shadow-md hover:shadow-lg",
        success: "border-transparent bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white shadow-md hover:shadow-lg",
        outline: "border-2 border-ice-blue-200 dark:border-ice-blue-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-ice-blue-700 dark:text-ice-blue-300 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20",
        warning: "border-transparent bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
