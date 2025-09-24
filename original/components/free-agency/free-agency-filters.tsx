"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Add debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface FreeAgencyFiltersProps {
  initialParams?: { [key: string]: string | string[] | undefined }
}

export function FreeAgencyFilters({ initialParams = {} }: FreeAgencyFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Extract initial values from URL parameters with proper type handling
  const getInitialValue = (key: string, defaultValue = ""): string => {
    const value = initialParams[key]
    if (typeof value === "string") return value
    if (Array.isArray(value) && value.length > 0) return value[0]
    return defaultValue
  }

  // Initialize state with values from URL
  const [position, setPosition] = useState(getInitialValue("position", "all"))
  const [console, setConsole] = useState(getInitialValue("console", "all"))
  const [minSalary, setMinSalary] = useState(getInitialValue("minSalary"))
  const [maxSalary, setMaxSalary] = useState(getInitialValue("maxSalary"))
  const [nameFilter, setNameFilter] = useState(getInitialValue("name"))

  // Add debounced name filter
  const debouncedNameFilter = useDebounce(nameFilter, 500) // 500ms delay

  const handleFilter = useCallback(() => {
    try {
      // Create a new URLSearchParams object
      const params = new URLSearchParams()

      // Only add parameters that have values and aren't default
      if (position && position !== "all") params.set("position", position)
      if (console && console !== "all") params.set("console", console)
      if (minSalary && minSalary.trim() !== "") params.set("minSalary", minSalary)
      if (maxSalary && maxSalary.trim() !== "") params.set("maxSalary", maxSalary)
      if (debouncedNameFilter && debouncedNameFilter.trim() !== "") params.set("name", debouncedNameFilter)

      // Navigate with the new search params - use replace to avoid adding to history
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(url)
    } catch (error) {
      // Silent error handling to avoid console issues
      router.replace(pathname)
    }
  }, [position, console, minSalary, maxSalary, debouncedNameFilter, pathname, router])

  const handleReset = () => {
    setPosition("all")
    setConsole("all")
    setMinSalary("")
    setMaxSalary("")
    setNameFilter("")
    router.replace(pathname)
  }

  // Apply filters when Enter key is pressed in any input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFilter()
    }
  }

  // Auto-apply filters when debounced name changes
  useEffect(() => {
    handleFilter()
  }, [position, console, minSalary, maxSalary, debouncedNameFilter])

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="name-filter">Player Name</Label>
            <div className="relative">
              <Input
                id="name-filter"
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search by name"
                className="pr-8"
                onKeyDown={handleKeyDown}
              />
              {nameFilter && (
                <button
                  onClick={() => setNameFilter("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue placeholder="Any Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Position</SelectItem>
                <SelectItem value="C">Center (C)</SelectItem>
                <SelectItem value="LW">Left Wing (LW)</SelectItem>
                <SelectItem value="RW">Right Wing (RW)</SelectItem>
                <SelectItem value="LD">Left Defense (LD)</SelectItem>
                <SelectItem value="RD">Right Defense (RD)</SelectItem>
                <SelectItem value="G">Goalie (G)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="console">Console</Label>
            <Select value={console} onValueChange={setConsole}>
              <SelectTrigger id="console">
                <SelectValue placeholder="Any Console" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Console</SelectItem>
                <SelectItem value="Xbox">Xbox</SelectItem>
                <SelectItem value="PS5">PS5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="min-salary">Min Salary</Label>
            <Input
              id="min-salary"
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="Min Salary"
              min={0}
              step={50000}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <Label htmlFor="max-salary">Max Salary</Label>
            <Input
              id="max-salary"
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="Max Salary"
              min={0}
              step={50000}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleFilter}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  )
}
