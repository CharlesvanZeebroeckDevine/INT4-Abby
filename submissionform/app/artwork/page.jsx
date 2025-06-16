"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Checkbox } from "../../components/ui/checkbox"
import { FileUpload } from "../../components/file-upload"
import { Layout } from "../../components/layout"
import { useForm } from "../../contexts/form-context"

const categories = ["Painting", "Handcrafts", "Digital art", "Photography", "Sculpture", "Other"]

export default function ArtworkPage() {
  const router = useRouter()
  const { state, dispatch, submitForm } = useForm()
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging
  console.log("ArtworkPage: Current artworks state:", state.artworks)

  // Initialize with one artwork if none exist
  useEffect(() => {
    if (state.artworks.length === 0) {
      const newArtwork = {
        title: "",
        description: "",
        category: "",
        images: [], // Ensure this is always an array
        includeProcess: false,
        processDescription: "",
        processImages: [], // Ensure this is always an array
      }
      console.log("Initializing with first artwork:", newArtwork)
      dispatch({ type: "ADD_ARTWORK", payload: newArtwork })
    }
  }, [state.artworks.length, dispatch])

  const addArtwork = () => {
    if (state.artworks.length < 3) {
      const newArtwork = {
        title: "",
        description: "",
        category: "",
        images: [], // Ensure this is always an array
        includeProcess: false,
        processDescription: "",
        processImages: [], // Ensure this is always an array
      }
      console.log("Adding new artwork:", newArtwork)
      dispatch({ type: "ADD_ARTWORK", payload: newArtwork })
    }
  }

  const removeArtwork = (index) => {
    console.log("Removing artwork at index:", index)
    dispatch({ type: "REMOVE_ARTWORK", index: index })
  }

  const updateArtwork = (index, field, value) => {
    console.log(`Updating artwork ${index}, field ${field}:`, value)

    // For file arrays, ensure we create a clean copy
    if (field === "images" || field === "processImages") {
      const cleanValue = Array.isArray(value) ? [...value] : []
      console.log(`Setting ${field} for artwork ${index} to:`, cleanValue)
      dispatch({ type: "UPDATE_ARTWORK", index, payload: { [field]: cleanValue } })
    } else {
      dispatch({ type: "UPDATE_ARTWORK", index, payload: { [field]: value } })
    }

    if (errors[`${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`${index}_${field}`]: "" }))
    }
  }

  const validateArtworkForm = () => {
    const newErrors = {}

    if (state.artworks.length === 0) {
      newErrors.general = "Please add at least one artwork"
      setErrors(newErrors)
      return false
    }

    state.artworks.forEach((artwork, index) => {
      // Check title
      if (!artwork.title || artwork.title.trim() === "") {
        newErrors[`${index}_title`] = "Title is required"
      }

      // Check description
      if (!artwork.description || artwork.description.trim() === "") {
        newErrors[`${index}_description`] = "Description is required"
      }

      // Check category
      if (!artwork.category) {
        newErrors[`${index}_category`] = "Category is required"
      }

      // Check images
      if (!artwork.images || artwork.images.length === 0) {
        newErrors[`${index}_images`] = "At least one image is required"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateArtworkForm()) return

    setIsSubmitting(true)
    try {
      dispatch({ type: "SET_STEP", payload: 3 })
      router.push("/contact")
    } catch (error) {
      console.error("Navigation error:", error)
      setErrors({ submit: "Failed to proceed. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrevious = () => {
    dispatch({ type: "SET_STEP", payload: 1 })
    router.push("/avatar")
  }

  return (
    <Layout
      title="YOUR ARTWORK"
      subtitle="You can add up to 3 different artworks"
      currentStep={3}
      totalSteps={4}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextButtonText="Submit Artwork"
      isSubmitting={isSubmitting}
    >
      {errors.general && (
        <div className="abby-alert abby-alert-error">
          <p role="alert">{errors.general}</p>
        </div>
      )}

      {errors.submit && (
        <div className="abby-alert abby-alert-error">
          <p role="alert">{errors.submit}</p>
        </div>
      )}

      <div className="abby-artwork-list">
        {state.artworks.map((artwork, index) => {
          // Ensure artwork has proper structure
          const safeArtwork = {
            title: artwork.title || "",
            description: artwork.description || "",
            category: artwork.category || "",
            images: Array.isArray(artwork.images) ? artwork.images : [],
            includeProcess: artwork.includeProcess || false,
            processDescription: artwork.processDescription || "",
            processImages: Array.isArray(artwork.processImages) ? artwork.processImages : [],
          }

          console.log(`Rendering artwork ${index}:`, safeArtwork)

          return (
            <div key={index} className="abby-artwork-item">
              <div className="abby-artwork-header">
                <h2 className="abby-artwork-title">Artwork {index + 1}</h2>
                {state.artworks.length > 1 && (
                  <button
                    onClick={() => removeArtwork(index)}
                    className="abby-remove-button"
                    aria-label={`Remove artwork ${index + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="abby-artwork-fields">
                <div className="abby-field-group">
                  <label htmlFor={`title-${index}`} className="abby-field-label">
                    Give your work a catchy name!
                  </label>
                  <Input
                    id={`title-${index}`}
                    type="text"
                    placeholder="e.g. Sunset Dreams"
                    value={safeArtwork.title}
                    onChange={(e) => updateArtwork(index, "title", e.target.value)}
                    className="abby-input-primary"
                    error={!!errors[`${index}_title`]}
                    aria-describedby={errors[`${index}_title`] ? `title-${index}-error` : undefined}
                  />
                  {errors[`${index}_title`] && (
                    <p id={`title-${index}-error`} className="abby-field-error" role="alert">
                      {errors[`${index}_title`]}
                    </p>
                  )}
                </div>

                <div className="abby-field-group">
                  <label htmlFor={`description-${index}`} className="abby-field-label">
                    What's the story behind it?
                  </label>
                  <Textarea
                    id={`description-${index}`}
                    placeholder="Tell us about your inspiration, technique, or what this piece means to you..."
                    value={safeArtwork.description}
                    onChange={(e) => updateArtwork(index, "description", e.target.value)}
                    className="abby-textarea-primary"
                    maxLength={200}
                    error={!!errors[`${index}_description`]}
                    aria-describedby={
                      errors[`${index}_description`] ? `description-${index}-error` : `description-${index}-count`
                    }
                  />
                  <div className="abby-field-footer">
                    {errors[`${index}_description`] && (
                      <p id={`description-${index}-error`} className="abby-field-error" role="alert">
                        {errors[`${index}_description`]}
                      </p>
                    )}
                    <p id={`description-${index}-count`} className="abby-character-count" aria-live="polite">
                      {safeArtwork.description.length}/200
                    </p>
                  </div>
                </div>

                <div className="abby-field-group">
                  <label htmlFor={`category-${index}`} className="abby-field-label">
                    Choose a category
                  </label>
                  <div className="abby-category-grid">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`abby-category-box ${safeArtwork.category === category ? "abby-category-selected" : ""}`}
                        onClick={() => updateArtwork(index, "category", category)}
                        aria-pressed={safeArtwork.category === category}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {errors[`${index}_category`] && (
                    <p id={`category-${index}-error`} className="abby-field-error" role="alert">
                      {errors[`${index}_category`]}
                    </p>
                  )}
                </div>

                <div className="abby-field-group">
                  <label className="abby-field-label">Upload your creation!</label>
                  <FileUpload
                    files={safeArtwork.images}
                    onFilesChange={(files) => updateArtwork(index, "images", files)}
                    maxFiles={2}
                    debugLabel={`artwork-${index}-images`}
                  />
                  {errors[`${index}_images`] && (
                    <p className="abby-field-error" role="alert">
                      {errors[`${index}_images`]}
                    </p>
                  )}
                </div>

                <div className="abby-field-group">
                  <div className="abby-checkbox-container">
                    <Checkbox
                      id={`process-${index}`}
                      checked={safeArtwork.includeProcess}
                      onCheckedChange={(checked) => updateArtwork(index, "includeProcess", checked)}
                    />
                    <label htmlFor={`process-${index}`} className="abby-field-label process-label">
                      I wish to add more explanations and process photos
                    </label>
                  </div>

                  {safeArtwork.includeProcess && (
                    <div className="abby-process-section">
                      <div className="abby-field-group">
                        <label htmlFor={`process-desc-${index}`} className="abby-field-label">
                          About the process
                        </label>
                        <Textarea
                          id={`process-desc-${index}`}
                          placeholder="Describe your creative process, techniques used, challenges faced..."
                          value={safeArtwork.processDescription}
                          onChange={(e) => updateArtwork(index, "processDescription", e.target.value)}
                          className="abby-textarea-primary"
                          maxLength={200}
                          aria-describedby={`process-desc-${index}-count`}
                        />
                        <p id={`process-desc-${index}-count`} className="abby-character-count" aria-live="polite">
                          {safeArtwork.processDescription.length}/200
                        </p>
                      </div>

                      <div className="abby-field-group">
                        <label className="abby-field-label">Process pictures</label>
                        <FileUpload
                          files={safeArtwork.processImages}
                          onFilesChange={(files) => updateArtwork(index, "processImages", files)}
                          maxFiles={2}
                          debugLabel={`artwork-${index}-process`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {state.artworks.length < 3 && (
          <Button onClick={addArtwork} variant="outline" className="abby-add-artwork-button">
            + Add another artwork
          </Button>
        )}
      </div>
    </Layout>
  )
}
