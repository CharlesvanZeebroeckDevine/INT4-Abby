"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { useForm } from "../../contexts/form-context"
import { Layout } from "../../components/ui/layout"

export default function SuccessPage() {
  const { state } = useForm()
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share/${Date.now()}`)
  }, [])

  const handleShare = async () => {
    const shareData = {
      title: `Check out my creative submission: ${state.artworks[0]?.title || "My Artwork"}`,
      text: `I just shared my vision at Abby museum! Created by ${state.profile.creatorName}`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Error sharing:", error)
        fallbackShare(shareData)
      }
    } else {
      fallbackShare(shareData)
    }
  }

  const fallbackShare = (shareData) => {
    navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
    alert("Share text copied to clipboard!")
  }

  const handleDownload = () => {
    const submissionSummary = {
      creator: state.profile.creatorName,
      about: state.profile.aboutYou,
      artworks: state.artworks.map((artwork) => ({
        title: artwork.title,
        description: artwork.description,
        category: artwork.category,
      })),
      submittedAt: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(submissionSummary, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${state.profile.creatorName.replace(/\s+/g, "_")}_submission.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="SUCCESS!" subtitle="Your story is now part of the creative reflection at Abby" currentStep={4}>
      <div className="abby-success-page">
        <h1>Succes!</h1>
        <p>Your story is now apart of the creative reflection at abby</p>
        {/* Submission Preview */}
        <div className="abby-submission-preview">
          <div className="abby-creator-info">
            {state.profile.avatar_url && (
              <div className="abby-avatar-thumbnail">
                <img
                  src={state.profile.avatar_url || "/placeholder.svg"}
                  alt="Eye avatar"
                  className="abby-eye-preview-image"
                />
              </div>
            )}
            <div className="abby-creator-details">
              <h3 className="abby-creator-name">{state.profile.creatorName}</h3>
              <p className="abby-creator-about">{state.profile.aboutYou}</p>
            </div>
          </div>

          <div className="abby-artworks-preview">
            <h4 className="abby-artworks-title">Your Artworks ({state.artworks.length})</h4>
            {state.artworks.map((artwork, index) => (
              <div key={index} className="abby-artwork-preview">
                <div className="abby-artwork-preview-content">
                  {artwork.image_url && (
                    <div className="abby-artwork-image">
                      <img src={artwork.image_url || "/placeholder.svg"} alt={artwork.title} />
                    </div>
                  )}
                  <div className="abby-artwork-info">
                    <h5 className="abby-artwork-preview-title">{artwork.title}</h5>
                    <p className="abby-artwork-preview-description">{artwork.description}</p>
                    <span className="abby-artwork-category">{artwork.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="abby-success-actions">
          <Button onClick={handleShare} className="abby-button-full">
            Share Submission
          </Button>

          <Button onClick={handleDownload} variant="outline" className="abby-button-full abby-button-outline">
            Download Summary
          </Button>
        </div>

        {/* Next Steps */}
        <div className="abby-next-steps">
          <h3 className="abby-next-steps-title">What happens next?</h3>
          <div className="abby-steps-list">
            <div className="abby-step">
              <div className="abby-step-number abby-step-yellow">1</div>
              <div className="abby-step-content">
                <h4 className="abby-step-title">Review Process</h4>
                <p className="abby-step-description">Our team will review your submission within 2-3 business days</p>
              </div>
            </div>
            <div className="abby-step">
              <div className="abby-step-number abby-step-blue">2</div>
              <div className="abby-step-content">
                <h4 className="abby-step-title">Public Voting</h4>
                <p className="abby-step-description">
                  Your artwork will be displayed for public voting during the exhibition
                </p>
              </div>
            </div>
            <div className="abby-step">
              <div className="abby-step-number abby-step-purple">3</div>
              <div className="abby-step-content">
                <h4 className="abby-step-title">Get in Touch</h4>
                <p className="abby-step-description">
                  We'll contact you about collaboration opportunities based on voting results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
