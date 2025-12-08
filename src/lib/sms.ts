export const sendSMS = async (phoneNumber: string, message: string) => {
    // 1. Clean the number: Remove +91, spaces, and any non-digit characters
    const cleanNumber = phoneNumber.replace('+91', '').replace(/\D/g, '');

    console.log(`Preparing SMS for: ${cleanNumber}`);

    if (cleanNumber.length !== 10) {
        throw new Error(`Invalid phone number length: ${cleanNumber.length}. Must be 10 digits.`);
    }

    // 2. Construct URL with parameters (GET request is often more reliable for client-side)
    const apiKey = 'bYwIv6Pulnp8kiTsLQO1qtrxAVCR7ySGcNaJ53jKXHFmZ9e2oUri7v4B6TKfAsuFVdptPDJzc28NObm0';
    const params = new URLSearchParams({
        authorization: apiKey,
        route: 'q',
        message: message,
        language: 'english',
        flash: '0',
        numbers: cleanNumber,
    });

    const url = `https://www.fast2sms.com/dev/bulkV2?${params.toString()}`;

    try {
        // 3. Send Request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('SMS API Response:', data);

        // 4. Check for API specific error returns
        if (data.return === false) {
            throw new Error(data.message || "Fast2SMS API returned failure");
        }

        return data;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};
