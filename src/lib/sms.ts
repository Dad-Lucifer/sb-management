/**
 * SMS Service using Fast2SMS API
 * Sends SMS notifications to customers
 */

const FAST2SMS_API_KEY = import.meta.env.VITE_FAST2SMS_API_KEY;
const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

export interface SMSParams {
    phoneNumber: string;
    customerName: string;
    sessionDuration?: number; // Duration in hours
}

/**
 * Array of message templates for variety
 * [Name] will be replaced with customer name
 * [Session Time] will be replaced with formatted session duration
 */
const MESSAGE_TEMPLATES = [
    "Hey [Name], your session at SB Game Zone has wrapped up! Thanks for playing with us—hope you had a great time. See you again soon!",
    "Thanks for gaming with us, [Name]! You spent [Session Time] at SB Game Zone. Hope every minute was fun—come back soon!",
    "Hey [Name], that was a solid gaming session at SB Game Zone! Thanks for choosing us. Can't wait to see you again.",
    "Game over for now, [Name]! Thanks for spending [Session Time] at SB Game Zone. Ready for the next match?",
    "Hey [Name], thanks for playing at SB Game Zone! Hope your session was packed with fun and excitement. See you soon!"
];

/**
 * Format session duration into readable text
 */
function formatSessionTime(hours: number): string {
    if (hours >= 1) {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        if (minutes > 0) {
            return `${wholeHours}h ${minutes}min`;
        }
        return `${wholeHours} hour${wholeHours > 1 ? 's' : ''}`;
    } else {
        const minutes = Math.round(hours * 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
}

/**
 * Get a random message template and personalize it
 */
function getRandomMessage(customerName: string, sessionDuration?: number): string {
    // Select a random template
    const randomIndex = Math.floor(Math.random() * MESSAGE_TEMPLATES.length);
    let message = MESSAGE_TEMPLATES[randomIndex];

    // Replace [Name] with customer name
    message = message.replace(/\[Name\]/g, customerName);

    // Replace [Session Time] with formatted duration if available
    if (sessionDuration !== undefined && message.includes('[Session Time]')) {
        const formattedTime = formatSessionTime(sessionDuration);
        message = message.replace(/\[Session Time\]/g, formattedTime);
    } else if (message.includes('[Session Time]')) {
        // If template has [Session Time] but no duration provided, use a generic template instead
        const templatesWithoutTime = MESSAGE_TEMPLATES.filter(t => !t.includes('[Session Time]'));
        message = templatesWithoutTime[Math.floor(Math.random() * templatesWithoutTime.length)];
        message = message.replace(/\[Name\]/g, customerName);
    }

    return message;
}

/**
 * Send thank you SMS to customer after session ends
 */
export async function sendSessionEndSMS({ phoneNumber, customerName, sessionDuration }: SMSParams): Promise<boolean> {
    try {
        // Check if API key is configured
        if (!FAST2SMS_API_KEY) {
            console.error('Fast2SMS API key not configured. Please add VITE_FAST2SMS_API_KEY to .env file');
            return false;
        }

        // Remove +91 prefix and any spaces from phone number
        const cleanPhone = phoneNumber.replace(/\+91\s?/g, '').trim();

        // Validate phone number (should be 10 digits)
        if (!/^\d{10}$/.test(cleanPhone)) {
            console.error('Invalid phone number format:', phoneNumber);
            return false;
        }

        // Get a random personalized message
        const message = getRandomMessage(customerName, sessionDuration);

        console.log(`Sending SMS to ${customerName}: "${message}"`);

        const response = await fetch(FAST2SMS_API_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
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
            console.log('SMS sent successfully to:', cleanPhone);
            return true;
        } else {
            console.error('SMS sending failed:', data);
            return false;
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
}
