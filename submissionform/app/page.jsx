"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Layout } from "../components/layout"
import { Modal } from "../components/ui/modal"
import "./page.css"

export default function LandingPage() {
  const router = useRouter()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInviteFriend = () => {
    if (!friendEmail || !friendEmail.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    console.log("Inviting friend:", friendEmail)
    setFriendEmail("")
    setShareDialogOpen(false)
    setError("")
  }

  const handleLogin = async () => {
    try {
      if (!loginEmail || !loginEmail.includes("@")) {
        setError("Please enter a valid email address")
        return
      }

      setIsLoading(true)

      // Simple email-only login
      const { signInWithEmail } = await import("../lib/supabase")
      const { error } = await signInWithEmail(loginEmail)

      if (error) {
        setError("Login failed: " + error.message)
        return
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    router.push("/profile")
  }

  return (
    <Layout isLandingPage={true} onNext={handleNext} nextButtonText="Share your story">
      <div className="abby-landing">
        <h1 className="abby-landing-title">
          SHARE YOUR
          VISION
        </h1>

        <div className="abby-landing-description">
          <p>
            At Abby we are very interested in finding new talent!
            <br />
            You get a chance to join <span className="abby-highlight">Abby Open House</span> a place for collaboration.
          </p>

          <p>Visitors vote for their favorite creation, we then get in contact to organize something with you.</p>
        </div>

        {/* Installation Preview */}
        <div className="abby-installation-preview">
          <p>Picture of installation</p>
        </div>

        {/* Action Buttons */}
        <div className="abby-landing-actions">
          <Button className="abby-button-full abby-button-large" onClick={() => setShareDialogOpen(true)}>
            Invite a friend
          </Button>
        </div>

        {/* Login Link */}
        <div className="abby-login-section">
          <button className="abby-login-link" onClick={() => setLoginDialogOpen(true)}>
            Already submitted? Access your dashboard
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        title="Invite a friend to share their vision"
        description="Enter your friend's email address to invite them to share their vision with Abby."
      >
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <Input
            type="email"
            placeholder="friend@example.com"
            value={friendEmail}
            onChange={(e) => {
              setFriendEmail(e.target.value)
              setError("")
            }}
          />
          <Button onClick={handleInviteFriend} className="modal-button">
            Send Invitation
          </Button>
        </div>
      </Modal>

      {/* Login Modal */}
      <Modal
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        title="Access your dashboard"
        description="Enter your email address to access your submission dashboard."
      >
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <Input
            type="email"
            placeholder="your@email.com"
            value={loginEmail}
            onChange={(e) => {
              setLoginEmail(e.target.value)
              setError("")
            }}
          />
          <Button onClick={handleLogin} className="modal-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Continue"}
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
