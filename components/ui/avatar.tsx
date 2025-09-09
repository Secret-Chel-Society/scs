"use client"

import * as React from "react"
import { Avatar as HeroUIAvatar } from "@heroui/react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIAvatar>>(
  ({ className, ...props }, ref) => (
    <HeroUIAvatar ref={ref} className={cn(className)} {...props} />
  ),
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img ref={ref} className={cn(className)} {...props} />
  ),
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  ),
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }