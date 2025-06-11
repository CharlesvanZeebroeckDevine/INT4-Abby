"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "../../components/ui/input"
import { useForm } from "../../contexts/form-context"
import { saveSubmission, uploadFile } from "../../lib/supabase"
import { validators, validateForm } from "../../utils/validation"
import { Layout } from "../../components/layout"

export default function ContactPage() {
  const router = useRouter()
  const { state, dispatch } = useForm()
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateContactForm = () => {
    const validationSchema = {
      fullName: [validators.required("Full name is required")],
      email: [validators.required("Email is required"), validators.email()],
    }

    const { isValid, errors: validationErrors } = validateForm(state.contact, validationSchema)
    setErrors(validationErrors)
    return isValid
  }

  const uploadFiles = async (files, bucket, basePath) => {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${basePath}_${index}_${Date.now()}.${file.name.split(".").pop()}`
      const { data, error } = await uploadFile(file, bucket, fileName)
      if (error) throw error
      return fileName
    })
    return Promise.all(uploadPromises)
  }

  const handleSubmit = async () => {
    if (!validateContactForm()) return

    setIsSubmitting(true)
    dispatch({ type: "SET_SUBMITTING", payload: true })

    try {
      console.log("Starting submission process...")

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log("Generated user ID:", userId)

      let avatarPath = null
      if (state.avatar.eyeImage) {
        console.log("Uploading avatar image...")
        const avatarFileName = `avatar_${userId}_${Date.now()}.jpg`

        try {
          const { error: avatarError } = await uploadFile(state.avatar.eyeImage, "avatars", avatarFileName)
          if (avatarError) throw avatarError
          avatarPath = avatarFileName
          console.log("Avatar uploaded successfully:", avatarPath)
        } catch (avatarError) {
          console.error("Avatar upload failed:", avatarError)
        }
      }

      console.log("Processing artworks...")
      const artworksWithImages = await Promise.all(
        state.artworks.map(async (artwork, index) => {
          console.log(`Processing artwork ${index + 1}...`)

          try {
            const imagesPaths = await uploadFiles(artwork.images, "artworks", `artwork_${userId}_${index}`)
            console.log(`Artwork ${index + 1} images uploaded:`, imagesPaths)

            let processImagesPaths = []
            if (artwork.processImages && artwork.processImages.length > 0) {
              processImagesPaths = await uploadFiles(artwork.processImages, "artworks", `process_${userId}_${index}`)
              console.log(`Artwork ${index + 1} process images uploaded:`, processImagesPaths)
            }

            return {
              ...artwork,
              images: imagesPaths,
              processImages: processImagesPaths,
            }
          } catch (uploadError) {
            console.error(`Error uploading artwork ${index + 1}:`, uploadError)
            return {
              ...artwork,
              images: [],
              processImages: [],
              upload_error: uploadError.message,
            }
          }
        }),
      )

      const submissionData = {
        creator_name: state.profile.creatorName,
        about_you: state.profile.aboutYou,
        contact_email: state.contact.email,
        contact_name: state.contact.fullName,
        avatar_image: avatarPath,
        avatar_color: state.avatar.selectedColor,
        artworks: artworksWithImages,
        status: "submitted",
        created_at: new Date().toISOString(),
      }

      console.log("Saving submission data:", submissionData)

      if (navigator.onLine) {
        const { data: submissionResult, error: saveError } = await saveSubmission(submissionData)

        if (saveError) {
          console.error("Save submission error:", saveError)
          const offlineId = storeOfflineSubmission(submissionData)
          if (offlineId) {
            dispatch({ type: "SET_OFFLINE_MODE", payload: true })
            setErrors({
              submit: "Your submission has been saved locally and will be uploaded when connection is restored.",
            })
          } else {
            throw new Error(saveError.message || "Failed to save submission")
          }
        } else {
          console.log("Submission saved successfully:", submissionResult)
        }
      } else {
        const offlineId = storeOfflineSubmission(submissionData)
        if (offlineId) {
          dispatch({ type: "SET_OFFLINE_MODE", payload: true })
          setErrors({
            submit: "You're offline. Your submission has been saved and will be uploaded when connection is restored.",
          })
        } else {
          throw new Error("Failed to save submission offline")
        }
      }

      localStorage.setItem("user_email", state.contact.email)
      localStorage.setItem("user_name", state.contact.fullName)
      localStorage.setItem("creator_name", state.profile.creatorName)

      dispatch({ type: "SET_STEP", payload: 4 })
      router.push("/success")
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({
        submit: error.message || "Failed to submit. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
      dispatch({ type: "SET_SUBMITTING", payload: false })
    }
  }

  const handleInputChange = (field, value) => {
    dispatch({ type: "UPDATE_CONTACT", payload: { [field]: value } })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handlePrevious = () => {
    dispatch({ type: "SET_STEP", payload: 2 })
    router.push("/artwork")
  }

  return (
    <Layout
      title="YOUR CONTACT INFO"
      subtitle="These details are just for us to get in touch, they won't be displayed publicly"
      currentStep={4}
      totalSteps={4}
      onPrevious={handlePrevious}
      onNext={handleSubmit}
      nextButtonText="Finalize submission"
      disableNext={isSubmitting}
      isSubmitting={isSubmitting}
    >
      {state.isOffline && (
        <div className="abby-alert abby-alert-warning">
          <p>
            You're currently offline. Your submission will be saved locally and uploaded when connection is restored.
          </p>
        </div>
      )}

      {errors.submit && (
        <div className={`abby-alert ${state.isOffline ? "abby-alert-info" : "abby-alert-error"}`}>
          <p>{errors.submit}</p>
        </div>
      )}

      <div className="abby-form-fields">
        <div className="abby-field-group">
          <label htmlFor="fullName" className="abby-field-label">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="eg. John Doe"
            value={state.contact.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="abby-input-primary"
            disabled={isSubmitting}
            error={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="abby-field-error" role="alert">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="abby-field-group">
          <label htmlFor="email" className="abby-field-label">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="eg. John.doe@gmail.com"
            value={state.contact.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="abby-input-primary"
            disabled={isSubmitting}
            error={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="abby-field-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="abby-connection-status">
          {navigator.onLine ? (
            <>
              <span className="abby-status-icon abby-status-online">●</span>
              <span>Connected</span>
            </>
          ) : (
            <>
              <span className="abby-status-icon abby-status-offline">●</span>
              <span>Offline - submissions will be saved locally</span>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
