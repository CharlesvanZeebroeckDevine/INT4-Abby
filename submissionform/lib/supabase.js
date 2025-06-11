import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Profile Management
export const createProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        id: profileData.id, // Use the provided ID (generated in form-context)
        creator_name: profileData.creatorName,
        full_name: profileData.fullName,
        email: profileData.email,
        description: profileData.aboutYou,
        avatar_url: profileData.avatarUrl,
        avatar_color: profileData.avatarColor,
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

// Artwork Management
export const createArtwork = async (artworkData) => {
  try {
    const { data, error } = await supabase
      .from("artworks")
      .insert([{
        profile_id: artworkData.profile_id,
        title: artworkData.title,
        description: artworkData.description,
        category: artworkData.category,
        image_url: artworkData.image_url,
        include_process: artworkData.include_process,
        process_description: artworkData.process_description,
        process_images: artworkData.process_images,
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

// Voting function for the museum interface
export const addVote = async (profileId, voterEmail) => {
  try {
    const { data, error } = await supabase
      .from("votes")
      .insert([{ profile_id: profileId, voter_email: voterEmail }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Add vote error:", error)
    return { data: null, error }
  }
}

// File Upload
export const uploadFile = async (file, bucket, path, retries = 3) => {
  try {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
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
 * Saves submission data (profile and artworks)
 * @param {Object} submissionData - Submission data to save
 * @returns {Promise<{data: any, error: Error|null}>} Save result
 */
export async function saveSubmission(submissionData) {
  try {
    console.log("Attempting to save submission:", submissionData)

    // Generate a UUID for the profile
    const profileId = crypto.randomUUID()

    // Upload avatar image if present and valid
    let avatarUrl = null
    if (submissionData.avatar_image instanceof File && submissionData.avatar_image.name) {
      const avatarFile = submissionData.avatar_image
      const avatarFileName = avatarFile.name.replace(/\s/g, '_')
      const avatarPath = `${profileId}/avatar/${Date.now()}_${avatarFileName}`
      const { data: avatarData, error: avatarUploadError } = await uploadFile(avatarFile, "avatars", avatarPath)
      if (avatarUploadError) console.error("Avatar upload error:", avatarUploadError)
      avatarUrl = avatarData ? getFileUrl("avatars", avatarPath) : null
    } else if (submissionData.avatar_image) {
      console.warn("Avatar image provided is not a valid File object or is missing a name.", submissionData.avatar_image);
    }

    // Create the profile
    const { data: profile, error: profileError } = await createProfile({
      id: profileId,
      creatorName: submissionData.creator_name,
      fullName: submissionData.contact_name,
      email: submissionData.contact_email,
      aboutYou: submissionData.about_you,
      avatarUrl: avatarUrl, // Use the uploaded avatar URL
      avatarColor: submissionData.avatar_color,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      throw profileError
    }

    // Process and create artworks
    const artworkPromises = submissionData.artworks.map(async (artwork) => {
      // Upload artwork images
      let imageUrl = null
      if (artwork.images && artwork.images.length > 0) {
        const imageFile = artwork.images[0]
        const imagePath = `${profileId}/artworks/${Date.now()}_${imageFile.name.replace(/\s/g, '_')}`
        const { data: imageData, error: imageError } = await uploadFile(imageFile, "artworks", imagePath)
        if (imageError) console.error("Artwork image upload error:", imageError)
        imageUrl = imageData ? getFileUrl("artworks", imagePath) : null
      }

      // Upload process images
      const processImageUrls = []
      if (artwork.processImages && artwork.processImages.length > 0) {
        for (let i = 0; i < artwork.processImages.length; i++) {
          const processImageFile = artwork.processImages[i]
          const processPath = `${profileId}/process_images/${Date.now()}_${i}_${processImageFile.name.replace(/\s/g, '_')}`
          const { data: processData, error: processError } = await uploadFile(processImageFile, "artworks", processPath)
          if (processError) console.error("Process image upload error:", processError)
          if (processData) processImageUrls.push(getFileUrl("artworks", processPath))
        }
      }

      return createArtwork({
        profile_id: profile.id,
        title: artwork.title,
        description: artwork.description,
        category: artwork.category,
        image_url: imageUrl,
        include_process: artwork.include_process,
        process_description: artwork.process_description,
        process_images: processImageUrls,
      })
    })

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
