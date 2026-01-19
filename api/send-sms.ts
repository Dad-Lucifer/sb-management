import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phoneNumber, message } = req.body;

        // Validate inputs
        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get API key from environment variable
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            console.error('Fast2SMS API key not configured');
            return res.status(500).json({ error: 'SMS service not configured' });
        }

        // Clean phone number
        const cleanPhone = phoneNumber.replace(/\+91\s?/g, '').trim();

        // Validate phone number
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Make request to Fast2SMS
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route: 'q',
                message: message,
                language: 'english',
                flash: 0,
                numbers: cleanPhone,
            }),
        });

        const data = await response.json();

        if (data.return === true) {
            return res.status(200).json({ success: true, data });
        } else {
            console.error('Fast2SMS error:', data);
            return res.status(500).json({ success: false, error: 'SMS sending failed', details: data });
        }
    } catch (error) {
        console.error('Error in send-sms function:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
