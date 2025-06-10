"use client"

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`abby-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`abby-card-content ${className}`} {...props}>
      {children}
    </div>
  )
}
