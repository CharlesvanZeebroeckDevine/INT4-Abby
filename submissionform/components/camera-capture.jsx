"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import Image from "next/image"

export function CameraCapture({ onCapture, capturedImage, selectedColor, onColorSelect }) {
  const [rawImage, setRawImage] = useState(null)
  const [showCropper, setShowCropper] = useState(false)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const colors = [
    { name: "Red", value: "#FF5F02" },
    { name: "Blue", value: "#5F90FF" },
    { name: "Purple", value: "#BA7CD1" },
    { name: "Green", value: "#01A569" },
    { name: "Yellow", value: "#FFBF50" },
  ]

  const handleFilesChange = useCallback((files) => {
    if (files && Array.isArray(files) && files.length > 0) {
      setRawImage(files[0])
      setShowCropper(true)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [])

  const handleContinue = useCallback(() => {
    // Just pass the original image without cropping
    if (rawImage && onCapture) {
      onCapture(rawImage)
    }
    setShowCropper(false)
    setShowColorSelector(true)
  }, [rawImage, onCapture])

  const handleColorSelect = useCallback(
    (color) => {
      if (onColorSelect) {
        onColorSelect(color)
      }
    },
    [onColorSelect],
  )

  const retakePhoto = useCallback(() => {
    setRawImage(null)
    setShowCropper(false)
    setShowColorSelector(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    if (onCapture) {
      onCapture(null)
    }
  }, [onCapture])

  const increaseScale = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 3))
  }, [])

  const decreaseScale = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }, [])

  const handleScaleChange = useCallback((e) => {
    const value = Number.parseFloat(e.target.value)
    setScale(value / 100)
  }, [])

  const handleMouseDown = useCallback(
    (e) => {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    },
    [position],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // If we have the final image and color selector is shown
  if (rawImage && showColorSelector) {
    return (
      <div className="abby-camera-capture">
        <div className="abby-eye-preview">
          <div className="abby-eye-preview-background" style={{ backgroundColor: selectedColor || "#01A569" }}></div>
          <img
            src={URL.createObjectURL(rawImage) || "/placeholder.svg"}
            alt="Eye avatar"
            className="abby-eye-preview-image"
          />
        </div>

        <div className="abby-color-selector">
          {colors.map((color) => (
            <div
              key={color.value}
              className={`abby-color-option ${selectedColor === color.value ? "abby-color-selected" : ""}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorSelect(color.value)}
              aria-pressed={selectedColor === color.value}
            ></div>
          ))}
        </div>

        <div className="abby-camera-actions">
          <Button variant="outline" onClick={retakePhoto} className="abby-button-outline">
            Retake picture
          </Button>
          <Button onClick={() => onCapture(rawImage)} className="abby-button-primary">
            Next
          </Button>
        </div>
      </div>
    )
  }

  // If we have a raw image and need to position it
  if (rawImage && showCropper) {
    return (
      <div className="abby-camera-capture">
        <div
          className="abby-image-cropper"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="abby-image-container"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={URL.createObjectURL(rawImage) || "/placeholder.svg"}
              alt="Raw capture"
              className="abby-raw-image"
              draggable={false}
            />
          </div>

          {/* Overlay with hexagon guide */}
          <div className="abby-image-overlay">
            <svg
              width="200"
              height="145"
              viewBox="0 0 104 75"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="abby-hexagon-guide"
            >
              <path
                d="M0 49.8477L51.582 74.1602L103.164 49.8457V24.3125L51.582 0L0 24.3145V49.8477Z"
                fill="rgba(95, 144, 255, 0.2)"
                stroke="#5F90FF"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>

        <p className="abby-cropper-instruction">Position your eye within the blue shape</p>

        {/* Image adjustment controls */}
        <div className="abby-image-controls">
          <div className="abby-zoom-control">
            <span className="abby-control-label">Zoom:</span>
            <div className="abby-zoom-buttons">
              <button className="abby-zoom-button" onClick={decreaseScale} disabled={scale <= 0.5}>
                -
              </button>
              <input
                type="range"
                min="50"
                max="300"
                value={scale * 100}
                onChange={handleScaleChange}
                className="abby-slider abby-zoom-slider"
              />
              <button className="abby-zoom-button" onClick={increaseScale} disabled={scale >= 3}>
                +
              </button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setPosition({ x: 0, y: 0 })} className="abby-center-button">
            Center Image
          </Button>
        </div>

        <div className="abby-camera-actions">
          <Button variant="outline" onClick={retakePhoto} className="abby-button-outline">
            Retake
          </Button>
          <Button onClick={handleContinue} className="abby-button-primary">
            Continue
          </Button>
        </div>
      </div>
    )
  }

  // Initial state - show FileUpload component
  return (
    <div className="abby-camera-capture">
      <div className="abby-eye-icon-container">
        <Image src="/eye-icon.png" alt="Eye icon" width={118} height={85} priority />
      </div>
      <p className="abby-camera-instruction">Take or upload a picture of your eye</p>

      <div className="abby-file-upload-container">
        <FileUpload files={[]} onFilesChange={handleFilesChange} maxFiles={1} accept="image/*" />
      </div>

      <div className="abby-installation-info">
        <p className="abby-installation-caption">Picture of eye grid installation</p>
        <p className="abby-installation-tagline">Join the vision</p>
      </div>
    </div>
  )
}
