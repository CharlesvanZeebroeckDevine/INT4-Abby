import { createServer } from 'http';
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let currentState = {
    selectedProfileIndex: 0,
    selectedArtworkIndex: 0,
    isVoting: false,
    totalProfiles: 0
};

// Handle Arduino input
function handleArduinoInput(data) {
    console.log('Arduino input:', data);

    // Parse Arduino commands
    if (data.startsWith('KNOB:')) {
        const direction = data.split(':')[1]; // LEFT or RIGHT
        handleKnobRotation(direction);
    } else if (data === 'VOTE') {
        handleVoteButton();
    } else if (data === 'ARROW') {
        handleArrowButton();
    }
}

// Handle knob rotation with debouncing
let knobDebounceTimer = null;
function handleKnobRotation(direction) {
    if (currentState.isVoting) return; // Don't navigate while voting

    const oldIndex = currentState.selectedProfileIndex;

    if (direction === 'RIGHT') {
        currentState.selectedProfileIndex = Math.min(
            currentState.selectedProfileIndex + 1,
            currentState.totalProfiles - 1
        );
    } else if (direction === 'LEFT') {
        currentState.selectedProfileIndex = Math.max(
            currentState.selectedProfileIndex - 1,
            0
        );
    }

    // Reset artwork index when changing profiles
    if (oldIndex !== currentState.selectedProfileIndex) {
        currentState.selectedArtworkIndex = 0;
    }

    // Debounce profile updates to avoid rapid API calls
    clearTimeout(knobDebounceTimer);
    knobDebounceTimer = setTimeout(() => {
        io.emit('profile-selected', {
            profileIndex: currentState.selectedProfileIndex,
            artworkIndex: currentState.selectedArtworkIndex
        });
    }, 150); // 150ms delay

    // Update controller immediately (no API call needed)
    io.emit('carousel-update', {
        selectedIndex: currentState.selectedProfileIndex
    });
}

// Handle vote button
function handleVoteButton() {
    if (currentState.isVoting) {
        // Exit voting mode
        currentState.isVoting = false;
        io.emit('exit-voting');
    } else {
        // Enter voting mode
        currentState.isVoting = true;
        io.emit('enter-voting', {
            profileIndex: currentState.selectedProfileIndex
        });
    }
}

// Handle arrow button (next artwork)
function handleArrowButton() {
    if (currentState.isVoting) return; // Don't change artwork while voting

    // Simply emit next-artwork event and let the monitor handle the navigation
    io.emit('next-artwork', {
        profileIndex: currentState.selectedProfileIndex
    });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current state to new clients
    socket.emit('state-update', currentState);
    socket.emit('arduino-status', { connected: false });

    // Handle profile count update from controller
    socket.on('profiles-loaded', (data) => {
        currentState.totalProfiles = data.count;
        console.log(`Loaded ${data.count} profiles`);
    });

    // Handle artwork count update from monitor
    socket.on('artworks-loaded', (data) => {
        // Update max artwork index for current profile
        if (data.profileIndex === currentState.selectedProfileIndex) {
            const maxArtworkIndex = data.count - 1;
            currentState.selectedArtworkIndex = Math.min(
                currentState.selectedArtworkIndex,
                maxArtworkIndex
            );

            // Emit next artwork
            currentState.selectedArtworkIndex = (currentState.selectedArtworkIndex + 1) % data.count;
            io.emit('artwork-selected', {
                profileIndex: currentState.selectedProfileIndex,
                artworkIndex: currentState.selectedArtworkIndex
            });
        }
    });

    // Handle vote submission
    socket.on('vote-submitted', (data) => {
        console.log('Vote submitted:', data);
        currentState.isVoting = false;

        // Show vote confirmation animation on monitor
        io.emit('vote-confirmed', {
            profileIndex: currentState.selectedProfileIndex
        });

        // Return to normal view
        setTimeout(() => {
            io.emit('exit-voting');
        }, 2000); // Show confirmation for 2 seconds
    });

    // Arduino simulator events (for testing)
    socket.on('simulate-knob', (direction) => {
        // if (!isArduinoConnected) {
        handleKnobRotation(direction);
        // }
    });

    socket.on('simulate-vote', () => {
        // if (!isArduinoConnected) {
        handleVoteButton();
        // }
    });

    socket.on('simulate-arrow', () => {
        // if (!isArduinoConnected) {
        handleArrowButton();
        // }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server running on port ${PORT}`);
    console.log(`📱 Controller: http://localhost:3000/src/controller.html`);
    console.log(`🖥️  Monitor: http://localhost:3000/src/monitor.html`);
    console.log('');
    console.log('🎮 Arduino Simulator Controls:');
    console.log('   ← → Arrow Keys: Rotate knob');
    console.log('   Space: Vote button');
    console.log('   Enter: Arrow button');

    // Try to initialize Arduino (for tomorrow)
    // initializeArduino();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    // if (arduinoPort && arduinoPort.isOpen) {
    //     arduinoPort.close();
    // }
    process.exit(0);
});