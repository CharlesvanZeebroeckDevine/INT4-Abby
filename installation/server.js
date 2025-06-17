import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["*"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Add connection logging
io.engine.on("connection_error", (err) => {
    console.log('Server: Connection error:', err);
});

let currentState = {
    selectedProfileIndex: 0,
    selectedArtworkIndex: 0,
    isVoting: false,
    totalProfiles: 0
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    // Only log initial connection
    console.log('Server: New client connected:', socket.id);

    // Send current state to new clients
    socket.emit('state-update', currentState);

    // Handle profile selection from controller
    socket.on('profile-selected', (data) => {
        // Only log if it's a controller connection
        if (data.profile) {
            console.log('Server: Profile selected:', {
                profileIndex: data.profileIndex,
                profileName: data.profile.creator_name
            });
        }

        currentState.selectedProfileIndex = data.profileIndex;
        currentState.selectedArtworkIndex = 0; // Reset artwork index when changing profiles

        // Broadcast to all clients
        io.emit('profile-selected', {
            profileIndex: data.profileIndex,
            profile: data.profile
        });
    });

    // Handle artwork selection from controller
    socket.on('artwork-selected', (data) => {
        console.log('Server: Artwork selected:', {
            profileIndex: data.profileIndex,
            artworkIndex: data.artworkIndex
        });

        currentState.selectedArtworkIndex = data.artworkIndex;

        // Broadcast to all clients
        io.emit('artwork-selected', {
            profileIndex: data.profileIndex,
            artworkIndex: data.artworkIndex
        });
    });

    // Handle profile count update from controller
    socket.on('profiles-loaded', (data) => {
        currentState.totalProfiles = data.count;
        // Only log if it's a controller connection
        if (data.count > 0) {
            console.log(`Server: Loaded ${data.count} profiles`);
        }
    });

    // Handle vote submission
    socket.on('vote-submitted', (data) => {
        console.log('Server: Vote submitted:', data);
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

    // Only log disconnections for debugging purposes
    socket.on('disconnect', () => {
        // Uncomment for debugging
        // console.log('Server: Client disconnected:', socket.id);
    });
});

// Start server
const PORT = 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 Socket.IO server running on http://${HOST}:${PORT}`);
    console.log(`📱 Controller: http://localhost:${PORT}/src/controller.html`);
    console.log(`🖥️  Monitor: http://localhost:${PORT}/src/monitor.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});