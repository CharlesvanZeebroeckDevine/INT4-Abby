"use client"

import "./textarea.css"

export const Textarea = ({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  error = false,
  ...props
}) => {
  const textareaClasses = [
    "ui-textarea",
    error ? "ui-textarea-error" : "",
    className
  ].filter(Boolean).join(" ")

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={textareaClasses}
      aria-invalid={error}
      {...props}
    />
  )
}
