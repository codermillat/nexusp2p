/**
 * NexusP2P Configuration
 * 
 * Customize these settings based on your needs.
 */

// =============================================================================
// SIGNALING CONFIGURATION (MQTT)
// =============================================================================
export const MQTT_CONFIG = {
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    lobbyTopic: 'nexusp2p-global-lobby-v6',
    reconnectAttempts: 3,
    heartbeatInterval: 1500,
};

// =============================================================================
// WEBRTC / ICE CONFIGURATION
// =============================================================================
// Fresh TURN credentials from Metered free tier
// Get your own at: https://www.metered.ca/tools/openrelay/
export const ICE_CONFIG = {
    iceServers: [
        // === STUN SERVERS ===
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },

        // === TURN SERVERS (Metered Free) ===
        // These are public free TURN servers - may be rate limited
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
        {
            urls: 'turn:a.relay.metered.ca:80?transport=tcp',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
        {
            urls: 'turns:a.relay.metered.ca:443?transport=tcp',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },

        // Backup TURN - ExpressTurn free
        {
            urls: 'turn:relay1.expressturn.com:3478',
            username: 'efQGH8HCIOGJN4YDLI',
            credential: 'tWqXgVxhF8xyBJRf',
        },
    ],

    // IMPORTANT: Change to 'relay' to force TURN usage for testing
    // 'all' = Try P2P first, fallback to relay
    // 'relay' = FORCE relay only (slower but works across networks)
    iceTransportPolicy: 'all' as const,

    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    iceCandidatePoolSize: 10,
};

// =============================================================================
// PEERJS CONFIGURATION
// =============================================================================
export const PEER_CONFIG = {
    config: ICE_CONFIG,
    debug: 2, // Enable warnings for debugging
};

// =============================================================================
// CONNECTION TIMEOUTS
// =============================================================================
export const TIMEOUT_CONFIG = {
    peerInit: 30000,
    streamHandshake: 30000,
    connectionAttempt: 25000,
};

// =============================================================================
// MEDIA CONFIGURATION
// =============================================================================
export const MEDIA_CONFIG = {
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
        frameRate: { ideal: 30, max: 60 },
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    },
};

// =============================================================================
// CHAT CONFIGURATION
// =============================================================================
export const CHAT_CONFIG = {
    maxMessageLength: 1000,
    rateLimit: {
        messagesPerSecond: 5,
    },
};

// =============================================================================
// APP METADATA
// =============================================================================
export const APP_CONFIG = {
    name: 'NexusP2P',
    version: '1.0.0',
    url: 'https://nexusp2p.vercel.app',
};

// =============================================================================
// DEBUG MODE
// =============================================================================
export const DEBUG_MODE = true;
