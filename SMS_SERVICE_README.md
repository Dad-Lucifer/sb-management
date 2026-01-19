# SMS Service Integration

## Overview
The SB Gaming Zone management system now includes automatic SMS notifications that are sent to customers when their gaming session ends.

## Features
- **Automatic SMS Sending**: When a session completes (duration expires), an SMS is automatically sent to the customer's registered phone number
- **Random Message Selection**: Each customer receives a randomly selected message from a pool of 5 different templates for variety
- **Personalized Messages**: Messages include the customer's name and session duration (where applicable)
- **Message Templates**:
  1. "Hey [Name], your session at SB Game Zone has wrapped up! Thanks for playing with us—hope you had a great time. See you again soon!"
  2. "Thanks for gaming with us, [Name]! You spent [Session Time] at SB Game Zone. Hope every minute was fun—come back soon!"
  3. "Hey [Name], that was a solid gaming session at SB Game Zone! Thanks for choosing us. Can't wait to see you again."
  4. "Game over for now, [Name]! Thanks for spending [Session Time] at SB Game Zone. Ready for the next match?"
  5. "Hey [Name], thanks for playing at SB Game Zone! Hope your session was packed with fun and excitement. See you soon!"
- **Duplicate Prevention**: The system tracks which sessions have already received SMS (both in-memory and in database) to prevent duplicate messages
- **Persistent Tracking**: SMS status is saved in Firestore, so even after page refresh, duplicate SMS won't be sent

## API Configuration
The system uses **Fast2SMS API** through a **backend proxy** to avoid CORS issues.

### Architecture
- **Frontend** (`src/lib/sms.ts`) → Calls `/api/send-sms`
- **Backend** (`api/send-sms.ts`) → Calls Fast2SMS API
- This architecture bypasses browser CORS restrictions

### Setup Instructions for Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:
   - **Name**: `FAST2SMS_API_KEY`
   - **Value**: Your Fast2SMS API key (without `VITE_` prefix)
4. Redeploy your application

### Local Development
For local development, add to your `.env` file:
```
FAST2SMS_API_KEY=your_api_key_here
```

**Note**: The API key is now stored server-side only for security.

## How It Works
1. The system checks for completed sessions every 30 seconds
2. When a session's duration expires (calculated from start time + duration + paused time), it's marked as completed
3. **Only recently completed sessions** (within the last 5 minutes) are eligible for SMS
   - This prevents sending SMS to old sessions that completed before the feature was added
   - Sessions that completed more than 5 minutes ago are automatically skipped
4. If the session hasn't received an SMS yet (`smsSent` field is not true), the system prepares to send an SMS
5. A random message template is selected from the pool of 5 templates
6. The template is personalized with the customer's name and session duration
7. The SMS is sent via Fast2SMS API
8. After successful SMS delivery, the `smsSent` field is set to `true` in Firestore
9. The session ID is also added to an in-memory Set to prevent duplicate checks

## Files Modified
- `src/lib/sms.ts` - New SMS service file with Fast2SMS integration
- `src/pages/Dashboard.tsx` - Added SMS monitoring logic
- `src/types/dashboard.ts` - Added `smsSent` field to CustomerEntry type

## Phone Number Format
- Phone numbers are stored in the format: `+91 XXXXXXXXXX`
- The SMS service automatically cleans the number before sending (removes +91 and spaces)
- Only valid 10-digit Indian phone numbers are accepted

## Testing
To test the SMS functionality:
1. Create a new session with a valid phone number
2. Set a short duration (e.g., 0.1 hours = 6 minutes)
3. Wait for the session to complete
4. Check the console logs for SMS sending status
5. The customer should receive the thank you SMS

## Error Handling
- Invalid phone numbers are logged but don't crash the system
- Failed SMS sends are logged to console
- Database update failures are caught and logged separately
