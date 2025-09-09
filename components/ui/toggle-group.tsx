"use client"

import * as React from "react"
import { ButtonGroup } from "@heroui/react"
import { cn } from "@/lib/utils"

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = "single", value, onValueChange, children, ...props }, ref) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      Array.isArray(value) ? value : value ? [value] : []
    )

    const handleValueChange = (newValue: string) => {
      if (type === "single") {
        const newValues = selectedValues.includes(newValue) ? [] : [newValue]
        setSelectedValues(newValues)
        onValueChange?.(newValues[0] || "")
      } else {
        const newValues = selectedValues.includes(newValue)
          ? selectedValues.filter(v => v !== newValue)
          : [...selectedValues, newValue]
        setSelectedValues(newValues)
        onValueChange?.(newValues)
      }
    }

    return (
      <ButtonGroup ref={ref} className={cn(className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              pressed: selectedValues.includes(child.props.value || ""),
              onPressedChange: () => handleValueChange(child.props.value || "")
            })
          }
          return child
        })}
      </ButtonGroup>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(
  ({ className, value, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(className)}
      data-value={value}
      {...props}
    />
  )
)
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }