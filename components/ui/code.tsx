import type React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  language?: string
}

export function Code({ language, className, children, ...props }: CodeProps) {
  return (
    <div className="relative rounded-md bg-muted">
      {language && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground px-2 py-1 rounded bg-background/50">
          {language}
        </div>
      )}
      <pre
        className={cn("overflow-x-auto p-4 text-sm leading-relaxed text-foreground", language && "pt-8", className)}
        {...props}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}
