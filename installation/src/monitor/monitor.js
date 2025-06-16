import { io } from 'socket.io-client'
import { fetchAllProfiles } from '../shared/services/supabase.js'

class MonitorApp {
    constructor() {
        const url = new URL(window.location);
        this.socket = io(`//${url.hostname}:3000`)
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
            this.currentArtworkIndex = 0 // Reset artwork index when profile changes
            this.renderCurrentProfile()
        })

        // Listen for artwork selection
        this.socket.on('artwork-selected', (data) => {
            if (data.profileIndex === this.currentProfileIndex) {
                this.currentArtworkIndex = data.artworkIndex
                this.renderCurrentArtwork()
            }
        })

        // Listen for next artwork request
        this.socket.on('next-artwork', (data) => {
            if (data.profileIndex === this.currentProfileIndex && this.currentProfile?.artworks?.length > 0) {
                this.currentArtworkIndex = (this.currentArtworkIndex + 1) % this.currentProfile.artworks.length
                this.renderCurrentArtwork()
            }
        })

        // Listen for current artwork request
        this.socket.on('get-current-artwork', (data) => {
            if (data.profileIndex === this.currentProfileIndex) {
                this.socket.emit('current-artwork-index', {
                    profileIndex: this.currentProfileIndex,
                    artworkIndex: this.currentArtworkIndex
                })
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
        const processElements = [
            document.querySelector('.process'),
            document.querySelector('.info-process'),
            document.querySelector('.process-pic-main'),
            document.querySelector('.process-pic-secondary'),
            document.querySelector('.blue')
        ]

        if (this.currentArtwork.include_process) {
            // Show process section
            processElements.forEach(el => {
                if (el) {
                    if (el.classList.contains('process')) {
                        el.style.display = 'flex'
                    } else {
                        el.style.display = 'block'
                    }
                }
            })

            // Update process description
            const processInfo = document.querySelector('.info-process p')
            if (processInfo) {
                processInfo.textContent = this.currentArtwork.process_description
            }

            // Update process images if available
            const processPicMain = document.querySelector('.process-pic-main')
            const processPicSecondary = document.querySelector('.process-pic-secondary')

            if (this.currentArtwork.process_images?.length > 0) {
                // Create temporary images to check dimensions
                const tempImages = this.currentArtwork.process_images.map(url => {
                    return new Promise((resolve) => {
                        const img = new Image()
                        img.onload = () => resolve({
                            url,
                            width: img.width,
                            height: img.height,
                            ratio: img.width / img.height
                        })
                        img.src = url
                    })
                })

                Promise.all(tempImages).then(images => {
                    // Sort images by aspect ratio (vertical vs horizontal)
                    const sortedImages = images.sort((a, b) => b.ratio - a.ratio)

                    // Vertical image (lower ratio) goes in main
                    if (processPicMain) {
                        processPicMain.innerHTML = `
                            <img class="process-pic" src="${sortedImages[1].url}" alt="Process image" />
                        `
                    }

                    // Horizontal image (higher ratio) goes in secondary
                    if (this.currentArtwork.process_images.length > 1 && processPicSecondary) {
                        processPicSecondary.innerHTML = `
                            <img class="process-pic" src="${sortedImages[0].url}" alt="Process image" />
                        `
                    }
                })
            }
        } else {
            // Hide process section
            processElements.forEach(el => {
                if (el) el.style.display = 'none'
            })
        }
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
