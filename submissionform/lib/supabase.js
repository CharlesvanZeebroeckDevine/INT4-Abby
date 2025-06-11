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
    localStorage.setItem("user_email", email)

    // Get user data from profiles table
    const { data: profile, error } = await getProfile(email)

    if (profile) {
      // Save user session data for returning user flow
      saveUserSession({
        email: email,
        fullName: profile.real_name || "User",
        creatorName: profile.creator_name || "Creator",
        aboutYou: profile.description || "",
        avatarColor: profile.avatar_color || "#01A569",
      })

      localStorage.setItem("user_name", profile.real_name || "User")
      localStorage.setItem("creator_name", profile.creator_name || "Creator")
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

// Profile Management
export const createProfile = async (profileData, contactData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        id: user.id,
        creator_name: profileData.creatorName,
        full_name: contactData.fullName,
        description: profileData.aboutYou,
        avatar_url: profileData.avatarUrl,
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Create profile error:", error)
    return { data: null, error }
  }
}

export const getProfile = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Get profile error:", error)
    return { data: null, error }
  }
}

export const updateProfile = async (updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Update profile error:", error)
    return { data: null, error }
  }
}

// Artwork Management
export const createArtwork = async (artworkData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("artworks")
      .insert([{
        profile_id: user.id,
        ...artworkData
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Create artwork error:", error)
    return { data: null, error }
  }
}

export const getUserArtworks = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    return { data, error }
  } catch (error) {
    console.error("Get user artworks error:", error)
    return { data: null, error }
  }
}

export const updateArtwork = async (artworkId, updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from("artworks")
      .update(updates)
      .eq("id", artworkId)
      .eq("profile_id", user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Update artwork error:", error)
    return { data: null, error }
  }
}

export const deleteArtwork = async (artworkId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { error } = await supabase
      .from("artworks")
      .delete()
      .eq("id", artworkId)
      .eq("profile_id", user.id)

    return { error }
  } catch (error) {
    console.error("Delete artwork error:", error)
    return { error }
  }
}

// File Upload
export const uploadFile = async (file, bucket, path, retries = 3) => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    // Create path with user ID
    const userPath = `${user.id}/${path}`

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase.storage.from(bucket).upload(userPath, file, {
          cacheControl: "3600",
          upsert: true, // Allow overwriting existing files
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
  } catch (error) {
    console.error("Upload error:", error)
    return { data: null, error }
  }
}

export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Saves submission data with error handling and retry logic
 * @param {Object} submissionData - Submission data to save
 * @returns {Promise<{data: any, error: Error|null}>} Save result
 */
export async function saveSubmission(submissionData) {
  try {
    console.log("Attempting to save submission:", submissionData)

    // First create the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([{
        creator_name: submissionData.creator_name,
        full_name: submissionData.contact_name,
        description: submissionData.about_you,
        avatar_url: submissionData.avatar_image,
      }])
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      throw profileError
    }

    // Then create the artworks
    const artworkPromises = submissionData.artworks.map(artwork =>
      supabase
        .from("artworks")
        .insert([{
          profile_id: profile.id,
          title: artwork.title,
          description: artwork.description,
          image_url: artwork.images[0] || null,
          process_images: artwork.processImages || [],
        }])
        .select()
        .single()
    )

    const artworkResults = await Promise.all(artworkPromises)
    const artworkErrors = artworkResults.filter(result => result.error)

    if (artworkErrors.length > 0) {
      console.error("Artwork creation errors:", artworkErrors)
      throw new Error("Failed to create some artworks")
    }

    console.log("Submission saved successfully:", { profile, artworks: artworkResults })
    return { data: { profile, artworks: artworkResults }, error: null }
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
