import { useEffect } from "react"
import "./modal.css"

export const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    children
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="ui-modal-overlay" onClick={onClose}>
            <div className="ui-modal-backdrop" />
            <div
                className="ui-modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="ui-modal-header">
                    <h2 className="ui-modal-title">{title}</h2>
                    <button
                        className="ui-modal-close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        ×
                    </button>
                </div>
                {description && (
                    <p className="ui-modal-description">{description}</p>
                )}
                {children}
            </div>
        </div>
    )
} 