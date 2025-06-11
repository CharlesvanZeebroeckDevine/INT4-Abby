"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { useForm } from "../../contexts/form-context"
import { Layout } from "../../components/layout"

export default function AvatarPage() {
  const router = useRouter()
  const { state, dispatch } = useForm()
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const avatarRef = useRef(null)

  // Initialize scale, panX, panY from state if they exist, otherwise default
  const [scale, setScale] = useState(state.avatar.scale || 1)
  const [panX, setPanX] = useState(state.avatar.panX || 0)
  const [panY, setPanY] = useState(state.avatar.panY || 0)

  const handleImageCapture = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      dispatch({
        type: "UPDATE_AVATAR",
        payload: { eyeImage: selectedFile, scale: 1, panX: 0, panY: 0 }, // Reset pan/zoom on new image
      })
      setScale(1)
      setPanX(0)
      setPanY(0)
      setShowColorSelector(true)
    }
  }

  const handleColorSelect = (color) => {
    dispatch({
      type: "UPDATE_AVATAR",
      payload: { selectedColor: color, scale, panX, panY }, // Pass current pan/zoom with color
    })
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartPan({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPanX(e.clientX - startPan.x)
    setPanY(e.clientY - startPan.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Persist current pan/zoom to form context on mouse up
    dispatch({
      type: "UPDATE_AVATAR",
      payload: { scale, panX, panY },
    })
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      // Persist current pan/zoom to form context if drag ends by leaving the area
      dispatch({
        type: "UPDATE_AVATAR",
        payload: { scale, panX, panY },
      })
    }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const scaleAmount = 0.1
    const newScale = e.deltaY < 0 ? scale + scaleAmount : scale - scaleAmount
    setScale(Math.max(0.5, Math.min(newScale, 3))) // Limit zoom between 0.5 and 3

    // Persist current pan/zoom to form context on wheel
    dispatch({
      type: "UPDATE_AVATAR",
      payload: { scale: Math.max(0.5, Math.min(newScale, 3)), panX, panY },
    })
  }

  const handleNext = () => {
    if (!state.avatar.eyeImage) {
      alert("Please capture your eye avatar first")
      return
    }
    // Ensure latest pan/zoom values are in state before proceeding
    dispatch({
      type: "UPDATE_AVATAR",
      payload: { scale, panX, panY },
    })
    dispatch({ type: "SET_STEP", payload: 2 })
    router.push("/artwork")
  }

  const handlePrevious = () => {
    dispatch({ type: "SET_STEP", payload: 0 })
    router.push("/profile")
  }

  const handleSkip = () => {
    dispatch({ type: "SET_STEP", payload: 2 })
    router.push("/artwork")
  }

  if (showColorSelector || state.avatar.eyeImage) {
    return (
      <Layout
        title="YOUR EYE AVATAR"
        subtitle="Let's give your story an eye!"
        currentStep={2}
        totalSteps={4}
        onPrevious={handlePrevious}
        onNext={handleNext}
        disableNext={!state.avatar.eyeImage}
      >
        {/* Square preview area with masked eye */}
        <div
          className="abby-avatar-preview-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          ref={avatarRef}
        >
          <div
            className="abby-avatar-preview"
            style={{ backgroundColor: state.avatar.selectedColor || "#01A569" }}
            role="img"
            aria-label="Eye avatar preview"
          >
            {state.avatar.eyeImage ? (
              <div className="abby-eye-preview">
                <img
                  src={URL.createObjectURL(state.avatar.eyeImage) || "/placeholder.svg"}
                  alt="Eye avatar"
                  className="abby-eye-preview-image"
                  style={{
                    transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                />
              </div>
            ) : (
              <div className="abby-no-image">No image selected</div>
            )}
          </div>
        </div>

        {/* Color selector */}
        <div className="abby-color-selector">
          {[
            { name: "Red", value: "#FF5F02" },
            { name: "Blue", value: "#5F90FF" },
            { name: "Purple", value: "#BA7CD1" },
            { name: "Green", value: "#01A569" },
            { name: "Yellow", value: "#FFBF50" },
          ].map((color) => (
            <button
              key={color.value}
              className={`abby-color-option ${state.avatar.selectedColor === color.value ? "abby-color-selected" : ""}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorSelect(color.value)}
              aria-label={`Select ${color.name} color`}
              aria-pressed={state.avatar.selectedColor === color.value}
            ></button>
          ))}
        </div>

        {/* Retake button */}
        <div className="abby-avatar-actions">
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: "UPDATE_AVATAR", payload: { eyeImage: null, scale: 1, panX: 0, panY: 0 } }) // Reset all avatar state
              setShowColorSelector(false)
            }}
            className="abby-button-outline"
          >
            Retake picture
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="YOUR EYE AVATAR"
      subtitle="Let's give your story an eye!"
      currentStep={2}
      totalSteps={4}
      onPrevious={handlePrevious}
      showSkip={true}
      onSkip={handleSkip}
    >
      <div className="abby-eye-upload">
        <div className="abby-eye-upload-container">
          <svg width="118" height="60" viewBox="0 0 118 85" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M118 27.8086V41.1025L83.9443 35.4355C84.3354 37.3616 84.542 39.355 84.542 41.3955C84.542 44.2452 84.1333 46.9999 83.3857 49.6113L118 43.6787V57.0146L59 84.8242L0 57.0156V43.7227L34.0557 49.3887C33.6646 47.4626 33.458 45.4693 33.458 43.4287C33.458 40.579 33.8667 37.8243 34.6143 35.2129L0 41.1455V27.8096L59 0L118 27.8086ZM58.9512 29.918C52.0872 29.9182 46.5234 35.4827 46.5234 42.3467C46.5235 49.2107 52.0872 54.7752 58.9512 54.7754C58.9673 54.7754 58.9839 54.7745 59 54.7744C65.8418 54.7483 71.3798 49.1946 71.3799 42.3467C71.3799 35.4987 65.8419 29.9441 59 29.918C58.9839 29.9179 58.9673 29.918 58.9512 29.918Z" fill="#FF5F02" />
          </svg>
          <p className="abby-eye-upload-text">Tap to upload picture</p>
          <input type="file" accept="image/*" onChange={handleImageCapture} className="abby-eye-upload-input" />
        </div>
      </div>
    </Layout>
  )
}
