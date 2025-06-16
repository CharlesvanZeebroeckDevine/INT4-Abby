// Arduino Controller for handling real Arduino input
class ArduinoController {
    constructor(socket) {
        if (!socket) {
            console.error('Socket is required for ArduinoController')
            return
        }
        this.socket = socket
        this.port = null
        this.reader = null
        this.connectBtn = document.getElementById('connect')
        this.knobSteps = 0  // Add step counter
        this.init()
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupArduino())
        } else {
            this.setupArduino()
        }
    }

    async setupArduino() {
        try {
            console.log('Setting up Arduino connection...')
            const ports = await navigator.serial.getPorts()
            console.log('Available ports:', ports)

            if (ports.length > 0) {
                this.port = ports[0]
                console.log('Found existing port:', this.port)
                await this.port.open({ baudRate: 9600 })
                console.log('Connected to Arduino')
                this.readSerial()
                if (this.connectBtn) {
                    this.connectBtn.style.display = 'none'
                }
            } else {
                console.log('No Arduino found')
                if (this.connectBtn) {
                    this.connectBtn.style.display = 'inline-block'
                }
            }
        } catch (error) {
            console.error('Arduino setup error:', error)
            if (this.connectBtn) {
                this.connectBtn.style.display = 'inline-block'
            }
        }

        // Add click handler for connect button
        if (this.connectBtn) {
            this.connectBtn.addEventListener('click', async () => {
                try {
                    console.log('Requesting port access...')
                    this.port = await navigator.serial.requestPort()
                    console.log('Port selected:', this.port)
                    await this.port.open({ baudRate: 9600 })
                    console.log('Connected to Arduino')
                    this.readSerial()
                    this.connectBtn.style.display = 'none'
                } catch (err) {
                    console.error('Connection error:', err)
                }
            })
        }
    }

    async readSerial() {
        try {
            console.log('Setting up serial read...')
            const decoder = new TextDecoderStream()
            const inputDone = this.port.readable.pipeTo(decoder.writable)
            this.reader = decoder.readable.getReader()

            while (true) {
                try {
                    const { value, done } = await this.reader.read()
                    if (done) {
                        console.log('Serial port closed')
                        if (this.connectBtn) {
                            this.connectBtn.style.display = 'inline-block'
                        }
                        break
                    }
                    if (value) {
                        console.log('Raw Arduino input:', value)
                        this.handleArduinoInput(value.trim())
                    }
                } catch (readError) {
                    console.error('Error reading from serial port:', readError)
                    if (this.connectBtn) {
                        this.connectBtn.style.display = 'inline-block'
                    }
                    break
                }
            }
        } catch (error) {
            console.error('Error setting up serial read:', error)
            if (this.connectBtn) {
                this.connectBtn.style.display = 'inline-block'
            }
        } finally {
            if (this.reader) {
                try {
                    await this.reader.releaseLock()
                } catch (releaseError) {
                    console.error('Error releasing reader lock:', releaseError)
                }
            }
        }
    }

    handleArduinoInput(data) {
        console.log('Processing Arduino input:', data)

        // Handle rotary encoder input
        if (data === '+1') {
            this.knobSteps++
            if (this.knobSteps >= 3) {
                console.log('Emitting knob rotation: RIGHT')
                this.socket.emit('simulate-knob', 'RIGHT')
                this.knobSteps = 0  // Reset counter
            }
        } else if (data === '-1') {
            this.knobSteps--
            if (this.knobSteps <= -3) {
                console.log('Emitting knob rotation: LEFT')
                this.socket.emit('simulate-knob', 'LEFT')
                this.knobSteps = 0  // Reset counter
            }
        }
        // Handle button inputs
        else if (data === 'Blauwe knop ingedrukt!') {
            console.log('Emitting vote button press')
            this.socket.emit('simulate-vote')
        } else if (data === 'Groene knop ingedrukt!') {
            console.log('Emitting arrow button press')
            this.socket.emit('simulate-arrow')
        }
    }
}

export default ArduinoController