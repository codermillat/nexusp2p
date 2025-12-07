// Vercel Serverless Function to generate Cloudflare TURN credentials
// This keeps your TURN key secret while providing credentials to clients

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    // Environment variables (set in Vercel dashboard)
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const CLOUDFLARE_TURN_KEY_ID = process.env.CLOUDFLARE_TURN_KEY_ID;
    const CLOUDFLARE_TURN_API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_TURN_KEY_ID || !CLOUDFLARE_TURN_API_TOKEN) {
        // If Cloudflare isn't configured, return fallback free TURN servers
        console.log('Cloudflare TURN not configured, using fallback');
        return new Response(JSON.stringify({
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
            ]
        }), { headers });
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
            throw new Error(`Cloudflare API error: ${response.status}`);
        }

        const data = await response.json();

        // Return ICE servers configuration
        return new Response(JSON.stringify({
            iceServers: [
                // STUN servers (free, unlimited)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun.cloudflare.com:3478' },

                // Cloudflare TURN servers with fresh credentials
                {
                    urls: `turn:turn.cloudflare.com:3478?transport=udp`,
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
                {
                    urls: `turn:turn.cloudflare.com:3478?transport=tcp`,
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
                {
                    urls: `turns:turn.cloudflare.com:5349?transport=tcp`,
                    username: data.iceServers?.username || data.username,
                    credential: data.iceServers?.credential || data.credential,
                },
            ]
        }), { headers });

    } catch (error) {
        console.error('Error generating TURN credentials:', error);

        // Fallback to free TURN servers on error
        return new Response(JSON.stringify({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'turn:a.relay.metered.ca:80',
                    username: 'e13b9bfeda7b8ce41de7b8e5',
                    credential: 'SWKdtuV0SkALW9YW',
                },
            ],
            error: 'Using fallback TURN servers'
        }), { headers, status: 200 });
    }
}
