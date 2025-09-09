"use client"

import * as React from "react"
import { Tabs as HeroUITabs, Tab } from "@heroui/react"
import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentProps<typeof HeroUITabs> {
  children: React.ReactNode
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, children, ...props }, ref) => (
    <HeroUITabs ref={ref} className={cn(className)} {...props}>
      {children}
    </HeroUITabs>
  ),
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  ),
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Tab>>(
  ({ className, ...props }, ref) => (
    <Tab ref={ref} className={cn(className)} {...props} />
  ),
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  ),
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }