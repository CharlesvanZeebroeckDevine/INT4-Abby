import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hxzbgvaqcczbrzlgcssb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4emJndmFxY2N6YnJ6bGdjc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI1MzUsImV4cCI6MjA2NTIyODUzNX0.1pxdy6UV_tajvFsRta79osq8gVGAbPT2cbFIOyNDpXY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service functions for the installation

/**
 * Fetch all profiles with their artworks
 * Returns profiles in random order for the carousel
 */
export const fetchAllProfiles = async () => {
    try {
        console.log('Loading profiles...')

        const { data, error } = await supabase
            .from('profiles')
            .select(`
        id,
        creator_name,
        full_name,
        avatar_url,
        description,
        artworks (
          id,
          title,
          description,
          category,
          image_url,
          include_process,
          process_description,
          process_images
        )
      `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching profiles:', error)
            return { data: [], error }
        }

        console.log(`Loaded ${data.length} profiles`)
        return { data, error: null }

    } catch (error) {
        console.error('Fetch profiles error:', error)
        return { data: [], error }
    }
}

/**
 * Fetch profiles filtered by category
 * Used for the "See All" page with category filtering
 */
export const fetchProfilesByCategory = async (category = null) => {
    try {
        console.log('Loading profiles by category:', category)

        let query = supabase
            .from('profiles')
            .select(`
        id,
        creator_name,
        full_name,
        avatar_url,
        description,
        artworks (
          id,
          title,
          description,
          category,
          image_url,
          include_process,
          process_description,
          process_images
        )
      `)

        // Filter by category if specified
        if (category && category !== 'all') {
            query = query.eq('artworks.category', category)
        }

        const { data, error } = await query.order('creator_name', { ascending: true })

        if (error) {
            console.error('Error fetching profiles by category:', error)
            return { data: [], error }
        }

        console.log(`Loaded ${data.length} profiles for category: ${category || 'all'}`)
        return { data, error: null }

    } catch (error) {
        console.error('Fetch profiles by category error:', error)
        return { data: [], error }
    }
}

/**
 * Get all unique categories from artworks
 * Used for category filtering
 */
export const fetchCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('artworks')
            .select('category')
            .not('category', 'is', null)

        if (error) {
            console.error('Error fetching categories:', error)
            return { data: [], error }
        }

        // Get unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean)

        return { data: uniqueCategories, error: null }

    } catch (error) {
        console.error('Fetch categories error:', error)
        return { data: [], error }
    }
}

/**
 * Submit a vote for a profile
 */
export const submitVote = async (profileId, voterEmail, receiveUpdates = false) => {
    try {
        console.log('Submitting vote:', { profileId, voterEmail, receiveUpdates })

        const { data, error } = await supabase
            .from('votes')
            .insert([{
                profile_id: profileId,
                voter_email: voterEmail
            }])
            .select()
            .single()

        if (error) {
            console.error('Error submitting vote:', error)
            return { data: null, error }
        }

        console.log('Vote submitted successfully:', data)
        return { data, error: null }

    } catch (error) {
        console.error('Submit vote error:', error)
        return { data: null, error }
    }
}

/**
 * Get vote count for a profile (optional - for admin use)
 */
export const getVoteCount = async (profileId) => {
    try {
        const { count, error } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profileId)

        if (error) {
            console.error('Error getting vote count:', error)
            return { count: 0, error }
        }

        return { count, error: null }

    } catch (error) {
        console.error('Get vote count error:', error)
        return { count: 0, error }
    }
}