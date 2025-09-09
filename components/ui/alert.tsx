import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border-2 p-6 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-6 [&>svg]:top-6 [&>svg]:text-foreground shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-white/80 dark:bg-slate-800/80 border-ice-blue-200/50 dark:border-ice-blue-700/50 text-slate-900 dark:text-slate-100 [&>svg]:text-ice-blue-600 dark:[&>svg]:text-ice-blue-400",
        destructive: "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400",
        success: "bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
        warning: "bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
        info: "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-2 font-bold leading-tight tracking-tight text-lg", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-base [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
