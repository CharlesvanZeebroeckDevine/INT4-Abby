"use client"

import { useRouter } from "next/navigation"
import { useForm } from "../../../contexts/form-context"
import { Layout } from "../../../components/layout"
import "./upload.css"

export default function UploadPage() {
    const router = useRouter()
    const { state, dispatch } = useForm()

    const handleImageCapture = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            // Revoke previous object URL if it exists to prevent memory leaks
            if (state.avatar.eyeImage instanceof File) {
                URL.revokeObjectURL(URL.createObjectURL(state.avatar.eyeImage))
            }

            dispatch({
                type: "UPDATE_AVATAR",
                payload: {
                    eyeImage: selectedFile,
                    scale: 1,
                    panX: 0,
                    panY: 0,
                    selectedColor: "#01A569"
                }
            })
            router.push("/avatar/align")
        }
    }

    const handlePrevious = () => {
        router.push("/profile")
    }

    const handleSkip = () => {
        router.push("/artwork")
    }

    return (
        <Layout
            title="YOUR EYE AVATAR"
            subtitle="Let's give your story an eye!"
            currentStep={2}
            totalSteps={4}
            onPrevious={handlePrevious}
            showSkip={true}
            onSkip={handleSkip}
        >
            <div className="eye-upload">
                <div
                    className="eye-upload-container"
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <svg width="118" height="60" viewBox="0 0 118 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M118 27.8086V41.1025L83.9443 35.4355C84.3354 37.3616 84.542 39.355 84.542 41.3955C84.542 44.2452 84.1333 46.9999 83.3857 49.6113L118 43.6787V57.0146L59 84.8242L0 57.0156V43.7227L34.0557 49.3887C33.6646 47.4626 33.458 45.4693 33.458 43.4287C33.458 40.579 33.8667 37.8243 34.6143 35.2129L0 41.1455V27.8096L59 0L118 27.8086ZM58.9512 29.918C52.0872 29.9182 46.5234 35.4827 46.5234 42.3467C46.5235 49.2107 52.0872 54.7752 58.9512 54.7754C58.9673 54.7754 58.9839 54.7745 59 54.7744C65.8418 54.7483 71.3798 49.1946 71.3799 42.3467C71.3799 35.4987 65.8419 29.9441 59 29.918C58.9839 29.9179 58.9673 29.918 58.9512 29.918Z" fill="#FF5F02" />
                    </svg>
                    <p className="eye-upload-text">Tap to take a picture</p>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageCapture}
                        className="eye-upload-input"
                    />
                </div>
            </div>

            <div className="ipad-container">
                <p>Your eye will act as your profile picture at the Open House voting station</p>
                <div className="ipad-mockup">
                    <img src="../../../ipadmockup.png" alt="" />
                </div>
            </div>
        </Layout>
    )
} 