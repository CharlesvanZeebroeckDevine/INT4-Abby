"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { useForm } from "../../../contexts/form-context"
import { Layout } from "../../../components/layout"
import "./align.css"

export default function AlignPage() {
    const router = useRouter()
    const { state, dispatch } = useForm()
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)
    const imageRef = useRef(null)
    const loadedImageRef = useRef(null) // Ref to hold the loaded Image object

    // Initialize local states from form context or defaults
    const [scale, setScale] = useState(state.avatar.scale || 1)
    const [panX, setPanX] = useState(state.avatar.panX || 0)
    const [panY, setPanY] = useState(state.avatar.panY || 0)

    const CONTAINER_SIZE = 300
    const MIN_INITIAL_SCALE = 0.5 // Minimum allowed scale factor relative to its 'fit' size
    const MAX_SCALE = 5           // Maximum allowed scale factor (e.g., 5x the initial fit)

    // Effect to load image and calculate initial scale/pan on mount or when eyeImage changes
    useEffect(() => {
        if (state.avatar.eyeImage) {
            const img = new Image()
            img.src = URL.createObjectURL(state.avatar.eyeImage)
            img.onload = () => {
                loadedImageRef.current = img

                const imgWidth = img.naturalWidth
                const imgHeight = img.naturalHeight

                // Calculate initial scale to fit image within CONTAINER_SIZE
                const fitScale = Math.min(CONTAINER_SIZE / imgWidth, CONTAINER_SIZE / imgHeight)
                const initialScale = Math.max(fitScale, MIN_INITIAL_SCALE); // Ensure it's at least MIN_INITIAL_SCALE

                setScale(state.avatar.scale || initialScale)
                setPanX(state.avatar.panX || 0)
                setPanY(state.avatar.panY || 0)
            }
            img.onerror = () => {
                console.error("Failed to load image for alignment.")
                loadedImageRef.current = null
            }
        } else {
            loadedImageRef.current = null
            setScale(1)
            setPanX(0)
            setPanY(0)
        }
    }, [state.avatar.eyeImage, MIN_INITIAL_SCALE])

    // Calculate bounds for panning
    const calculateBounds = useCallback((currentPanX, currentPanY, currentScale) => {
        const img = loadedImageRef.current
        if (!img) return { x: currentPanX, y: currentPanY }

        const imgWidth = img.naturalWidth
        const imgHeight = img.naturalHeight
        const scaledWidth = imgWidth * currentScale
        const scaledHeight = imgHeight * currentScale

        // If image is smaller than container, prevent panning (keep centered)
        if (scaledWidth <= CONTAINER_SIZE && scaledHeight <= CONTAINER_SIZE) {
            return { x: 0, y: 0 }
        }

        // Calculate max pan distance from center to edge of container
        const maxPanX = Math.max(0, (scaledWidth - CONTAINER_SIZE) / 2)
        const maxPanY = Math.max(0, (scaledHeight - CONTAINER_SIZE) / 2)

        // Clamp pan values within bounds
        const newX = Math.max(-maxPanX, Math.min(maxPanX, currentPanX))
        const newY = Math.max(-maxPanY, Math.min(maxPanY, currentPanY))

        return { x: newX, y: newY }
    }, [CONTAINER_SIZE])

    // Generic function to get coordinates from mouse or touch event
    const getCoords = (event) => {
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY }
        } else {
            return { x: event.clientX, y: event.clientY }
        }
    }

    // Handle drag/touch start
    const handleStart = useCallback((event) => {
        event.preventDefault()
        if (!loadedImageRef.current) return
        setIsDragging(true)
        const rect = containerRef.current.getBoundingClientRect()
        const { x, y } = getCoords(event)
        setDragStart({
            x: x - rect.left - panX,
            y: y - rect.top - panY
        })
    }, [panX, panY])

    // Handle drag/touch move
    const handleMove = useCallback((event) => {
        if (!isDragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const { x: currentX, y: currentY } = getCoords(event)
        const newX = currentX - rect.left - dragStart.x
        const newY = currentY - rect.top - dragStart.y

        const { x, y } = calculateBounds(newX, newY, scale)
        setPanX(x)
        setPanY(y)

        console.log(`Pan: ${x}, ${y} Scale: ${scale}`)
    }, [isDragging, dragStart, scale, calculateBounds])

    // Handle drag/touch end
    const handleEnd = useCallback(() => {
        if (!isDragging) return
        setIsDragging(false)
        console.log("Drag End: Persisting state.")
        dispatch({
            type: "UPDATE_AVATAR",
            payload: {
                scale,
                panX,
                panY,
                selectedColor: state.avatar.selectedColor,
                eyeImage: state.avatar.eyeImage
            }
        })
    }, [isDragging, scale, panX, panY, state.avatar.selectedColor, state.avatar.eyeImage, dispatch])

    // Handle zoom
    const handleWheel = useCallback((e) => {
        if (!loadedImageRef.current) return
        e.preventDefault()

        const delta = e.deltaY < 0 ? 0.1 : -0.1 // Invert scroll direction for more natural zoom
        const newScale = Math.max(MIN_INITIAL_SCALE, Math.min(MAX_SCALE, scale + delta))

        // Calculate new pan position to zoom towards mouse position
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const scaleRatio = newScale / scale
        let newPanX = mouseX - (mouseX - panX) * scaleRatio
        let newPanY = mouseY - (mouseY - panY) * scaleRatio

        const { x, y } = calculateBounds(newPanX, newPanY, newScale)

        setScale(newScale)
        setPanX(x)
        setPanY(y)

        console.log(`Zoom: Scale: ${newScale}, Pan: ${x}, ${y}`)

        dispatch({
            type: "UPDATE_AVATAR",
            payload: {
                scale: newScale,
                panX: x,
                panY: y,
                selectedColor: state.avatar.selectedColor,
                eyeImage: state.avatar.eyeImage
            }
        })
    }, [scale, panX, panY, MIN_INITIAL_SCALE, MAX_SCALE, calculateBounds, dispatch])

    // Add event listeners using useEffect
    useEffect(() => {
        const container = containerRef.current
        if (container) {
            console.log("Adding event listeners.")
            container.addEventListener('mousedown', handleStart)
            container.addEventListener('mousemove', handleMove)
            container.addEventListener('mouseup', handleEnd)
            container.addEventListener('touchstart', handleStart, { passive: false })
            container.addEventListener('touchmove', handleMove, { passive: false })
            container.addEventListener('touchend', handleEnd)
            container.addEventListener('wheel', handleWheel, { passive: false })

            return () => {
                console.log("Removing event listeners.")
                container.removeEventListener('mousedown', handleStart)
                container.removeEventListener('mousemove', handleMove)
                container.removeEventListener('mouseup', handleEnd)
                container.removeEventListener('touchstart', handleStart)
                container.removeEventListener('touchmove', handleMove)
                container.removeEventListener('touchend', handleEnd)
                container.removeEventListener('wheel', handleWheel)
            }
        }
    }, [handleStart, handleMove, handleEnd, handleWheel])

    const handleNext = () => {
        if (!state.avatar.eyeImage) {
            alert("Please capture your eye avatar first")
            return
        }
        router.push("/avatar/color")
    }

    const handlePrevious = () => {
        router.push("/avatar/upload")
    }

    const handleRetake = () => {
        if (state.avatar.eyeImage instanceof File) {
            URL.revokeObjectURL(URL.createObjectURL(state.avatar.eyeImage))
        }
        dispatch({
            type: "UPDATE_AVATAR",
            payload: {
                eyeImage: null,
                scale: 1,
                panX: 0,
                panY: 0,
                selectedColor: "#01A569"
            }
        })
        router.push("/avatar/upload")
    }

    return (
        <Layout
            title="YOUR EYE AVATAR"
            subtitle="Align your eye inside the shape"
            currentStep={2}
            totalSteps={4}
            onPrevious={handlePrevious}
            onNext={handleNext}
            disableNext={!state.avatar.eyeImage}
        >
            <div className="eye-align">
                <div
                    ref={containerRef}
                    className="preview-container"
                >
                    {state.avatar.eyeImage ? (
                        <img
                            ref={imageRef}
                            src={loadedImageRef.current ? loadedImageRef.current.src : ""} // Use loadedImageRef.current.src
                            alt="Eye avatar"
                            className="preview-image"
                            style={{ transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})` }}
                        />
                    ) : (
                        <div>No image selected</div>
                    )}
                    <div className="guide-overlay">
                        <img src="/Eye.svg" alt="Eye guide" className="eye-guide-svg" />
                    </div>
                </div>

                <div className="zoom-controls">
                    <button
                        className="zoom-button"
                        onClick={() => {
                            const newScale = Math.max(MIN_INITIAL_SCALE, scale - 0.1)
                            setScale(newScale)
                            dispatch({
                                type: "UPDATE_AVATAR",
                                payload: {
                                    scale: newScale,
                                    panX,
                                    panY,
                                    selectedColor: state.avatar.selectedColor,
                                    eyeImage: state.avatar.eyeImage
                                }
                            })
                        }}
                    >
                        -
                    </button>
                    <span className="zoom-level">{Math.round(scale * 100)}%</span>
                    <button
                        className="zoom-button"
                        onClick={() => {
                            const newScale = Math.min(MAX_SCALE, scale + 0.1)
                            setScale(newScale)
                            dispatch({
                                type: "UPDATE_AVATAR",
                                payload: {
                                    scale: newScale,
                                    panX,
                                    panY,
                                    selectedColor: state.avatar.selectedColor,
                                    eyeImage: state.avatar.eyeImage
                                }
                            })
                        }}
                    >
                        +
                    </button>
                </div>

                <Button
                    variant="outline"
                    onClick={handleRetake}
                    className="retake-button"
                >
                    Retake picture
                </Button>
            </div>
        </Layout>
    )
} 