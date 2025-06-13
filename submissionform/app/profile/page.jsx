"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { useForm } from "../../contexts/form-context"
import { validators, validateForm } from "../../utils/validation"
import { Layout } from "../../components/layout"

export default function ProfilePage() {
  const router = useRouter()
  const { state, dispatch } = useForm()
  const [errors, setErrors] = useState({})

  const validateProfileForm = () => {
    const validationSchema = {
      creatorName: [validators.required("Creator name is required")],
      aboutYou: [
        validators.required("Please tell us about yourself"),
        validators.minLength(20, "Please write at least 20 characters"),
      ],
    }

    const { isValid, errors: validationErrors } = validateForm(state.profile, validationSchema)
    setErrors(validationErrors)
    return isValid
  }

  const handleNext = () => {
    if (validateProfileForm()) {
      dispatch({ type: "SET_STEP", payload: 1 })
      router.push("/avatar")
    }
  }

  const handleInputChange = (field, value) => {
    dispatch({ type: "UPDATE_PROFILE", payload: { [field]: value } })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handlePrevious = () => {
    router.push("/")
  }

  return (
    <Layout
      title="YOUR CREATIVE PROFILE"
      subtitle="Tell us a little about yourself"
      currentStep={1}
      totalSteps={4}
      onPrevious={handlePrevious}
      onNext={handleNext}
    >
      <div className="abby-form-fields">
        <div className="abby-field-group">
          <label htmlFor="creatorName" className="abby-field-label">
            Creator Name
          </label>
          <Input
            id="creatorName"
            type="text"
            placeholder="Your artsy name"
            value={state.profile.creatorName}
            onChange={(e) => handleInputChange("creatorName", e.target.value)}
            className="abby-input-primary"
            error={!!errors.creatorName}
            aria-describedby={errors.creatorName ? "creatorName-error" : undefined}
          />
          {errors.creatorName && (
            <p id="creatorName-error" className="abby-field-error" role="alert">
              {errors.creatorName}
            </p>
          )}
        </div>

        <div className="abby-field-group">
          <label htmlFor="aboutYou" className="abby-field-label">
            About you
          </label>
          <Textarea
            id="aboutYou"
            placeholder="Yourself in two sentences, you could talk about your inspirations, your hobbies, whatever..."
            value={state.profile.aboutYou}
            onChange={(e) => handleInputChange("aboutYou", e.target.value)}
            className="abby-textarea-primary"
            maxLength={200}
            error={!!errors.aboutYou}
            aria-describedby={errors.aboutYou ? "aboutYou-error" : "aboutYou-count"}
          />
          <div className="abby-field-footer">
            {errors.aboutYou && (
              <p id="aboutYou-error" className="abby-field-error" role="alert">
                {errors.aboutYou}
              </p>
            )}
            <p id="aboutYou-count" className="abby-character-count" aria-live="polite">
              {state.profile.aboutYou.length}/200
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
