import type React from "react"
import { Skeleton as HeroUISkeleton } from "@heroui/react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<typeof HeroUISkeleton>) {
  return <HeroUISkeleton className={cn(className)} {...props} />
}

export { Skeleton }