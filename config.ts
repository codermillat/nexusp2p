/**
 * NexusP2P Configuration
 * 
 * TURN credentials are fetched dynamically from /api/turn-credentials
 * Set your Cloudflare credentials in Vercel Environment Variables
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
// FALLBACK ICE CONFIG (used before API response)
// =============================================================================
export const FALLBACK_ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
    iceTransportPolicy: 'all' as const,
    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    iceCandidatePoolSize: 10,
};

// =============================================================================
// FETCH DYNAMIC ICE CONFIG (with Cloudflare TURN)
// =============================================================================
export async function getIceConfig(): Promise<RTCConfiguration> {
    try {
        const response = await fetch('/api/turn-credentials');
        if (!response.ok) throw new Error('Failed to fetch TURN credentials');

        const data = await response.json();

        console.log('✅ Fetched TURN credentials:', data.iceServers?.length || 0, 'servers');

        return {
            iceServers: data.iceServers,
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceCandidatePoolSize: 10,
        };
    } catch (error) {
        console.warn('⚠️ Could not fetch TURN credentials, using fallback:', error);
        return FALLBACK_ICE_CONFIG;
    }
}

// =============================================================================
// PEERJS CONFIGURATION
// =============================================================================
export const PEER_CONFIG = {
    config: FALLBACK_ICE_CONFIG, // Initial config, updated dynamically
    debug: 2,
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
