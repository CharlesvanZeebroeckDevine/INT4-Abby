"use client"

import { useEffect } from "react"

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="abby-dialog-overlay" onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  )
}

export function DialogTrigger({ children, asChild, ...props }) {
  return <div {...props}>{children}</div>
}

export function DialogContent({ children, className = "", ...props }) {
  return (
    <div className={`abby-dialog-content ${className}`} onClick={(e) => e.stopPropagation()} {...props}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`abby-dialog-header ${className}`} {...props}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`abby-dialog-title ${className}`} {...props}>
      {children}
    </h2>
  )
}
