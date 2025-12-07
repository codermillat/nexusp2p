import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Environment variables (set in Vercel dashboard)
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const CLOUDFLARE_TURN_KEY_ID = process.env.CLOUDFLARE_TURN_KEY_ID;
    const CLOUDFLARE_TURN_API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;

    // Fallback TURN credentials (set these in Vercel env vars if needed)
    const FALLBACK_TURN_URL = process.env.FALLBACK_TURN_URL;
    const FALLBACK_TURN_USERNAME = process.env.FALLBACK_TURN_USERNAME;
    const FALLBACK_TURN_CREDENTIAL = process.env.FALLBACK_TURN_CREDENTIAL;

    // Default STUN-only config (always works for same-network)
    const stunOnlyConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
        ],
        source: 'stun-only'
    };

    // If no Cloudflare configured, try fallback TURN
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_TURN_KEY_ID || !CLOUDFLARE_TURN_API_TOKEN) {
        console.log('Cloudflare TURN not configured');

        // Use fallback TURN if configured
        if (FALLBACK_TURN_URL && FALLBACK_TURN_USERNAME && FALLBACK_TURN_CREDENTIAL) {
            return res.status(200).json({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    {
                        urls: FALLBACK_TURN_URL,
                        username: FALLBACK_TURN_USERNAME,
                        credential: FALLBACK_TURN_CREDENTIAL,
                    },
                ],
                source: 'fallback'
            });
        }

        // No TURN configured - STUN only
        return res.status(200).json(stunOnlyConfig);
    }

    try {
        // Generate short-lived TURN credentials from Cloudflare
        const response = await fetch(
            `https://rtc.live.cloudflare.com/v1/turn/keys/${CLOUDFLARE_TURN_KEY_ID}/credentials/generate`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_TURN_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ttl: 86400, // 24 hours validity
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cloudflare API error:', response.status, errorText);
            throw new Error(`Cloudflare API error: ${response.status}`);
        }

        const data = await response.json();

        // Return ICE servers configuration with Cloudflare TURN
        return res.status(200).json({
            iceServers: [
                // STUN servers (free, unlimited)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun.cloudflare.com:3478' },

                // Cloudflare TURN servers with fresh credentials
                {
                    urls: 'turn:turn.cloudflare.com:3478?transport=udp',
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
                {
                    urls: 'turn:turn.cloudflare.com:3478?transport=tcp',
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
                {
                    urls: 'turns:turn.cloudflare.com:5349?transport=tcp',
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
            ],
            source: 'cloudflare'
        });

    } catch (error) {
        console.error('Error generating TURN credentials:', error);

        // Fallback to STUN only on error
        return res.status(200).json({
            ...stunOnlyConfig,
            error: 'TURN generation failed, using STUN only'
        });
    }
}
