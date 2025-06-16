import { io } from 'socket.io-client'
const url = new URL(window.location);

class SocketService {
    constructor() {
        this.socket = null
        this.isConnected = false
    }

    connect(serverUrl = `${window.location.protocol}//${url.hostname}:3000`) {
        this.socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        })

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
    selectProfile(profileIndex, profile) {
        if (this.socket) {
            this.socket.emit('profile-selected', {
                profileIndex,
                profile
            })
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

    onStateUpdate(callback) {
        if (this.socket) {
            this.socket.on('state-update', callback)
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
        }
    }
}

export default new SocketService()