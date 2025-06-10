"use client"

import "./input.css"

export const Input = ({
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  error = false,
  ...props
}) => {
  const inputClasses = [
    "ui-input",
    error ? "ui-input-error" : "",
    className
  ].filter(Boolean).join(" ")

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputClasses}
      aria-invalid={error}
      {...props}
    />
  )
}
