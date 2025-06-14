// Arduino Simulator for testing without hardware
class ArduinoSimulator {
    constructor(socket) {
        if (!socket) {
            console.error('Socket is required for ArduinoSimulator')
            return
        }
        this.socket = socket
        this.isEnabled = false
        this.feedbackTimeout = null
        this.init()
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            this.setupKeyboardControls()
            this.createSimulatorUI()
        } else {
            this.setupKeyboardControls()
            this.createSimulatorUI()
        }
    }

    setupKeyboardControls() {
        if (!document) return

        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return

            // Prevent default browser behavior
            event.preventDefault()

            switch (event.code) {
                case 'ArrowLeft':
                    this.simulateKnob('LEFT')
                    this.showFeedback('🔄 Knob LEFT')
                    break
                case 'ArrowRight':
                    this.simulateKnob('RIGHT')
                    this.showFeedback('🔄 Knob RIGHT')
                    break
                case 'Space':
                    this.simulateVote()
                    this.showFeedback('🗳️ VOTE Button')
                    break
                case 'Enter':
                    this.simulateArrow()
                    this.showFeedback('➡️ ARROW Button')
                    break
            }
        })
    }

    createSimulatorUI() {
        if (!document || !document.body) return

        // Remove existing simulator if it exists
        const existingSimulator = document.getElementById('arduino-simulator')
        if (existingSimulator) {
            existingSimulator.remove()
        }

        // Create simulator status indicator
        const indicator = document.createElement('div')
        indicator.id = 'arduino-simulator'
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                min-width: 200px;
            ">
                <div id="arduino-status">🔌 Arduino: Disconnected</div>
                <div id="simulator-status">🎮 Simulator: Enabled</div>
                <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">
                    ← → Knob | Space: Vote | Enter: Arrow
                </div>
                <div id="feedback" style="margin-top: 5px; color: #4CAF50;"></div>
            </div>
        `
        document.body.appendChild(indicator)

        // Listen for Arduino status updates
        this.socket.on('arduino-status', (status) => {
            const statusEl = document.getElementById('arduino-status')
            const simulatorStatusEl = document.getElementById('simulator-status')

            if (statusEl && simulatorStatusEl) {
                if (status.connected) {
                    statusEl.textContent = '🔌 Arduino: Connected'
                    statusEl.style.color = '#4CAF50'
                    this.isEnabled = false
                    simulatorStatusEl.textContent = '🎮 Simulator: Disabled'
                } else {
                    statusEl.textContent = '🔌 Arduino: Disconnected'
                    statusEl.style.color = '#f44336'
                    this.isEnabled = true
                    simulatorStatusEl.textContent = '🎮 Simulator: Enabled'
                }
            }
        })
    }

    simulateKnob(direction) {
        if (!this.socket) return
        console.log(`🎮 Simulating knob: ${direction}`)
        this.socket.emit('simulate-knob', direction)
    }

    simulateVote() {
        if (!this.socket) return
        console.log('🎮 Simulating vote button')
        this.socket.emit('simulate-vote')
    }

    simulateArrow() {
        if (!this.socket) return
        console.log('🎮 Simulating arrow button')
        this.socket.emit('simulate-arrow')
    }

    showFeedback(message) {
        if (!document) return
        const feedbackEl = document.getElementById('feedback')
        if (feedbackEl) {
            // Clear any existing timeout
            if (this.feedbackTimeout) {
                clearTimeout(this.feedbackTimeout)
            }

            feedbackEl.textContent = message
            this.feedbackTimeout = setTimeout(() => {
                if (feedbackEl) {
                    feedbackEl.textContent = ''
                }
            }, 1000)
        }
    }
}

export default ArduinoSimulator