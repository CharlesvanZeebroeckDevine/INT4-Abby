"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { useForm } from "../../contexts/form-context"
import { Layout } from "../../components/layout"

export default function AvatarPage() {
  const router = useRouter()
  const { state, dispatch } = useForm()
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [file, setFile] = useState(null)

  const handleImageCapture = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      dispatch({ type: "UPDATE_AVATAR", payload: { eyeImage: selectedFile } })
      setFile(selectedFile)
      setShowColorSelector(true)
    }
  }

  const handleColorSelect = (color) => {
    dispatch({ type: "UPDATE_AVATAR", payload: { selectedColor: color } })
  }

  const handleNext = () => {
    if (!state.avatar.eyeImage) {
      alert("Please capture your eye avatar first")
      return
    }
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
        <div className="abby-avatar-preview-container">
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
              dispatch({ type: "UPDATE_AVATAR", payload: { eyeImage: null } })
              setShowColorSelector(false)
              setFile(null)
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
          <img src="/eye.png" alt="Eye icon" className="abby-eye-upload-icon" />
          <p className="abby-eye-upload-text">Tap to upload picture</p>
          <input type="file" accept="image/*" onChange={handleImageCapture} className="abby-eye-upload-input" />
        </div>
      </div>
    </Layout>
  )
}
