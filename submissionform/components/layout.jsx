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
        <div>
          <div className="abby-logo">
            <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208.45 71.01">
              <g id="Layer_1-2" data-name="Layer 1">
                <g>
                  <path d="M65.49,71.01V0h19.95c16.07,1.27,24.82,20.38,14.97,33.27,2.31,1.81,4.36,3.97,5.8,6.55,7.51,13.48-1.39,29.84-16.57,31.18h-24.14ZM78.87,28.13h5.92c.41,0,1.72-.46,2.15-.65,5.21-2.38,5.67-9.87.76-12.81-.55-.33-2.2-1.04-2.78-1.04h-6.05v14.51ZM78.87,57.39h9.75c4.37,0,7.38-5.14,6.37-9.16-.57-2.26-3.42-5.34-5.86-5.34h-10.26v14.51Z" />
                  <path d="M113.78,71.01V0h19.95c16.08,1.32,24.75,20.32,14.98,33.27,3.64,2.82,6.51,6.75,7.72,11.23,3.47,12.78-5.41,25.33-18.5,26.49h-24.14ZM127.16,28.13h5.92c.91,0,2.83-.94,3.56-1.53,3.7-2.97,3.7-8.48,0-11.45-.67-.54-2.62-1.53-3.44-1.53h-6.05v14.51ZM137.42,42.89h-10.26v14.51h9.75c2.49,0,5.28-2.46,6.11-4.71,1.53-4.13-1.16-9.24-5.6-9.8Z" />
                  <polygon points="0 71.01 21.97 0 40.63 .02 62.43 71.01 41.92 71.01 31.28 13.5 20.51 71.01 0 71.01" />
                  <polygon points="170.99 0 179.78 36.53 188.57 0 208.45 0 187.68 48.17 187.68 71.01 172.01 71.01 172.01 48.04 151.37 0 170.99 0" />
                </g>
              </g>
            </svg>
          </div>
          <div className="abby-eye-icon">
            <svg width="30" height="30" viewBox="0 0 118 85" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M118 27.8086V41.1025L83.9443 35.4355C84.3354 37.3616 84.542 39.355 84.542 41.3955C84.542 44.2452 84.1333 46.9999 83.3857 49.6113L118 43.6787V57.0146L59 84.8242L0 57.0156V43.7227L34.0557 49.3887C33.6646 47.4626 33.458 45.4693 33.458 43.4287C33.458 40.579 33.8667 37.8243 34.6143 35.2129L0 41.1455V27.8096L59 0L118 27.8086ZM58.9512 29.918C52.0872 29.9182 46.5234 35.4827 46.5234 42.3467C46.5235 49.2107 52.0872 54.7752 58.9512 54.7754C58.9673 54.7754 58.9839 54.7745 59 54.7744C65.8418 54.7483 71.3798 49.1946 71.3799 42.3467C71.3799 35.4987 65.8419 29.9441 59 29.918C58.9839 29.9179 58.9673 29.918 58.9512 29.918Z" fill="#000000" />
            </svg>
          </div>
        </div>
        <div>
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

          {/* Skip button */}
          {showSkip && onSkip && (
            <div className="abby-skip">
              <button onClick={onSkip} className="abby-skip-button" disabled={isSubmitting} aria-label="Skip this step">
                Skip
              </button>
            </div>
          )}
        </div>
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
    </div>
  )
}
