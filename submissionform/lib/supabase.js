import { createClient } from "@supabase/supabase-js"
import { saveUserSession } from "./user-session"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key for bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Client-side Supabase client (singleton pattern)
let supabaseClient = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Auth helpers
export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Email-only authentication (simplified for prototype)
export const signInWithEmail = async (email) => {
  try {
    // For prototype: just store the email and simulate success
    localStorage.setItem("user_email", email)

    // Try to get user data from submissions table
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("contact_email", email)
      .order("created_at", { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const submission = data[0]

      // Save user session data for returning user flow
      saveUserSession({
        email: email,
        fullName: submission.contact_name || "User",
        creatorName: submission.creator_name || "Creator",
        aboutYou: submission.about_you || "",
        avatarColor: submission.avatar_color || "#01A569",
      })

      localStorage.setItem("user_name", submission.contact_name || "User")
      localStorage.setItem("creator_name", submission.creator_name || "Creator")
    }

    return { error: null }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error }
  }
}

// Update getCurrentUser to handle our simplified auth
export const getCurrentUser = async () => {
  try {
    // For prototype: get user info from localStorage
    const email = localStorage.getItem("user_email")
    const name = localStorage.getItem("user_name")
    const creatorName = localStorage.getItem("creator_name")

    if (email) {
      return {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: email,
        user_metadata: {
          full_name: name || "User",
          creator_name: creatorName || "Creator",
        },
      }
    }

    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Uploads a file to Supabase storage with retry mechanism
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path within the bucket
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<{data: any, error: Error|null}>} Upload result
 */
export const uploadFile = async (file, bucket, path, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        if (attempt === retries - 1) {
          throw error
        }
        console.warn(`Upload attempt ${attempt + 1} failed, retrying...`, error)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      return { data, error: null }
    } catch (error) {
      if (attempt === retries - 1) {
        console.error("Upload failed after all retries:", error)
        return { data: null, error }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
}

/**
 * Saves submission data with error handling and retry logic
 * @param {Object} submissionData - Submission data to save
 * @returns {Promise<{data: any, error: Error|null}>} Save result
 */
export async function saveSubmission(submissionData) {
  try {
    console.log("Attempting to save submission:", submissionData)

    // Use admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin.from("submissions").insert([submissionData]).select()

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    console.log("Submission saved successfully:", data)
    return { data, error: null }
  } catch (error) {
    console.error("Save submission error:", error)
    return { data: null, error }
  }
}

export const getUserSubmissions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return { data, error }
  } catch (error) {
    console.error("Error getting user submissions:", error)
    return { data: null, error }
  }
}

export const updateSubmission = async (id, updates) => {
  try {
    const { data, error } = await supabase.from("submissions").update(updates).eq("id", id).select()
    return { data, error }
  } catch (error) {
    console.error("Error updating submission:", error)
    return { data: null, error }
  }
}

export const deleteSubmission = async (id) => {
  try {
    const { error } = await supabase.from("submissions").delete().eq("id", id)
    return { error }
  } catch (error) {
    console.error("Error deleting submission:", error)
    return { error }
  }
}

export const getFileUrl = (bucket, path) => {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error("Error getting file URL:", error)
    return null
  }
}

/**
 * Gets all submissions for public display
 * @returns {Promise<{data: Array, error: Error|null}>} Submissions data
 */
export const getPublicSubmissions = async () => {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting public submissions:", error)
    return { data: null, error }
  }
}

/**
 * Adds a vote to a submission
 * @param {string} submissionId - Submission ID
 * @param {string} voterInfo - Voter identification (IP or session)
 * @returns {Promise<{data: any, error: Error|null}>} Vote result
 */
export const addVote = async (submissionId, voterInfo) => {
  try {
    const { data, error } = await supabase
      .from("votes")
      .insert([
        {
          submission_id: submissionId,
          voter_ip: voterInfo.ip,
          voter_session: voterInfo.session,
        },
      ])
      .select()

    if (!error) {
      // Update submission vote count
      await supabase.rpc("increment_votes", { submission_id: submissionId })
    }

    return { data, error }
  } catch (error) {
    console.error("Error adding vote:", error)
    return { data: null, error }
  }
}
