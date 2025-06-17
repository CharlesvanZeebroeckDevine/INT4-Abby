"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { useForm } from "../../contexts/form-context"
import { Layout } from "../../components/layout"

export default function SuccessPage() {
  const { state } = useForm()
  const [showSharePopup, setShowSharePopup] = useState(false);

  return (

    <Layout title="SUCCESS!" subtitle="Your story is now part of the creative reflection at Abby" currentStep={4}>
      <div className="abby-success-page">
        <div className="abby-next-steps">
          <h3 className="abby-next-steps-title">What happens next?</h3>
          <div className="abby-steps-list">
            <div className="abby-step step-1">
              <div className="abby-step-number abby-step-blue ">1</div>
              <div className="abby-step-content">
                <h4 className="abby-step-title">Review Process</h4>
                <p className="abby-step-description">Our team will review your submission within 2-3 days</p>
              </div>
            </div>
            <div className="abby-step step-2">
              <div className="abby-step-number abby-step-yellow">2</div>
              <div className="abby-step-content">
                <h4 className="abby-step-title">Public Voting</h4>
                <p className="abby-step-description">
                  Your artwork will be displayed for public voting in the Open House
                </p>
              </div>
            </div>
            <div className="abby-step step-3">
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

        <div className="abby-success-actions">
          <button
            className="friend-button"
            onClick={() => setShowSharePopup(true)}>
            Invite a friend to participate
          </button>
        </div>

        <h2 className="submission-recap-title">Your submission recap</h2>

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
                    <span className="abby-artwork-category">{artwork.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}

      </div>

      {showSharePopup && (
        <div className="share-popup">
          <div className="share-popup-header">
            <h2>Invite a friend to participate</h2>
            <button
              className="close-button"
              onClick={() => setShowSharePopup(false)}
            >
              &times;
            </button>
          </div>
          <div className="share-icons">
            <div className="icon-placeholder facebook" />
            <div className="icon-placeholder whatsapp" />
            <div className="icon-placeholder instagram" />
            <div className="icon-placeholder imessage" />
            <div className="icon-placeholder more" />
          </div>
        </div>
      )}

    </Layout>



  )
}
