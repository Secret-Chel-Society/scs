"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  id?: string
  className?: string
}

export function FileUploader({
  onFileSelect,
  accept = "*",
  maxSize = 10, // Default 10MB
  id,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file type if accept is specified
    if (accept !== "*") {
      const acceptedTypes = accept.split(",").map((type) => type.trim())
      const fileType = file.type

      // For image/* or similar patterns
      if (acceptedTypes.some((type) => type.includes("*"))) {
        const generalTypes = acceptedTypes.filter((type) => type.includes("*")).map((type) => type.split("/")[0])

        if (!generalTypes.some((type) => fileType.startsWith(type))) {
          setError(`File must be one of these types: ${accept}`)
          return false
        }
      }
      // For specific file types
      else if (!acceptedTypes.includes(fileType)) {
        setError(`File must be one of these types: ${accept}`)
        return false
      }
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return false
    }

    return true
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} className="hidden" id={id} />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={cn(
          "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          selectedFile ? "bg-muted/20" : "",
        )}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFile()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept === "*" ? "Any file" : accept.replace(/,/g, ", ")} up to {maxSize}MB
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
