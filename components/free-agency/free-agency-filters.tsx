"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, RotateCcw, SlidersHorizontal } from "lucide-react"

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
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  // Check if any advanced filters are active
  const hasAdvancedFilters = minSalary || maxSalary

  // Auto-expand if advanced filters are set
  useEffect(() => {
    if (hasAdvancedFilters) {
      setShowAdvanced(true)
    }
  }, [])

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
    setShowAdvanced(false)
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

  const hasActiveFilters = position !== "all" || console !== "all" || minSalary || maxSalary || nameFilter

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search players..."
            className="pl-10 pr-8 bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 h-10"
            onKeyDown={handleKeyDown}
          />
          {nameFilter && (
            <button
              onClick={() => setNameFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Position Filter */}
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="w-full lg:w-44 bg-slate-900/50 border-slate-600/50 text-white h-10">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="C">Center (C)</SelectItem>
            <SelectItem value="LW">Left Wing (LW)</SelectItem>
            <SelectItem value="RW">Right Wing (RW)</SelectItem>
            <SelectItem value="LD">Left Defense (LD)</SelectItem>
            <SelectItem value="RD">Right Defense (RD)</SelectItem>
            <SelectItem value="G">Goalie (G)</SelectItem>
          </SelectContent>
        </Select>

        {/* Console Filter */}
        <Select value={console} onValueChange={setConsole}>
          <SelectTrigger className="w-full lg:w-36 bg-slate-900/50 border-slate-600/50 text-white h-10">
            <SelectValue placeholder="Console" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Consoles</SelectItem>
            <SelectItem value="Xbox">Xbox</SelectItem>
            <SelectItem value="PS5">PS5</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`h-10 w-10 border-slate-600/50 hover:bg-slate-700/50 ${showAdvanced || hasAdvancedFilters ? 'bg-slate-700/50 text-blue-400' : 'text-slate-400'}`}
            title="Advanced filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10 border-slate-600/50 hover:bg-slate-700/50 text-slate-400 hover:text-white"
              title="Reset filters"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1.5 block">Min Salary</label>
              <Input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="0"
                min={0}
                step={50000}
                className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 h-10"
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1.5 block">Max Salary</label>
              <Input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="No limit"
                min={0}
                step={50000}
                className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 h-10"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nameFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
              Search: {nameFilter}
              <button onClick={() => setNameFilter("")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {position !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
              Position: {position}
              <button onClick={() => setPosition("all")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {console !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              Console: {console}
              <button onClick={() => setConsole("all")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {minSalary && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
              Min: ${parseInt(minSalary).toLocaleString()}
              <button onClick={() => setMinSalary("")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {maxSalary && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
              Max: ${parseInt(maxSalary).toLocaleString()}
              <button onClick={() => setMaxSalary("")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
