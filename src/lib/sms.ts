/**
 * SMS Service using Fast2SMS API via backend proxy
 * Sends SMS notifications to customers
 */


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
        // Get a random personalized message
        const message = getRandomMessage(customerName, sessionDuration);

        console.log(`Sending SMS to ${customerName}: "${message}"`);

        // Call our backend API endpoint instead of Fast2SMS directly
        // This avoids CORS issues
        const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber,
                message,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('SMS sent successfully to:', phoneNumber);
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
