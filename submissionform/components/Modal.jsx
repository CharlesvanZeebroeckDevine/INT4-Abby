import "./Modal.css"

export const Modal = ({ isOpen, onClose, title, description, children }) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button
                        onClick={onClose}
                        className="modal-close"
                        aria-label="Close dialog"
                    >
                        ×
                    </button>
                </div>
                <p className="modal-description">{description}</p>
                {children}
            </div>
        </div>
    )
} 