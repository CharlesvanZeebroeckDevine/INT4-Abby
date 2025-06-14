import { io } from 'socket.io-client'
import { fetchAllProfiles } from '../shared/services/supabase.js'

class MonitorApp {
    constructor() {
        this.socket = io('http://localhost:3001')
        this.profiles = []
        this.currentProfileIndex = 0
        this.currentArtworkIndex = 0
        this.currentProfile = null
        this.currentArtwork = null

        this.init()
    }

    async init() {
        // Load initial data
        await this.loadProfiles()

        // Setup socket listeners
        this.setupSocketListeners()

        // Initial render
        this.renderCurrentProfile()
    }

    async loadProfiles() {
        const { data, error } = await fetchAllProfiles()
        if (error) {
            console.error('Failed to load profiles:', error)
            return
        }

        this.profiles = data
        console.log(`Loaded ${this.profiles.length} profiles`)
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server')
        })

        // Listen for profile selection
        this.socket.on('profile-selected', (data) => {
            this.currentProfileIndex = data.profileIndex
            this.currentArtworkIndex = data.artworkIndex
            this.renderCurrentProfile()
        })

        // Listen for artwork selection
        this.socket.on('artwork-selected', (data) => {
            if (data.profileIndex === this.currentProfileIndex) {
                this.currentArtworkIndex = data.artworkIndex
                this.renderCurrentArtwork()
            }
        })

        // Listen for vote confirmation
        this.socket.on('vote-confirmed', () => {
            this.showVoteConfirmation()
        })
    }

    renderCurrentProfile() {
        this.currentProfile = this.profiles[this.currentProfileIndex]
        if (!this.currentProfile) return

        // Update profile information
        document.querySelector('.avatar-pic').src = this.currentProfile.avatar_url || './images/eyes/test.png'
        document.querySelector('.nickname').textContent = this.currentProfile.creator_name
        document.querySelector('.pers-info p').textContent = this.currentProfile.description || ''

        // Render first artwork
        this.renderCurrentArtwork()

        // Notify server about artworks loaded
        this.socket.emit('artworks-loaded', {
            profileIndex: this.currentProfileIndex,
            count: this.currentProfile.artworks?.length || 0
        })
    }

    renderCurrentArtwork() {
        if (!this.currentProfile?.artworks?.length) return

        this.currentArtwork = this.currentProfile.artworks[this.currentArtworkIndex]
        if (!this.currentArtwork) return

        // Update artwork information
        document.querySelector('.art-name').textContent = this.currentArtwork.title
        document.querySelector('.category').textContent = this.currentArtwork.category
        document.querySelector('.art-info p').textContent = this.currentArtwork.description || ''

        // Update artwork images
        const artPicContainer = document.querySelector('.art-pic')
        artPicContainer.innerHTML = `
            <img class="art-picture" src="${this.currentArtwork.image_url}" alt="${this.currentArtwork.title}" />
        `

        // Handle process section visibility
        const processSection = document.querySelector('.process-section')
        if (processSection) {
            if (this.currentArtwork.include_process && this.currentArtwork.process_description) {
                // Show process section
                processSection.style.display = 'grid'

                // Update process description
                const processInfo = processSection.querySelector('.info-process p')
                if (processInfo) {
                    processInfo.textContent = this.currentArtwork.process_description
                }

                // Update process images if available
                const processPicMain = processSection.querySelector('.process-pic-main')
                const processPicSecondary = processSection.querySelector('.process-pic-secondary')

                if (this.currentArtwork.process_images?.length > 0) {
                    if (processPicMain) {
                        processPicMain.innerHTML = `
                            <img class="avatar-pic" src="${this.currentArtwork.process_images[0]}" alt="Process image" />
                        `
                    }

                    if (this.currentArtwork.process_images.length > 1 && processPicSecondary) {
                        processPicSecondary.innerHTML = `
                            <img class="avatar-pic" src="${this.currentArtwork.process_images[1]}" alt="Process image" />
                        `
                    }
                }
            } else {
                // Hide process section if include_process is false or no process description
                processSection.style.display = 'none'
            }
        }

        // Update dots navigation
    }

    showVoteConfirmation() {
        // Create and show vote confirmation overlay
        const overlay = document.createElement('div')
        overlay.className = 'vote-confirmation'
        overlay.innerHTML = `
      <div class="vote-confirmation-content">
        <span class="checkmark">✓</span>
        <p>Vote counted!</p>
      </div>
    `
        document.body.appendChild(overlay)

        // Remove overlay after animation
        setTimeout(() => {
            overlay.remove()
        }, 2000)
    }
}

// Initialize the monitor app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MonitorApp()
})
