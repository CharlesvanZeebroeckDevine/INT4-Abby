"use client"

export function Select({ value, onValueChange, children, ...props }) {
  return <div className="select">{children}</div>
}

export function SelectTrigger({ children, variant = "default", className = "", ...props }) {
  const baseClass = "select-trigger"
  const variantClass = variant === "primary" ? "select-trigger-primary" : ""

  const classes = [baseClass, variantClass, className].filter(Boolean).join(" ")

  return (
    <div className={classes} {...props}>
      {children}
      <span>▼</span>
    </div>
  )
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>
}

export function SelectContent({ children }) {
  return <div className="select-content">{children}</div>
}

export function SelectItem({ children, value, onSelect }) {
  return (
    <div className="select-item" onClick={() => onSelect?.(value)}>
      {children}
    </div>
  )
}
