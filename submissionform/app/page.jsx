"use client"

import { Button } from "../components/ui/button"
import Link from "next/link"
import { useForm } from "../contexts/form-context"

export default function LandingPage() {
  const { dispatch } = useForm()

  const handleStartSubmission = () => {
    dispatch({ type: "RESET_FORM" })
  }

  return (
    <div>
      <h1>Welcome to Abby</h1>
      <p >Share your creative vision with the world.</p>
      <Link href="/profile" onClick={handleStartSubmission}>
        <Button>Start Your Submission</Button>
      </Link>
    </div>
  )
}
