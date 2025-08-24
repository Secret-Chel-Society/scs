"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  links?: { label: string; href: string }[];
}

export function Sidebar({ className, title, description, links = [], ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white p-6 space-y-6 z-50",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <nav className="flex flex-col space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-gray-300 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
