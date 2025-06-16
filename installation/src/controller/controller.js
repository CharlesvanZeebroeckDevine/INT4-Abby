console.log('Controller.js script started parsing.');

import { io } from 'socket.io-client'
import { fetchAllProfiles, fetchProfilesByCategory, fetchCategories, submitVote } from '../shared/services/supabase.js'
import ArduinoController from '../shared/arduino-controller.js'

// Debounce utility function
const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

class ControllerApp {
    constructor() {
        const url = new URL(window.location);
        this.socket = io(`//${url.hostname}:3001`)
        this.profiles = []
        this.categories = []
        this.currentProfileIndex = 0
        this.isVoting = false
        this.currentView = 'carousel' // 'carousel' or 'seeall'
        this.selectedCategory = 'all'
        this.arduinoController = null

        // Debounced function for emitting profile selections
        this.debouncedEmitProfileSelected = debounce(this.emitProfileSelected, 150) // 150ms debounce

        // The init() method will now be called by the DOMContentLoaded listener outside the class
        // This ensures the DOM is fully loaded before initialization.
    }

    async init() {
        try {
            // Initialize Arduino controller
            this.arduinoController = new ArduinoController(this.socket)

            // Load data from database
            console.log('Controller: Calling loadProfiles...')
            await this.loadProfiles()
            console.log('Controller: loadProfiles finished.')

            await this.loadCategories()

            // Setup socket listeners
            this.setupSocketListeners()

            // Setup UI event listeners
            this.setupUIListeners()

            // Initial render
            if (window.location.pathname.includes('gridview.html')) {
                // If we're on the grid view page, render all profiles
                this.renderSeeAllGrid(this.profiles)
            } else {
                // Otherwise render carousel view
                this.renderAvatarsInRow()
                this.updateCarouselSelection()
            }
        } catch (error) {
            console.error('Controller Initialization error:', error)
        }
    }

    async loadProfiles() {
        console.log('Controller loadProfiles: Fetching all profiles...')
        const { data, error } = await fetchAllProfiles()
        console.log('Controller loadProfiles: fetchAllProfiles returned - data:', data, 'error:', error)

        if (error) {
            console.error('Controller loadProfiles: Failed to load profiles with error:', error)
            return
        }

        if (!data || data.length === 0) {
            console.warn('Controller loadProfiles: No profiles found in the database.')
        }

        this.profiles = data

        // Notify server about profile count
        this.socket.emit('profiles-loaded', { count: this.profiles.length })

        console.log(`Controller: Loaded ${this.profiles.length} profiles`)
        this.renderAvatarsInRow() // Render avatars in row after profiles are loaded
        this.updateCarouselSelection() // Update selection after loading profiles
        this.emitProfileSelected() // Emit initial selected profile to monitor
    }

