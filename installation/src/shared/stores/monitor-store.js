class MonitorStore {
    constructor() {
        this.currentProfile = null
        this.currentArtworkIndex = 0
        this.currentArtwork = null
        this.showVoteAnimation = false
        this.listeners = new Map()
    }

    setCurrentProfile(profile) {
        this.currentProfile = profile
        this.currentArtworkIndex = 0
        this.currentArtwork = profile?.artworks?.[0] || null
        this.emit('profile-changed', profile)
        this.emit('artwork-changed', this.currentArtwork)
    }

    navigateArtwork(direction) {
        if (!this.currentProfile?.artworks?.length) return

        const artworks = this.currentProfile.artworks

        if (direction === 'next') {
            this.currentArtworkIndex = (this.currentArtworkIndex + 1) % artworks.length
        } else if (direction === 'prev') {
            this.currentArtworkIndex = this.currentArtworkIndex === 0
                ? artworks.length - 1
                : this.currentArtworkIndex - 1
        }

        this.currentArtwork = artworks[this.currentArtworkIndex]
        this.emit('artwork-changed', this.currentArtwork)
    }

    showVoteConfirmation() {
        this.showVoteAnimation = true
        this.emit('vote-animation', true)

        // Hide animation after 3 seconds
        setTimeout(() => {
            this.showVoteAnimation = false
            this.emit('vote-animation', false)
        }, 3000)
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data))
        }
    }

    // Getters
    getCurrentProfile() {
        return this.currentProfile
    }

    getCurrentArtwork() {
        return this.currentArtwork
    }

    getAllArtworks() {
        return this.currentProfile?.artworks || []
    }
}

export default new MonitorStore()