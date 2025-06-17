"use client"

import { Button } from "../components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "../contexts/form-context"
import "./home.css"

export default function LandingPage() {
  const { dispatch } = useForm()
  const [showSharePopup, setShowSharePopup] = useState(false);

  const handleStartSubmission = () => {
    dispatch({ type: "RESET_FORM" })
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Share Abby Open House',
        text: 'Share your vision at Abby Open House!',
        url: window.location.href
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  }

  return (
    <div>
      <div className="home-top">
        <div className="home-logos">
          <div className="abby-logo">
            <img src="./Logo.svg" alt="" />
          </div>
          <div className="abby-eye-icon">
            <svg width="30" height="30" viewBox="0 0 118 85" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M118 27.8086V41.1025L83.9443 35.4355C84.3354 37.3616 84.542 39.355 84.542 41.3955C84.542 44.2452 84.1333 46.9999 83.3857 49.6113L118 43.6787V57.0146L59 84.8242L0 57.0156V43.7227L34.0557 49.3887C33.6646 47.4626 33.458 45.4693 33.458 43.4287C33.458 40.579 33.8667 37.8243 34.6143 35.2129L0 41.1455V27.8096L59 0L118 27.8086ZM58.9512 29.918C52.0872 29.9182 46.5234 35.4827 46.5234 42.3467C46.5235 49.2107 52.0872 54.7752 58.9512 54.7754C58.9673 54.7754 58.9839 54.7745 59 54.7744C65.8418 54.7483 71.3798 49.1946 71.3799 42.3467C71.3799 35.4987 65.8419 29.9441 59 29.918C58.9839 29.9179 58.9673 29.918 58.9512 29.918Z" fill="#000000" />
            </svg>
          </div>
        </div>
        <h1 className="home-title">SHARE YOUR <br /> VISION</h1>
      </div>
      <div className="homepage">
        <p >See that screen in the <Link className="open-house-link" href="https://www.abbykortrijk.be/en/take-part/open-house" target="_blank" rel="noopener noreferrer">Open House</Link>? That's our live, interactive gallery.
          It's a space dedicated to showcasing what our community is passionate about,
          right on the museum floor.</p>
        <div className="home-img">
          <img src="./installation.jpg" alt="" />
        </div>
        <p>Share a project you're working on, and it will appear on the screen for visitors to discover.</p>
        <div className="home-buttons">
          <Link href="/profile" onClick={handleStartSubmission} className="start-button">
            Share a project
          </Link>
          <button
            className="friend-button"
            onClick={() => setShowSharePopup(true)}
          >
            Invite a friend to participate
          </button>
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
      </div>
    </div>
  );
}
