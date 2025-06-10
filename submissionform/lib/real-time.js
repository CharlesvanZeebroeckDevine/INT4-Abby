/**
 * Real-time subscription management for Supabase
 */
import { supabase } from "./supabase"

let subscriptions = []
let reconnectAttempts = 0
const maxReconnectAttempts = 5

/**
 * Sets up real-time subscriptions for submissions and votes
 * @param {Object} callbacks - Callback functions for different events
 * @returns {Object} Cleanup function
 */
export function setupRealTimeSubscriptions(callbacks) {
  // Clear any existing subscriptions
  cleanupSubscriptions()

  console.log("Setting up real-time subscriptions...")

  // Subscribe to new submissions
  const submissionsSubscription = supabase
    .channel("submissions-channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "submissions" }, (payload) => {
      console.log("New submission received:", payload.new)
      callbacks.onNewSubmission && callbacks.onNewSubmission(payload.new)
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "submissions" }, (payload) => {
      console.log("Submission updated:", payload.new)
      callbacks.onUpdateSubmission && callbacks.onUpdateSubmission(payload.new)
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "submissions" }, (payload) => {
      console.log("Submission deleted:", payload.old)
      callbacks.onDeleteSubmission && callbacks.onDeleteSubmission(payload.old)
    })
    .subscribe((status) => {
      console.log("Submissions subscription status:", status)
      if (status === "SUBSCRIBED") {
        reconnectAttempts = 0
      }
    })

  // Subscribe to votes
  const votesSubscription = supabase
    .channel("votes-channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, (payload) => {
      console.log("New vote received:", payload.new)
      callbacks.onNewVote && callbacks.onNewVote(payload.new)
    })
    .subscribe((status) => {
      console.log("Votes subscription status:", status)
    })

  subscriptions.push(submissionsSubscription, votesSubscription)

  // Setup reconnection logic
  window.addEventListener("online", handleReconnection)
  window.addEventListener("offline", handleDisconnection)

  return {
    cleanup: cleanupSubscriptions,
    reconnect: handleReconnection,
  }
}

/**
 * Handles reconnection when coming back online
 */
function handleReconnection() {
  console.log("Network back online, attempting to reconnect subscriptions...")

  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++

    setTimeout(() => {
      subscriptions.forEach((sub) => {
        if (sub && typeof sub.subscribe === "function") {
          sub.subscribe()
        }
      })
    }, 1000 * reconnectAttempts) // Exponential backoff
  }
}

/**
 * Handles disconnection when going offline
 */
function handleDisconnection() {
  console.log("Network offline, subscriptions will attempt to reconnect when online")
}

/**
 * Cleans up all active subscriptions
 */
function cleanupSubscriptions() {
  console.log("Cleaning up subscriptions...")
  subscriptions.forEach((sub) => {
    if (sub && typeof sub.unsubscribe === "function") {
      sub.unsubscribe()
    }
  })
  subscriptions = []
  window.removeEventListener("online", handleReconnection)
  window.removeEventListener("offline", handleDisconnection)
}

/**
 * Gets the current connection status
 * @returns {boolean} True if online
 */
export function getConnectionStatus() {
  return navigator.onLine
}
