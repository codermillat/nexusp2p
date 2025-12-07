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

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_TURN_KEY_ID || !CLOUDFLARE_TURN_API_TOKEN) {
        // If Cloudflare isn't configured, return fallback free TURN servers
        console.log('Cloudflare TURN not configured, using fallback');
        return res.status(200).json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: 'turn:a.relay.metered.ca:80',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
                {
                    urls: 'turn:a.relay.metered.ca:443',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
                {
                    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
            ],
            source: 'fallback'
        });
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

        // Return ICE servers configuration
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

        // Fallback to free TURN servers on error
        return res.status(200).json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'turn:a.relay.metered.ca:80',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
                {
                    urls: 'turn:a.relay.metered.ca:443',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
            ],
            source: 'fallback',
            error: 'Using fallback TURN servers'
        });
    }
}
