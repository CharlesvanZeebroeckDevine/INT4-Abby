"use client"

export const Button = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button"
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ui-button ${className}`}
    >
      {children}
    </button>
  )
}
