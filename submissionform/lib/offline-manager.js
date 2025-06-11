/**
 * Manages offline functionality and data synchronization
 */

const FORM_PROGRESS_KEY = "formProgress"

/**
 * Stores form progress for recovery
 * @param {Object} formState - Current form state
 */
export function storeFormProgress(formState) {
  try {
    const progressData = {
      ...formState,
      saved_at: new Date().toISOString(),
    }
    localStorage.setItem(FORM_PROGRESS_KEY, JSON.stringify(progressData))
  } catch (error) {
    console.error("Error storing form progress:", error)
  }
}

/**
 * Gets stored form progress
 * @returns {Object|null} Stored form state or null
 */
export function getFormProgress() {
  try {
    const stored = localStorage.getItem(FORM_PROGRESS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error getting form progress:", error)
    return null
  }
}

/**
 * Clears stored form progress
 */
export function clearFormProgress() {
  try {
    localStorage.removeItem(FORM_PROGRESS_KEY)
  } catch (error) {
    console.error("Error clearing form progress:", error)
  }
}
