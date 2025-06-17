import { io } from 'socket.io-client'
import { fetchAllProfiles } from '../shared/services/supabase.js'

class MonitorApp {
    constructor() {
        const url = new URL(window.location);
        console.log('Monitor: Initializing with URL:', url.hostname);

        // Construct the WebSocket URL
        const wsUrl = `${window.location.protocol}//${url.hostname}:3000`;
        console.log('Monitor: Connecting to WebSocket server at:', wsUrl);

        this.socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            forceNew: true
        });

        this.profiles = []
        this.currentProfileIndex = 0
        this.currentArtworkIndex = 0
        this.currentProfile = null
        this.currentArtwork = null
        this.profileColors = new Map() // Store profile colors

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

        // Assign colors to profiles without avatars
        const colors = ['yellow', 'green', 'orange', 'blue', 'purple']
        this.profiles.forEach((profile, index) => {
            const hasAvatar = profile.avatar_url && profile.avatar_url !== '/images/abby/eye.svg'
            if (!hasAvatar) {
                // Use the profile index to consistently assign colors
                const colorIndex = index % colors.length
                this.profileColors.set(profile.id, colors[colorIndex])
            }
        })

        console.log(`Loaded ${this.profiles.length} profiles`)
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Monitor: Connected to server with ID:', this.socket.id)
        })

        this.socket.on('connect_error', (error) => {
            console.error('Monitor: Connection error:', error)
        })

        this.socket.on('disconnect', (reason) => {
            console.log('Monitor: Disconnected from server. Reason:', reason)
        })

        this.socket.on('error', (error) => {
            console.error('Monitor: Socket error:', error)
        })

        // Listen for profile selection
        this.socket.on('profile-selected', (data) => {
            console.log('Monitor: Received profile selection:', data)
            this.currentProfileIndex = data.profileIndex
            this.currentArtworkIndex = 0 // Reset artwork index when profile changes
            this.renderCurrentProfile()
        })

        // Listen for state updates
        this.socket.on('state-update', (state) => {
            console.log('Monitor: Received state update:', state)
            this.currentProfileIndex = state.selectedProfileIndex
            this.currentArtworkIndex = state.selectedArtworkIndex
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
        const avatarPic = document.querySelector('.avatar-pic')
        const hasAvatar = this.currentProfile.avatar_url && this.currentProfile.avatar_url !== '/images/abby/eye.svg'

        if (hasAvatar) {
            avatarPic.src = this.currentProfile.avatar_url
            avatarPic.parentElement.classList.remove('no-avatar')
            avatarPic.parentElement.classList.remove('bg-yellow', 'bg-green', 'bg-orange', 'bg-blue', 'bg-purple')
        } else {
            avatarPic.src = '/images/abby/eye.svg'
            avatarPic.parentElement.classList.add('no-avatar')
            const color = this.profileColors.get(this.currentProfile.id)
            if (color) {
                avatarPic.parentElement.classList.add(`bg-${color}`)
            }
        }

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

                Promise.all(tempImages)
                    .then(images => {
                        // Sort images by aspect ratio (vertical vs horizontal)
                        const sortedImages = images.sort((a, b) => b.ratio - a.ratio)

                        // Only update if we have at least one image
                        if (sortedImages.length > 0) {
                            // Vertical image (lower ratio) goes in main
                            if (processPicMain && sortedImages[0]) {
                                processPicMain.innerHTML = `
                                    <img class="process-pic" src="${sortedImages[1].url}" alt="Process image" />
                                `
                            }

                            // Horizontal image (higher ratio) goes in secondary
                            if (processPicSecondary && sortedImages.length > 1 && sortedImages[1]) {
                                processPicSecondary.innerHTML = `
                                    <img class="process-pic" src="${sortedImages[0].url}" alt="Process image" />
                                `
                            }
                        }
                    })
                    .catch(error => {
                        console.warn('Error loading process images:', error)
                        // Clear process images on error
                        if (processPicMain) processPicMain.innerHTML = ''
                        if (processPicSecondary) processPicSecondary.innerHTML = ''
                    })
            } else {
                // Clear process images if none available
                if (processPicMain) processPicMain.innerHTML = ''
                if (processPicSecondary) processPicSecondary.innerHTML = ''
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
