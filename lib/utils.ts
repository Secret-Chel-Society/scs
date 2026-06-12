import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getCurrentSeasonId(): string | number {
  // This function should return the current season ID
  // For now, returning a default value - this may need to be updated based on your app's logic
  return "1b63877d-44c7-44d4-aaf1-b6c24c5beaf4" // Default to current season UUID
}
