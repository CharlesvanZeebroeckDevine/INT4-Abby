"use client"

import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { useForm } from "../../../contexts/form-context"
import { Layout } from "../../../components/layout"
import { useRef, useEffect, useCallback } from "react"
import "./color.css"

export default function ColorPage() {
    const router = useRouter()
    const { state, dispatch, submitForm } = useForm()
    const canvasRef = useRef(null)
    const avatarImageRef = useRef(null)

    const CONTAINER_SIZE = 300
    const MIN_SCALE = 0.5
    const MAX_SCALE = 3

    useEffect(() => {
        if (state.avatar.eyeImage) {
            const img = new Image()
            img.src = URL.createObjectURL(state.avatar.eyeImage)
            img.onload = () => {
                avatarImageRef.current = img
                drawAvatar()
            }
            img.onerror = () => {
                console.error("Failed to load avatar image for canvas.")
                avatarImageRef.current = null
                drawAvatar()
            }
        } else {
            avatarImageRef.current = null
            drawAvatar()
        }
    }, [state.avatar.eyeImage])

    const drawAvatar = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = CONTAINER_SIZE
        canvas.height = CONTAINER_SIZE

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw background color
        ctx.fillStyle = state.avatar.selectedColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (avatarImageRef.current) {
            ctx.save()

            // --- Clipping Path setup ---
            ctx.beginPath()

            // Original SVG viewBox dimensions for scaling the path from EyeMask.svg
            const originalSvgWidth = 461
            const originalSvgHeight = 331

            // Calculate scale factors to make the mask 70% of the container size (matching align page)
            const targetMaskSize = CONTAINER_SIZE * 0.7
            const maskScale = Math.min(targetMaskSize / originalSvgWidth, targetMaskSize / originalSvgHeight)

            // Calculate the actual scaled dimensions of the mask
            const scaledMaskWidth = originalSvgWidth * maskScale
            const scaledMaskHeight = originalSvgHeight * maskScale

            // Calculate translation to center the scaled mask within the 300x300 container
            const translateX = (CONTAINER_SIZE - scaledMaskWidth) / 2
            const translateY = (CONTAINER_SIZE - scaledMaskHeight) / 2

            // Manually draw the path coordinates from EyeMask.svg, scaled and translated
            ctx.moveTo(230.498 * maskScale + translateX, 330.996 * maskScale + translateY)
            ctx.lineTo(0 * maskScale + translateX, 222.481 * maskScale + translateY)
            ctx.lineTo(0 * maskScale + translateX, 108.519 * maskScale + translateY)
            ctx.lineTo(230.498 * maskScale + translateX, 0 * maskScale + translateY)
            ctx.lineTo(461 * maskScale + translateX, 108.51 * maskScale + translateY)
            ctx.lineTo(461 * maskScale + translateX, 222.473 * maskScale + translateY)
            ctx.closePath()

            ctx.clip() // Apply the clipping path
            // --- End Clipping Path ---

            // Draw the image, applying transformations
            const img = avatarImageRef.current
            const imgWidth = img.naturalWidth
            const imgHeight = img.naturalHeight

            // Calculate scaled and panned position for the image
            const scaledWidth = imgWidth * state.avatar.scale
            const scaledHeight = imgHeight * state.avatar.scale

            // Calculate the center of the container (where the mask is centered)
            const containerCenterX = CONTAINER_SIZE / 2
            const containerCenterY = CONTAINER_SIZE / 2

            // Calculate image position so its center aligns with container center, then apply pan
            const imgCenterX = containerCenterX + state.avatar.panX
            const imgCenterY = containerCenterY + state.avatar.panY

            const displayX = imgCenterX - (scaledWidth / 2)
            const displayY = imgCenterY - (scaledHeight / 2)

            ctx.drawImage(img, displayX, displayY, scaledWidth, scaledHeight)

            ctx.restore()
        } else {
            // If no image, ensure canvas is just background color
            // The clearRect and fillRect above already handle this.
        }
    }, [state.avatar.scale, state.avatar.panX, state.avatar.panY, state.avatar.selectedColor, avatarImageRef.current])

    useEffect(() => {
        drawAvatar()
    }, [drawAvatar])

    const handleColorSelect = (color) => {
        dispatch({
            type: "UPDATE_AVATAR",
            payload: {
                selectedColor: color,
                scale: state.avatar.scale,
                panX: state.avatar.panX,
                panY: state.avatar.panY,
                eyeImage: state.avatar.eyeImage
            }
        })
    }

    const exportAvatar = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            console.error("Canvas not found for export.")
            return null
        }
        return new Promise(resolve => {
            canvas.toBlob((blob) => {
                resolve(blob)
            }, "image/png", 1.0)
        })
    }, [])

    const handleNext = async () => {
        if (!state.avatar.eyeImage) {
            alert("Please capture your eye avatar first")
            return
        }

        const exportedAvatarBlob = await exportAvatar()
        if (exportedAvatarBlob) {
            console.log("Exported Avatar Blob:", exportedAvatarBlob)
            // Store the exported blob in form state instead of submitting
            dispatch({
                type: "UPDATE_AVATAR",
                payload: {
                    ...state.avatar,
                    exportedFile: exportedAvatarBlob
                }
            })
            router.push("/artwork")
        } else {
            alert("Failed to export avatar image.")
        }
    }

    const handlePrevious = () => {
        router.push("/avatar/align")
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
            subtitle="Select your color now!"
            currentStep={2}
            totalSteps={4}
            onPrevious={handlePrevious}
            onNext={handleNext}
            disableNext={!state.avatar.eyeImage}
        >
            <div className="eye-color">
                <div
                    className="preview-container"
                    style={{
                        backgroundColor: state.avatar.selectedColor,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="preview-canvas"
                    />
                </div>

                <div className="color-selector">
                    {[
                        { name: "Red", value: "#FF5F02" },
                        { name: "Blue", value: "#5F90FF" },
                        { name: "Purple", value: "#BA7CD1" },
                        { name: "Green", value: "#01A569" },
                        { name: "Yellow", value: "#FFBF50" },
                    ].map((color) => (
                        <button
                            key={color.value}
                            className={`color-option ${state.avatar.selectedColor === color.value ? "selected" : ""}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => handleColorSelect(color.value)}
                            aria-label={`Select ${color.name} color`}
                            aria-pressed={state.avatar.selectedColor === color.value}
                        />
                    ))}
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