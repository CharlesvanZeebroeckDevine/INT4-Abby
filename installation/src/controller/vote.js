import { submitVote } from '../shared/services/supabase.js'

class VoteApp {
    constructor() {
        this.selectedProfile = null
        this.init()
    }

    init() {
        // Get the selected profile from sessionStorage
        const storedProfile = sessionStorage.getItem('selectedProfile')
        if (storedProfile) {
            this.selectedProfile = JSON.parse(storedProfile)
            this.updateVotePage()
        } else {
            console.error('No profile selected for voting')
            window.location.href = './controller.html'
        }

        // Setup form submission
        const voteForm = document.querySelector('#vote-form')
        if (voteForm) {
            voteForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.handleVoteSubmission()
            })
        }

        // Setup back button
        const backBtn = document.querySelector('.back-to-carousel-btn')
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Clear the stored profile
                sessionStorage.removeItem('selectedProfile')
                window.location.href = './controller.html'
            })
        }

        // Setup cancel button
        const cancelBtn = document.querySelector('.cancel-vote-btn')
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Clear the stored profile
                sessionStorage.removeItem('selectedProfile')
                window.location.href = './controller.html'
            })
        }
    }

    updateVotePage() {
        // Update the page with selected profile information
        const artistName = document.querySelector('.artist-name')
        if (artistName && this.selectedProfile) {
            artistName.textContent = this.selectedProfile.creator_name
        }
    }

    async handleVoteSubmission() {
        const form = document.querySelector('#vote-form')
        const formData = new FormData(form)

        const voterEmail = formData.get('email')
        const receiveUpdates = formData.get('receive_updates') === 'on'

        console.log('Vote submission attempt:', {
            email: voterEmail,
            receiveUpdates,
            emailValid: this.validateEmail(voterEmail)
        })

        if (!voterEmail || !this.validateEmail(voterEmail)) {
            console.log('Email validation failed:', {
                email: voterEmail,
                isEmpty: !voterEmail,
                isValid: this.validateEmail(voterEmail)
            })
            alert('Please enter a valid email address')
            return
        }

        if (!this.selectedProfile) {
            alert('No profile selected for voting.')
            return
        }

        try {
            const { data, error } = await submitVote(
                this.selectedProfile.id,
                voterEmail,
                receiveUpdates
            )

            if (error) {
                console.error('Vote submission failed:', error)
                alert('Failed to submit vote. Please try again.')
                return
            }

            console.log('Vote submitted successfully:', data)
            alert('Vote submitted successfully!')

            // Clear the stored profile
            sessionStorage.removeItem('selectedProfile')

            // Redirect back to controller
            window.location.href = './controller.html'
        } catch (error) {
            console.error('Error submitting vote:', error)
            alert('An error occurred while submitting your vote. Please try again.')
        }
    }

    validateEmail(email) {
        if (!email) return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const isValid = emailRegex.test(email)
        console.log('Email validation:', { email, isValid })
        return isValid
    }
}

// Initialize the vote app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoteApp()
}) 