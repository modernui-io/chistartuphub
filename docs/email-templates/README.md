# ChiStartup Hub Email Templates

Branded email templates for Supabase Authentication. All templates follow the Bureau design system with dark backgrounds, monospace accents, and clean typography.

## Installation

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template below, copy the HTML content and paste it into the corresponding template
3. Update the **Subject** line as noted

## Templates

### 1. Confirm Sign Up
- **File:** `confirm-signup.html`
- **Subject:** `Welcome to ChiStartup Hub - Confirm Your Email`

### 2. Reset Password
- **File:** `reset-password.html`
- **Subject:** `Reset Your Password - ChiStartup Hub`

### 3. Magic Link
- **File:** `magic-link.html`
- **Subject:** `Sign in to ChiStartup Hub`

### 4. Invite User
- **File:** `invite-user.html`
- **Subject:** `You're Invited to ChiStartup Hub`

### 5. Change Email Address
- **File:** `change-email.html`
- **Subject:** `Confirm Your New Email Address - ChiStartup Hub`

## Design Features

- **Dark background** (#050A14) matching the app
- **Bureau-style header** with CS logo and monospace category tags
- **Clear CTA buttons** in white with uppercase monospace text
- **Fallback link** in a code block for copy/paste
- **Security notices** in colored alert boxes
- **Consistent footer** with branding and contact info

## Sender Configuration

Already configured in Supabase SMTP settings:
- **From:** `ChiStartup Hub <noreply@chistartuphub.com>`
- **Reply-To:** `hello@chistartuphub.com`

## Testing

To test emails:
1. Create a new account to test sign-up confirmation
2. Use "Forgot Password" to test reset email
3. Update email in settings to test change email
4. Use magic link sign-in to test that flow

## Notes

- Templates use Supabase variables: `{{ .ConfirmationURL }}`, etc.
- All links expire based on Supabase settings (default: 24 hours for signup, 1 hour for others)
- Mobile-responsive design with inline styles
