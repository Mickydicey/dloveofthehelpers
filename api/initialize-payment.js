// api/initialize-payment.js
// This runs on Vercel's server - secret key is NEVER exposed to users

export default async function handler(req, res) {

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed' 
        });
    }

    // Get secret key from Vercel environment
    const secretKey = process.env.FLW_SECRET_KEY;
    const publicKey = process.env.FLW_PUBLIC_KEY;

    // Safety check
    if (!secretKey) {
        return res.status(500).json({ 
            error: 'Payment system not configured' 
        });
    }

    // Get donation details from frontend
    const { amount, purpose, email, name } = req.body;

    // Validate inputs
    if (!amount || amount < 1) {
        return res.status(400).json({ 
            error: 'Invalid donation amount' 
        });
    }

    try {
        // Call Flutterwave API securely from server
        const response = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tx_ref: 'dloveofthehelpers-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                amount: amount,
                currency: 'USD',
                redirect_url: 'https://dloveofthehelpers.vercel.app/success.html',
                customer: {
                    email: email || 'donor@dloveofthehelpers.org',
                    name: name || 'Generous Donor',
                },
                customizations: {
                    title: 'Dloveofthehelpers',
                    description: 'Donation for ' + (purpose || 'General Donation'),
                    logo: 'https://dloveofthehelpers.vercel.app/logo.png',
                },
                payment_options: 'card, banktransfer, ussd',
            }),
        });

        const data = await response.json();

        // Check if Flutterwave returned a payment link
        if (data.status === 'success' && data.data && data.data.link) {
            return res.status(200).json({
                status: 'success',
                payment_link: data.data.link,
                public_key: publicKey,
            });
        } else {
            console.error('Flutterwave Error:', data);
            return res.status(400).json({
                error: 'Could not initialize payment',
                details: data.message,
            });
        }

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            error: 'Server error. Please try again.' 
        });
    }
}