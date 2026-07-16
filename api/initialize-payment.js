// api/initialize-payment.js
// DIAGNOSTIC V3 - Test exact Flutterwave V4 endpoints

export default async function handler(req, res) {

    const clientId = process.env.FLW_CLIENT_ID;
    const clientSecret = process.env.FLW_CLIENT_SECRET;

    try {
        // Try token endpoint
        const tokenResponse = await fetch('https://api.flutterwave.com/v4/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            }),
        });

        // Get raw text first before parsing
        const rawText = await tokenResponse.text();

        return res.status(200).json({
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            raw_response: rawText,
            content_type: tokenResponse.headers.get('content-type'),
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
        });
    }
}