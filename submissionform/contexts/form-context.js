"use client"

import { createContext, useContext, useReducer } from "react"
import { storeFormProgress, getFormProgress, clearFormProgress } from "../lib/offline-manager"
import { createProfile, createArtwork, saveSubmission } from "../lib/supabase"

const FormContext = createContext()

/**
 * Gets initial state from localStorage or returns default
 */
const getInitialState = () => {
  // Try to load saved state from localStorage
  if (typeof window !== "undefined") {
    const savedState = getFormProgress()
    if (savedState) {
      console.log("Restored form progress from localStorage")
      return {
        ...savedState,
        // Reset submission state
        isSubmitting: false,
        errors: {},
      }
    }
  }

  // Default initial state
  return {
    currentStep: 0,
    profile: {
      creatorName: "",
      aboutYou: "",
      fullName: "",
      email: "",
    },
    avatar: {
      eyeImage: null,
      selectedColor: "#01A569",
      scale: 1,
      panX: 0,
      panY: 0,
    },
    artworks: [],
    isSubmitting: false,
    isOffline: false,
    errors: {},
    lastUpdated: null,
  }
}

/**
 * Form reducer with automatic persistence
 */
function formReducer(state, action) {
  let newState

  switch (action.type) {
    case "SET_STEP":
      newState = { ...state, currentStep: action.payload }
      break
    case "UPDATE_PROFILE":
      newState = { ...state, profile: { ...state.profile, ...action.payload } }
      break
    case "UPDATE_AVATAR":
      newState = { ...state, avatar: { ...state.avatar, ...action.payload } }
      break
    case "ADD_ARTWORK":
      newState = { ...state, artworks: [...state.artworks, action.payload] }
      break
    case "UPDATE_ARTWORK":
      newState = {
        ...state,
        artworks: state.artworks.map((artwork, index) =>
          index === action.index ? { ...artwork, ...action.payload } : artwork,
        ),
      }
      break
    case "REMOVE_ARTWORK":
      newState = {
        ...state,
        artworks: state.artworks.filter((_, index) => index !== action.index),
      }
      break
    case "SET_SUBMITTING":
      newState = { ...state, isSubmitting: action.payload }
      break
    case "SET_OFFLINE_MODE":
      newState = { ...state, isOffline: action.payload }
      break
    case "SET_ERRORS":
      newState = { ...state, errors: action.payload }
      break
    case "CLEAR_ERRORS":
      newState = { ...state, errors: {} }
      break
    case "RESET_FORM":
      if (typeof window !== "undefined") {
        clearFormProgress()
      }
      return getInitialState()
    case "RESTORE_FROM_STORAGE":
      return { ...state, ...action.payload }
    default:
      return state
  }

  // Add timestamp
  newState.lastUpdated = new Date().toISOString()

  // Persist to localStorage (excluding File objects and functions)
  if (typeof window !== "undefined" && action.type !== "SET_SUBMITTING") {
    const stateForStorage = { ...newState }

    // Don't try to serialize File objects
    if (stateForStorage.avatar?.eyeImage instanceof File) {
      stateForStorage.avatar = { ...stateForStorage.avatar, eyeImage: null }
    }

    // Handle artwork files
    if (stateForStorage.artworks?.length) {
      stateForStorage.artworks = stateForStorage.artworks.map((artwork) => {
        const newArtwork = { ...artwork }

        // Safely handle images array
        if (Array.isArray(newArtwork.images) && newArtwork.images.length > 0) {
          if (newArtwork.images.some((img) => img instanceof File)) {
            newArtwork.images = []
          }
        } else {
          // Ensure images is always an array
          newArtwork.images = []
        }

        // Safely handle processImages array
        if (Array.isArray(newArtwork.processImages) && newArtwork.processImages.length > 0) {
          if (newArtwork.processImages.some((img) => img instanceof File)) {
            newArtwork.processImages = []
          }
        } else {
          // Ensure processImages is always an array
          newArtwork.processImages = []
        }

        return newArtwork
      })
    }

    storeFormProgress(stateForStorage)
  }

  return newState
}

/**
 * Form context provider with persistence
 */
export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, null, getInitialState)

  // Enhanced dispatch with error handling
  const enhancedDispatch = (action) => {
    try {
      dispatch(action)
    } catch (error) {
      console.error("Error in form dispatch:", error)
      dispatch({
        type: "SET_ERRORS",
        payload: { form: "An error occurred while updating the form" },
      })
    }
  }

  // Submit form data to Supabase
  const submitForm = async () => {
    try {
      dispatch({ type: "SET_SUBMITTING", payload: true })
      dispatch({ type: "CLEAR_ERRORS" })

      const submissionData = {
        creator_name: state.profile.creatorName,
        about_you: state.profile.aboutYou,
        contact_name: state.profile.fullName,
        contact_email: state.profile.email,
        avatar_image: state.avatar.eyeImage,
        avatar_color: state.avatar.selectedColor,
        avatar_scale: state.avatar.scale,
        avatar_panX: state.avatar.panX,
        avatar_panY: state.avatar.panY,
        artworks: state.artworks.map(artwork => ({
          title: artwork.title,
          description: artwork.description,
          images: artwork.images,
          processImages: artwork.processImages || [],
          category: artwork.category,
          include_process: artwork.includeProcess,
          process_description: artwork.processDescription,
        })),
      }

      const { data, error } = await saveSubmission(submissionData)

      if (error) throw error

      // Do NOT clear form immediately, let SuccessPage consume data
      // dispatch({ type: "RESET_FORM" })
      return { success: true, data }
    } catch (error) {
      console.error("Form submission error:", error)
      dispatch({
        type: "SET_ERRORS",
        payload: { submit: error.message || "Failed to submit form" },
      })
      return { success: false, error }
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false })
    }
  }

  return (
    <FormContext.Provider value={{ state, dispatch: enhancedDispatch, submitForm }}>
      {children}
    </FormContext.Provider>
  )
}

/**
 * Hook to use form context
 */
export function useForm() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error("useForm must be used within a FormProvider")
  }
  return context
}
