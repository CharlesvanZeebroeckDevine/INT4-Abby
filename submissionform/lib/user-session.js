/**
 * User session management utilities
 */

// Keys for localStorage
const USER_SESSION_KEY = "abby_user_session"

/**
 * Saves user session data
 * @param {Object} userData - User data to save
 */
export function saveUserSession(userData) {
  try {
    const sessionData = {
      ...userData,
      isReturningUser: true,
      lastLogin: new Date().toISOString(),
    }
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData))
  } catch (error) {
    console.error("Error saving user session:", error)
  }
}

/**
 * Gets user session data
 * @returns {Object|null} User session data or null
 */
export function getUserSession() {
  try {
    const sessionData = localStorage.getItem(USER_SESSION_KEY)
    return sessionData ? JSON.parse(sessionData) : null
  } catch (error) {
    console.error("Error getting user session:", error)
    return null
  }
}

/**
 * Checks if user is a returning user
 * @returns {boolean} True if returning user
 */
export function isReturningUser() {
  const session = getUserSession()
  return !!session?.isReturningUser
}

/**
 * Clears user session
 */
export function clearUserSession() {
  try {
    localStorage.removeItem(USER_SESSION_KEY)
  } catch (error) {
    console.error("Error clearing user session:", error)
  }
}

/**
 * Updates user session with new data
 * @param {Object} updates - Data to update
 */
export function updateUserSession(updates) {
  try {
    const session = getUserSession() || {}
    const updatedSession = {
      ...session,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession))
  } catch (error) {
    console.error("Error updating user session:", error)
  }
}
