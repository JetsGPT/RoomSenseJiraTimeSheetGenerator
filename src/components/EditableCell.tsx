import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableCellProps {
  value: string | number
  onSave: (value: string | number) => void
  className?: string
  type?: 'text' | 'number'
  placeholder?: string
}

export function EditableCell({ value, onSave, className, type = 'text', placeholder }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Convert value to string safely, handling objects
  const getDisplayValue = () => {
    if (value === null || value === undefined) return placeholder || '-'
    if (typeof value === 'object') {
      // If it's an object, try to extract a meaningful string
      if (value instanceof Date) return value.toISOString().split('T')[0]
      return JSON.stringify(value)
    }
    return String(value)
  }
  
  const [editValue, setEditValue] = useState(getDisplayValue())

  useEffect(() => {
    setEditValue(getDisplayValue())
  }, [value])

  const handleBlur = () => {
    const finalValue = type === 'number' ? parseFloat(editValue) || 0 : editValue
    onSave(finalValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(getDisplayValue())
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-8 text-sm", className)}
        autoFocus
        placeholder={placeholder}
      />
    )
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] inline-flex items-center transition-smooth",
        className
      )}
      title="Click to edit"
    >
      {getDisplayValue()}
    </span>
  )
}

