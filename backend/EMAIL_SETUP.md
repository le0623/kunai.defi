# Email Verification Setup

This guide explains how to set up email verification for the KunAI platform.

## Prerequisites

1. **Gmail Account** (recommended for testing)
2. **App Password** (not your regular password)

## Gmail Setup

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Google Account > Security
- Under "2-Step Verification", click "App passwords"
- Generate a new app password for "Mail"
- Copy the 16-character password

## Environment Variables

Add these variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="your-email@gmail.com"
```

## Database Migration

After updating the Prisma schema, run:

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push
```

## Installation

Install the required dependencies:

```bash
npm install nodemailer @types/nodemailer
```

## Testing

1. Start the backend server
2. Try the sign-up flow in the frontend
3. Check your email for the verification code
4. Enter the code to complete registration

## API Endpoints

### Send Verification Code
```
POST /api/auth/send-verification
Body: { "email": "user@example.com" }
```

### Verify Email Code
```
POST /api/auth/verify-email
Body: {
  "email": "user@example.com",
  "code": "123456",
  "isSignUp": true,
  "address": "0x..." // Required for sign-up
}
```

## Features

- ✅ **60-second expiration** for verification codes
- ✅ **6-digit codes** for easy entry
- ✅ **Beautiful email templates** with KunAI branding
- ✅ **Resend functionality** if code expires
- ✅ **Sign-up vs Sign-in** distinction
- ✅ **Proxy wallet creation** for new users
- ✅ **JWT token generation** after verification

## Troubleshooting

### Email not sending
- Check SMTP credentials
- Verify app password is correct
- Check firewall/network settings

### Code not working
- Codes expire after 60 seconds
- Check server logs for errors
- Verify database connection

### Gmail issues
- Use app password, not regular password
- Enable "Less secure app access" (not recommended)
- Check Gmail account settings 