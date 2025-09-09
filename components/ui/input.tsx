import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-ice-blue-200 dark:border-ice-blue-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ice-blue-500/20 dark:focus-visible:ring-ice-blue-400/20 focus-visible:border-ice-blue-500 dark:focus-visible:border-ice-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-ice-blue-300 dark:hover:border-ice-blue-600",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
