/**
 * NexusP2P Configuration
 * 
 * Customize these settings based on your needs.
 * All current defaults are 100% FREE services.
 */

// =============================================================================
// SIGNALING CONFIGURATION (MQTT)
// =============================================================================
// Public MQTT broker for matchmaking. No account needed.
// Alternatives: broker.emqx.io, test.mosquitto.org
export const MQTT_CONFIG = {
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    lobbyTopic: 'nexusp2p-global-lobby-v6',
    reconnectAttempts: 3,
    heartbeatInterval: 1500, // ms between presence signals
};

// =============================================================================
// WEBRTC / ICE CONFIGURATION
// =============================================================================
// STUN servers help discover your public IP (always free, unlimited)
// TURN servers relay media when direct P2P fails (required for symmetric NAT)
export const ICE_CONFIG = {
    iceServers: [
        // === FREE STUN SERVERS (Unlimited) ===
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },

        // === FREE TURN SERVERS ===
        // Metered OpenRelay - Free public TURN
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turns:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },

        // Relay Metered - Alternative free TURN
        {
            urls: 'turn:relay.metered.ca:80',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
        {
            urls: 'turn:relay.metered.ca:443',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
        {
            urls: 'turn:relay.metered.ca:443?transport=tcp',
            username: 'e13b9bfeda7b8ce41de7b8e5',
            credential: 'SWKdtuV0SkALW9YW',
        },
    ],

    // ICE transport policy:
    // 'all' = Try direct P2P first (fastest), fallback to TURN relay
    // 'relay' = Force TURN relay (use for testing or strict NAT)
    iceTransportPolicy: 'all' as const,

    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    iceCandidatePoolSize: 10,
};

// =============================================================================
// PEERJS CONFIGURATION
// =============================================================================
// Using free PeerJS cloud server for WebRTC signaling
// For self-hosted: https://github.com/peers/peerjs-server
export const PEER_CONFIG = {
    // host: 'your-peerjs-server.com', // Uncomment for self-hosted
    // port: 443,
    // path: '/peerjs',
    // secure: true,
    config: ICE_CONFIG,
    debug: 0, // 0=off, 1=errors, 2=warnings, 3=all (set to 3 for debugging)
};

// =============================================================================
// CONNECTION TIMEOUTS (increased for cross-network)
// =============================================================================
export const TIMEOUT_CONFIG = {
    peerInit: 30000,        // Time to initialize PeerJS connection
    streamHandshake: 30000, // Time to receive remote stream after call
    connectionAttempt: 20000, // Time before skipping to next peer
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
// Set to true to see ICE connection states in console
export const DEBUG_MODE = true;

// =============================================================================
// SELF-HOSTED TURN SERVER EXAMPLE
// =============================================================================
// If you need your own TURN server, use Coturn:
// https://github.com/coturn/coturn
//
// Docker command:
// docker run -d --network=host coturn/coturn \
//   -n --realm=yourdomain.com \
//   --fingerprint --lt-cred-mech \
//   --user=myuser:mypassword
//
// Then update ICE_CONFIG.iceServers:
// {
//   urls: 'turn:your-server.com:3478',
//   username: 'myuser',
//   credential: 'mypassword'
// }
