/**
 * Manages offline functionality and data synchronization
 */

const OFFLINE_SUBMISSIONS_KEY = "offlineSubmissions"
const FORM_PROGRESS_KEY = "formProgress"

/**
 * Stores a submission for later sync when online
 * @param {Object} submissionData - Submission data to store
 */
export function storeOfflineSubmission(submissionData) {
  try {
    const offlineSubmissions = getOfflineSubmissions()
    const submissionWithId = {
      ...submissionData,
      offline_id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stored_at: new Date().toISOString(),
    }

    offlineSubmissions.push(submissionWithId)
    localStorage.setItem(OFFLINE_SUBMISSIONS_KEY, JSON.stringify(offlineSubmissions))

    console.log("Submission stored offline:", submissionWithId.offline_id)
    return submissionWithId.offline_id
  } catch (error) {
    console.error("Error storing offline submission:", error)
    return null
  }
}

/**
 * Gets all offline submissions
 * @returns {Array} Array of offline submissions
 */
export function getOfflineSubmissions() {
  try {
    const stored = localStorage.getItem(OFFLINE_SUBMISSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error getting offline submissions:", error)
    return []
  }
}

/**
 * Removes a submission from offline storage
 * @param {string} offlineId - Offline submission ID
 */
export function removeOfflineSubmission(offlineId) {
  try {
    const offlineSubmissions = getOfflineSubmissions()
    const filtered = offlineSubmissions.filter((sub) => sub.offline_id !== offlineId)
    localStorage.setItem(OFFLINE_SUBMISSIONS_KEY, JSON.stringify(filtered))
    console.log("Removed offline submission:", offlineId)
  } catch (error) {
    console.error("Error removing offline submission:", error)
  }
}

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

/**
 * Syncs offline submissions when back online
 * @param {Function} saveSubmissionFn - Function to save submissions
 * @returns {Promise<Array>} Array of sync results
 */
export async function syncOfflineSubmissions(saveSubmissionFn) {
  const offlineSubmissions = getOfflineSubmissions()

  if (offlineSubmissions.length === 0) {
    return []
  }

  console.log(`Syncing ${offlineSubmissions.length} offline submissions...`)
  const results = []

  for (const submission of offlineSubmissions) {
    try {
      const { offline_id, stored_at, ...submissionData } = submission
      const result = await saveSubmissionFn(submissionData)

      if (result.error) {
        results.push({ offline_id, success: false, error: result.error })
      } else {
        removeOfflineSubmission(offline_id)
        results.push({ offline_id, success: true, data: result.data })
      }
    } catch (error) {
      results.push({ offline_id: submission.offline_id, success: false, error })
    }
  }

  console.log("Sync results:", results)
  return results
}
