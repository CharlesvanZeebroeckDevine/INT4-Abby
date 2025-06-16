import { io } from 'socket.io-client'
const url = new URL(window.location);

class SocketService {
    constructor() {
        this.socket = null
        this.isConnected = false
    }

    connect(serverUrl = `//${url.hostname}:3001`) {
        this.socket = io(serverUrl)

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server')
            this.isConnected = true
        })

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server')
            this.isConnected = false
        })

        return this.socket
    }

    // Controller events
    selectProfile(profileId, profileData) {
        if (this.socket) {
            this.socket.emit('profile-selected', { profileId, profileData })
        }
    }

    navigateArtwork(direction) {
        if (this.socket) {
            this.socket.emit('artwork-navigate', { direction })
        }
    }

    voteSubmitted(profileId) {
        if (this.socket) {
            this.socket.emit('vote-submitted', { profileId })
        }
    }

    // Monitor listeners
    onProfileSelected(callback) {
        if (this.socket) {
            this.socket.on('profile-selected', callback)
        }
    }

    onArtworkNavigate(callback) {
        if (this.socket) {
            this.socket.on('artwork-navigate', callback)
        }
    }

    onVoteSubmitted(callback) {
        if (this.socket) {
            this.socket.on('vote-submitted', callback)
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
        }
    }
}

export default new SocketService()