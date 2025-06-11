"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "../../components/ui/input"
import { useForm } from "../../contexts/form-context"
import { validators, validateForm } from "../../utils/validation"
import { Layout } from "../../components/layout"

export default function ContactPage() {
    const router = useRouter()
    const { state, dispatch, submitForm } = useForm()
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validateContactInfo = () => {
        const validationSchema = {
            fullName: [validators.required("Full name is required")],
            email: [validators.required("Email is required"), validators.email()],
        }

        const { isValid, errors: validationErrors } = validateForm(
            {
                fullName: state.profile.fullName,
                email: state.profile.email,
            },
            validationSchema
        )
        setErrors(validationErrors)
        return isValid
    }

    const handleSubmit = async () => {
        if (!validateContactInfo()) return

        setIsSubmitting(true)
        try {
            const { success, error } = await submitForm()
            if (success) {
                router.push("/success")
            } else {
                setErrors({
                    submit: error?.message || "Failed to submit. Please try again.",
                })
            }
        } catch (error) {
            console.error("Submission error:", error)
            setErrors({
                submit: error.message || "Failed to submit. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field, value) => {
        dispatch({ type: "UPDATE_PROFILE", payload: { [field]: value } })
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
            currentStep={3}
            totalSteps={4}
            onPrevious={handlePrevious}
            onNext={handleSubmit}
            nextButtonText="Finalize submission"
            disableNext={isSubmitting}
            isSubmitting={isSubmitting}
        >
            {errors.submit && (
                <div className="abby-alert abby-alert-error">
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
                        value={state.profile.fullName}
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
                        value={state.profile.email}
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
            </div>
        </Layout>
    )
}