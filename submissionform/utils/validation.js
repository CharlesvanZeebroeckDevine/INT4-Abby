/**
 * Validation utility functions for form fields
 */

export const validators = {
  required:
    (message = "This field is required") =>
    (value) => {
      // Check if value is a string before calling trim()
      if (typeof value === "string") {
        return value.trim() === "" ? message : null
      }
      // For arrays (like file uploads), check length
      if (Array.isArray(value)) {
        return value.length === 0 ? message : null
      }
      // For other types, just check if value is falsy
      return !value ? message : null
    },

  email:
    (message = "Please enter a valid email address") =>
    (value) =>
      !value || !/\S+@\S+\.\S+/.test(value) ? message : null,

  minLength: (min, message) => (value) =>
    !value || (typeof value === "string" && value.trim().length < min)
      ? message || `Must be at least ${min} characters`
      : null,

  maxLength: (max, message) => (value) =>
    value && typeof value === "string" && value.trim().length > max
      ? message || `Must be less than ${max} characters`
      : null,

  fileRequired:
    (message = "Please upload at least one file") =>
    (files) =>
      !files || files.length === 0 ? message : null,

  fileMaxSize: (maxSize, message) => (file) =>
    file && file.size > maxSize
      ? message || `File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
      : null,
}

/**
 * Validates a single field against multiple validation rules
 * @param {any} value - Value to validate
 * @param {Array} validations - Array of validation functions
 * @returns {string|null} Error message or null if valid
 */
export function validateField(value, validations) {
  for (const validation of validations) {
    const error = validation(value)
    if (error) return error
  }
  return null
}

/**
 * Validates an entire form object against a validation schema
 * @param {Object} formData - Form data to validate
 * @param {Object} validationSchema - Schema defining validation rules
 * @returns {Object} Validation result with isValid flag and errors object
 */
export function validateForm(formData, validationSchema) {
  const errors = {}

  Object.entries(validationSchema).forEach(([field, validations]) => {
    const value = formData[field]
    const error = validateField(value, validations)
    if (error) errors[field] = error
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