    async loadCategories() {
        const { data, error } = await fetchCategories()
        if (error) {
            console.error('Controller: Failed to load categories:', error)
            return
        }

        this.categories = ['all', ...data]
        console.log('Controller: Loaded categories:', this.categories)
        this.renderCategoryFilters() // Render categories after they are loaded
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Controller: Connected to server')
        })

        // Listen for knob updates from the server
        this.socket.on('knob-turn', (direction) => {
            if (this.profiles.length === 0) return

            if (direction === 'RIGHT') {
                this.currentProfileIndex = (this.currentProfileIndex + 1) % this.profiles.length
            } else if (direction === 'LEFT') {
                this.currentProfileIndex = (this.currentProfileIndex - 1 + this.profiles.length) % this.profiles.length
            }
            this.updateCarouselSelection()
            this.debouncedEmitProfileSelected()
        })

        // Listen for arrow button (Enter key) to change artwork
        this.socket.on('simulate-arrow', () => {
            const currentProfile = this.profiles[this.currentProfileIndex]
            if (!currentProfile || !currentProfile.artworks || currentProfile.artworks.length <= 1) return

            // Get current artwork index from monitor's state
            this.socket.emit('get-current-artwork', { profileIndex: this.currentProfileIndex })
        })

        // Listen for current artwork index from monitor
        this.socket.on('current-artwork-index', (data) => {
            const currentProfile = this.profiles[this.currentProfileIndex]
            if (!currentProfile || !currentProfile.artworks) return

            const nextArtworkIndex = (data.artworkIndex + 1) % currentProfile.artworks.length

            // Emit new artwork selection to monitor
            this.socket.emit('artwork-selected', {
                profileIndex: this.currentProfileIndex,
                artworkIndex: nextArtworkIndex
            })
        })

        this.socket.on('carousel-update', (data) => {
            this.currentProfileIndex = data.selectedIndex
            this.updateCarouselSelection()
        })

        this.socket.on('enter-voting', () => {
            this.isVoting = true
            window.location.href = './vote.html'
        })

        this.socket.on('exit-voting', () => {
            this.isVoting = false
            window.location.href = './controller.html'
        })
    }

    // New method to emit the currently selected profile to the monitor
    emitProfileSelected() {
        if (this.profiles.length === 0) return
        this.socket.emit('profile-selected', {
            profileIndex: this.currentProfileIndex
        })
        console.log('Controller: Emitted profile-selected', this.currentProfileIndex)
    }

    setupUIListeners() {
        // See All button
        const seeAllBtn = document.querySelector('.see-all-btn')
        if (seeAllBtn) {
            seeAllBtn.addEventListener('click', () => {
                window.location.href = './gridview.html' // Redirect to grid view page
            })
        }

        // Back to carousel button (for gridview.html and vote.html)
        const backBtn = document.querySelector('.back-to-carousel-btn')
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = './controller.html' // Redirect back to controller
            })
        }

        // Category filter buttons (will be rendered dynamically)
        // Listen for clicks on the parent container to handle dynamically added buttons
        const categoryFiltersContainer = document.querySelector('.category-bar')
        if (categoryFiltersContainer) {
            categoryFiltersContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('category-btn')) {
                    this.filterByCategory(e.target.dataset.category)
                }
            })
        }

        // Vote form submission (if on vote page)
        const voteForm = document.querySelector('#vote-form')
        if (voteForm) {
            voteForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.handleVoteSubmission()
            })
        }
    }

    renderAvatarsInRow() {
        const carouselContainer = document.querySelector('.eye-row')
        if (!carouselContainer) {
            console.error('Error: .eye-row element not found!')
            return
        }

        if (this.profiles.length === 0) {
            console.log('No profiles to render in Controller. Profiles array is empty.')
            carouselContainer.innerHTML = '<p>No avatars available.</p>'
            return
        }

        console.log('Controller: Rendering avatars...', this.profiles.length)
        let avatarsHTML = ''

        // Only create elements for the 5 visible avatars
        const visibleIndices = [
            (this.currentProfileIndex - 2 + this.profiles.length) % this.profiles.length, // prevLeftSecond
            (this.currentProfileIndex - 1 + this.profiles.length) % this.profiles.length, // prev
            this.currentProfileIndex, // selected
            (this.currentProfileIndex + 1) % this.profiles.length, // next
            (this.currentProfileIndex + 2) % this.profiles.length  // nextRightSecond
        ]

        visibleIndices.forEach((index, position) => {
            const profile = this.profiles[index]
            let className = 'square'

            switch (position) {
                case 0:
                    className += ' prevLeftSecond'
                    break
                case 1:
                    className += ' prev'
                    break
                case 2:
                    className += ' selected'
                    break
                case 3:
                    className += ' next'
                    break
                case 4:
                    className += ' nextRightSecond'
                    break
            }

            const colors = ['yellow', 'green', 'orange', 'blue', 'purple']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            const hasAvatar = profile.avatar_url && profile.avatar_url !== '/images/abby/eye.svg'
            const avatarClass = hasAvatar ? '' : `no-avatar bg-${randomColor}`

            avatarsHTML += `
                <div class="${className} ${avatarClass}" data-profile-index="${index}">
                    <img src="${profile.avatar_url || '/images/abby/eye.svg'}" alt="${profile.creator_name}" class="${!hasAvatar ? 'default-avatar' : ''}">
                </div>
            `
        })

        carouselContainer.innerHTML = avatarsHTML

        // Update the name display
        const nameDisplay = document.querySelector('.name')
        if (nameDisplay && this.profiles[this.currentProfileIndex]) {
            nameDisplay.textContent = this.profiles[this.currentProfileIndex].creator_name
        } else if (nameDisplay) {
            nameDisplay.textContent = ''
        }
    }

    updateCarouselSelection() {
        // Re-render the carousel with new positions
        this.renderAvatarsInRow()
    }

    async showSeeAllView() {
        console.log('showSeeAllView: Redirecting to gridview.html')
        // window.location.href = './gridview.html' // This is handled by direct button click now
    }

    showCarouselView() {
        console.log('showCarouselView: Redirecting to controller.html')
        // window.location.href = './controller.html' // This is handled by direct button click now
    }

    renderCategoryFilters() {
        const filtersContainer = document.querySelector('.category-bar')
        if (!filtersContainer) return

        filtersContainer.innerHTML = this.categories.map(category => `
      <button class="category-btn ${category === this.selectedCategory ? 'active' : ''}" 
              data-category="${category}">
        ${category === 'all' ? 'All' : category}
      </button>
    `).join('')
    }

    async filterByCategory(category) {
        this.selectedCategory = category

        // Update active state of category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category)
        })

        // Load and display filtered profiles
        await this.loadProfilesByCategory(category)
    }

    async loadProfilesByCategory(category) {
        let filteredProfiles = this.profiles

        if (category && category !== 'all') {
            // Filter profiles that have at least one artwork in the selected category
            filteredProfiles = this.profiles.filter(profile =>
                profile.artworks && profile.artworks.some(artwork => artwork.category === category)
            )
        }

        // Render the filtered profiles
        this.renderSeeAllGrid(filteredProfiles)
    }

    renderSeeAllGrid(profiles) {
        const grid = document.querySelector('.profiles-grid')
        if (!grid) return

        const colors = ['yellow', 'green', 'orange', 'blue', 'purple']

        grid.innerHTML = profiles.map(profile => {
            const hasAvatar = profile.avatar_url && profile.avatar_url !== '/images/abby/eye.svg'
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            const avatarClass = hasAvatar ? '' : `no-avatar bg-${randomColor}`

            return `
                <div class="profile-card" data-profile-id="${profile.id}">
                    <div class="profile-avatar ${avatarClass}">
                        <img src="${profile.avatar_url || '/images/abby/eye.svg'}"
                             alt="${profile.creator_name}"
                             class="${!hasAvatar ? 'default-avatar' : ''}">
                    </div>
                    <div class="artist-name">${profile.creator_name}</div>
                </div>
            `
        }).join('')
    }

    showVotingInterface() {
        console.log('showVotingInterface: Redirecting to vote.html')
    }

    hideVotingInterface() {
        console.log('hideVotingInterface: Redirecting away from vote.html')
    }

    async handleVoteSubmission() {
        const form = document.querySelector('#vote-form')
        const formData = new FormData(form)

        const voterEmail = formData.get('email')
        const receiveUpdates = formData.get('receive_updates') === 'on'

        if (!voterEmail || !this.validateEmail(voterEmail)) {
            alert('Please enter a valid email address')
            return
        }

        const currentProfile = this.profiles[this.currentProfileIndex]
        if (!currentProfile) {
            alert('No profile selected for voting.')
            return
        }

        const { data, error } = await submitVote(currentProfile.id, voterEmail, receiveUpdates)

        if (error) {
            console.error('Vote submission failed:', error)
            alert('Failed to submit vote. Please try again.')
            return
        }

        this.socket.emit('vote-submitted', {
            profileId: currentProfile.id,
            voterEmail,
            receiveUpdates
        })

        console.log('Vote submitted successfully')
        alert('Vote submitted successfully!')
        window.location.href = './controller.html'
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/
        return emailRegex.test(email)
    }
}

// Initialize the controller app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ControllerApp().init()
})