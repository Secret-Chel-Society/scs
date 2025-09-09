"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const DEFAULT_COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", 
  "#00FFFF", "#FFA500", "#800080", "#008000", "#000080"
]

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(color)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color)
  }, [color])

  const handleColorSelect = (newColor: string) => {
    onChange(newColor)
    setInputValue(newColor)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Only update if it's a valid hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(value)) {
      onChange(value)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-10 h-10 p-0 rounded-full overflow-hidden border-2 border-muted"
            style={{ backgroundColor: color }}
            aria-label="Pick a color"
          >
            <span className="sr-only">Pick a color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-8 h-8 rounded-full border-2 border-transparent hover:border-primary transition-colors"
                style={{ backgroundColor: c }}
                onClick={() => handleColorSelect(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="#RRGGBB"
              className="flex-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
