import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: ReactNode
  description?: ReactNode
}

export function PageHeader({ className, title, description, ...props }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  )
}

