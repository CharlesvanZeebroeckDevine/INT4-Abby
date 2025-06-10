"use client"

import { useState, useCallback, memo } from "react"
import { optimizeImage, isImageFile, formatFileSize } from "../utils/image-optimizer"
import "./file-upload.css"

/**
 * Individual file upload item component
 */
const FileUploadItem = memo(({ file, onRemove, progress, index }) => {
  const [imageUrl, setImageUrl] = useState(null)

  // Create object URL for image preview
  useState(() => {
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  return (
    <div className="abby-file-item">
      <div className="abby-file-item-content">
        <div className="abby-file-thumbnail">
          {imageUrl ? (
            <img src={imageUrl || "/placeholder.svg"} alt={file.name} className="abby-file-preview" />
          ) : (
            <span className="abby-file-icon">📄</span>
          )}
        </div>

        <div className="abby-file-details">
          <p className="abby-file-name">{file.name}</p>
          <p className="abby-file-size">{formatFileSize(file.size)}</p>
          {progress !== undefined && progress < 100 && (
            <div className="abby-progress-bar">
              <div className="abby-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>

        <button onClick={() => onRemove(index)} className="abby-remove-file-button" aria-label={`Remove ${file.name}`}>
          ✕
        </button>
      </div>
    </div>
  )
})
FileUploadItem.displayName = "FileUploadItem"

/**
 * Enhanced file upload component with image optimization
 */
export const FileUpload = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 6 * 1024 * 1024, // 6MB
  accept = "image/*",
  className = "",
  disabled = false,
  error = false,
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    onFilesChange(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    onFilesChange(files)
  }

  const uploadClasses = [
    "ui-file-upload",
    isDragging ? "ui-file-upload-dragging" : "",
    error ? "ui-file-upload-error" : "",
    className
  ].filter(Boolean).join(" ")

  const handleFiles = useCallback(
    async (newFiles) => {
      if (isProcessing) return

      console.log(`Current files count:`, newFiles.length)

      setIsProcessing(true)

      try {
        const validFiles = Array.from(newFiles).filter((file) => {
          if (file.size > maxSize) {
            alert(`File ${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`)
            return false
          }
          return true
        })

        // Check if adding these files would exceed the maxFiles limit
        const totalCount = validFiles.length

        console.log(`Total: ${totalCount}, Max: ${maxFiles}`)

        if (totalCount > maxFiles) {
          alert(
            `You can only upload up to ${maxFiles} files to this upload area. You currently have ${totalCount} files.`,
          )
          return
        }

        // Optimize images before adding them
        const optimizedFiles = []
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i]
          const progressKey = i

          setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }))

          if (isImageFile(file)) {
            // Simulate progress for optimization
            setUploadProgress((prev) => ({ ...prev, [progressKey]: 25 }))

            const optimized = await optimizeImage(file)
            optimizedFiles.push(optimized)

            setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }))
          } else {
            optimizedFiles.push(file)
            setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }))
          }
        }

        // Create the new files array
        const newFilesArray = [...optimizedFiles]
        console.log(`Calling onFilesChange with ${newFilesArray.length} files`)

        // Directly pass the new files array
        onFilesChange(newFilesArray)

        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress({})
        }, 1000)
      } catch (error) {
        console.error("Error processing files:", error)
        alert("Error processing files. Please try again.")
      } finally {
        setIsProcessing(false)
      }
    },
    [maxFiles, maxSize, onFilesChange, isProcessing],
  )

  return (
    <div
      className={uploadClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        className="ui-file-input"
        {...props}
      />
      <div className="ui-file-upload-content">
        <p>Drag and drop files here, or click to select files</p>
        <p className="ui-file-upload-hint">Maximum {maxFiles} files</p>
      </div>
    </div>
  )
}
