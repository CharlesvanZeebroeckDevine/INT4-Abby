class ControllerStore {
    constructor() {
        this.profiles = []
        this.currentProfileIndex = 0
        this.currentProfile = null
        this.searchTerm = ''
        this.selectedCategory = 'all'
        this.isVoting = false
        this.listeners = new Map()
    }

    // State management
    setProfiles(profiles) {
        this.profiles = profiles
        this.currentProfileIndex = 0
        this.currentProfile = profiles[0] || null
        this.emit('profiles-updated', this.profiles)
        this.emit('profile-changed', this.currentProfile)
    }

    navigateProfile(direction) {
        if (this.profiles.length === 0) return

        if (direction === 'next') {
            this.currentProfileIndex = (this.currentProfileIndex + 1) % this.profiles.length
        } else if (direction === 'prev') {
            this.currentProfileIndex = this.currentProfileIndex === 0
                ? this.profiles.length - 1
                : this.currentProfileIndex - 1
        }

        this.currentProfile = this.profiles[this.currentProfileIndex]
        this.emit('profile-changed', this.currentProfile)
    }

    setCurrentProfile(index) {
        if (index >= 0 && index < this.profiles.length) {
            this.currentProfileIndex = index
            this.currentProfile = this.profiles[index]
            this.emit('profile-changed', this.currentProfile)
        }
    }

    setSearchTerm(term) {
        this.searchTerm = term
        this.emit('search-changed', term)
    }

    setCategory(category) {
        this.selectedCategory = category
        this.emit('category-changed', category)
    }

    setVotingMode(isVoting) {
        this.isVoting = isVoting
        this.emit('voting-mode-changed', isVoting)
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

    getProfiles() {
        return this.profiles
    }

    getVisibleProfiles() {
        // Return 7 profiles centered around current selection for the eye row
        const start = Math.max(0, this.currentProfileIndex - 3)
        const end = Math.min(this.profiles.length, start + 7)
        return this.profiles.slice(start, end)
    }
}

export default new ControllerStore()