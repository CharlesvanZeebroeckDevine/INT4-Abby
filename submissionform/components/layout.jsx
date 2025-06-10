"use client"
import { Button } from "../components/ui/button.jsx"

/**
 * Unified layout component for all pages 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {number} props.currentStep - Current step number (1-4)
 * @param {number} props.totalSteps - Total number of steps
 * @param {Function} props.onPrevious - Previous button handler
 * @param {Function} props.onNext - Next button handler
 * @param {string} props.nextButtonText - Text for next button
 * @param {boolean} props.disableNext - Whether next button is disabled
 * @param {boolean} props.showSkip - Whether to show skip button
 * @param {Function} props.onSkip - Skip button handler
 * @param {boolean} props.isSubmitting - Whether form is submitting
 * @param {boolean} props.hideFooter - Whether to hide the footer
 * @param {boolean} props.isLandingPage - Whether this is the landing page
 */
export function Layout({
  children,
  title,
  subtitle,
  currentStep = 1,
  totalSteps = 4,
  onPrevious,
  onNext,
  nextButtonText = "Next",
  disableNext = false,
  showSkip = false,
  onSkip,
  isSubmitting = false,
  hideFooter = false,
  isLandingPage = false,
}) {
  return (
    <div className="abby-page">
      {/* Header */}
      <div className="abby-header">
        <div className="abby-logo">ABBY</div>
        <div className="abby-eye-icon">
          <img src="/eye-icon.png" alt="Eye icon" width={30} height={22} />
        </div>

        {!isLandingPage && onPrevious && (
          <button
            onClick={onPrevious}
            className="abby-nav-button"
            disabled={isSubmitting}
            aria-label="Go to previous step"
          >
            <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5.02508L9.78745 0V4.55695L3.3116 6.60502L17 5.02508V9.07001L3.3116 7.44619L9.78745 9.50157V14L0 9.07001L0 5.02508Z" fill="black" />
            </svg>
            <span>Previous</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="abby-content">
        {title && (
          <h1 className="abby-title" id="page-title">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="abby-subtitle" aria-describedby="page-title">
            {subtitle}
          </p>
        )}

        <main role="main" aria-labelledby="page-title">
          {children}
        </main>
      </div>

      {/* Footer */}
      {!hideFooter && onNext && (
        <div className="abby-footer">
          {!isLandingPage && (
            <div className="abby-step-counter">
              Step {currentStep}/{totalSteps}
            </div>
          )}
          <Button
            onClick={onNext}
            disabled={disableNext || isSubmitting}
            className="abby-button-primary"
            aria-label={isSubmitting ? "Submitting..." : nextButtonText}
          >
            {isSubmitting ? "Processing..." : nextButtonText}
          </Button>
        </div>
      )}

      {/* Skip button in footer for mobile */}
      {showSkip && onSkip && (
        <div className="abby-skip-footer">
          <button onClick={onSkip} className="abby-skip-button" disabled={isSubmitting} aria-label="Skip this step">
            Skip
          </button>
        </div>
      )}
    </div>
  )
}
