"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  min?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  min
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleInputClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.showPicker?.()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal bg-black border-slate-800 text-white hover:bg-slate-950 hover:border-white",
          !value && "text-slate-500",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleInputClick}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
        {value ? formatDisplayDate(value) : placeholder}
      </Button>
      
      <Input
        ref={inputRef}
        type="date"
        value={value || ""}
        onChange={handleInputChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={disabled}
        min={min}
        tabIndex={-1}
      />
    </div>
  )
}
