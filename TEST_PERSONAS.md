# ChiStartupHub Test Personas

**Purpose:** QA testing of critical user workflows
**Last Updated:** January 2, 2026

---

## Test Accounts

### Persona 1: Maya Chen - First-Time Founder
**Role:** Founder seeking funding
**Email:** maya.chen.test@gmail.com
**Password:** TestFounder123!

**Background:**
- Pre-seed stage SaaS startup
- Looking for $500K seed funding
- Sector: Enterprise Software
- Chicago-based, 6 months in

**Test Scenarios:**
- [ ] Sign up as new user
- [ ] Complete founder profile
- [ ] Post a fundraising ask
- [ ] View connection requests
- [ ] Update ask details
- [ ] Mark ask as resolved

---

### Persona 2: Marcus Johnson - Experienced Entrepreneur
**Role:** Serial founder / Helper
**Email:** marcus.j.test@gmail.com
**Password:** TestHelper456!

**Background:**
- Exited 2 startups previously
- Angel investor on the side
- Sector: Consumer Tech
- Active in Chicago ecosystem

**Test Scenarios:**
- [ ] Login with existing account
- [ ] Browse founder asks
- [ ] Offer to help a founder
- [ ] Bookmark resources
- [ ] Export saved resources
- [ ] Update notification settings

---

### Persona 3: Sofia Rodriguez - Resource Seeker
**Role:** Early-stage founder
**Email:** sofia.r.test@gmail.com
**Password:** TestSeeker789!

**Background:**
- Idea stage, validating market
- Looking for co-founder
- Sector: Healthcare Tech
- New to Chicago startup scene

**Test Scenarios:**
- [ ] Explore without logging in
- [ ] Sign up and complete onboarding
- [ ] Browse accelerators & incubators
- [ ] Download the Startup Toolkit
- [ ] Post a co-founder ask
- [ ] Save workspace locations

---

### Persona 4: David Kim - Investor Connector
**Role:** VC / Advisor
**Email:** david.kim.test@gmail.com
**Password:** TestInvestor101!

**Background:**
- Partner at early-stage VC fund
- Scouting Chicago deals
- Focused on B2B SaaS
- Looking to mentor founders

**Test Scenarios:**
- [ ] Browse funding opportunities
- [ ] View founder profiles
- [ ] Connect with multiple founders
- [ ] Check Stories/Blueprints
- [ ] Review community resources

---

## Critical User Workflows to Test

### Flow 1: New User Onboarding
```
Landing Page → "Get Started" → Sign Up Form → Email Verification →
Role Selection → Profile Setup → Dashboard
```
**Success Criteria:**
- All steps complete without error
- Profile data persists correctly
- Redirect to appropriate page based on role

### Flow 2: Founder Posting an Ask
```
Login → Opportunities → "Post an Ask" → Select Category →
Fill Details → Set Preferences → Submit → See Ask Live
```
**Success Criteria:**
- Form validates all required fields
- Ask appears in Opportunities list
- Founder sees it in their profile

### Flow 3: Helper Connecting with Founder
```
Browse Opportunities → Click "I Can Help" → Fill Context →
Submit → Founder Receives Email → Founder Reviews in Profile
```
**Success Criteria:**
- Connection request created in database
- Email sent to founder (check Resend logs)
- Request appears in founder's profile tab

### Flow 4: Resource Discovery & Saving
```
Resources Page → Browse Sections → Click Bookmark →
View Saved Resources → Export (optional)
```
**Success Criteria:**
- Bookmarks persist across sessions
- Saved page shows all bookmarks
- Export generates valid file

### Flow 5: Profile Management
```
Profile → Edit Tab → Update Fields → Save →
Refresh → Verify Changes Persisted
```
**Success Criteria:**
- All fields save correctly
- Avatar upload works
- LinkedIn/website URLs validate

### Flow 6: Settings & Notifications
```
Settings → Toggle Notifications → Save →
Refresh → Verify Toggles Persisted
```
**Success Criteria:**
- All toggles save to database
- Changes reflect immediately
- Email preferences respected

---

## Test Environment Setup

### Creating Test Accounts in Supabase

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Click "Add User"
   - Enter email/password
   - Confirm email manually

2. **Via the App:**
   - Use signup flow
   - Check email for verification
   - Complete profile setup

### Clearing Test Data

```sql
-- Remove test user data (run in Supabase SQL Editor)
DELETE FROM connection_requests
WHERE requester_email LIKE '%test@gmail.com';

DELETE FROM founder_asks
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%test@gmail.com'
);

DELETE FROM bookmarks
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%test@gmail.com'
);

-- Keep user accounts but reset their activity
```

---

## Bug Report Template

**Issue Title:** [Brief description]

**Persona:** [Which test persona]
**Flow:** [Which workflow]
**Step:** [Where it failed]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach if relevant]

**Browser/Device:**
[Chrome/Safari, Desktop/Mobile]

**Severity:**
- [ ] Critical (blocks workflow)
- [ ] High (major feature broken)
- [ ] Medium (inconvenient but workaround exists)
- [ ] Low (cosmetic/minor)

---

## Testing Checklist Summary

### Authentication
- [ ] Sign up with email
- [ ] Sign up with Google OAuth
- [ ] Login with email
- [ ] Login with Google
- [ ] Password reset flow
- [ ] Logout

### Founder Asks
- [ ] Post new ask (all 3 categories)
- [ ] View own asks
- [ ] Edit ask
- [ ] Delete/deactivate ask
- [ ] Receive connection request
- [ ] Accept/decline request

### Helper Flow
- [ ] Browse asks
- [ ] Filter by category/sector
- [ ] Search asks
- [ ] Submit help offer
- [ ] Receive acceptance email
- [ ] Receive decline email

### Resources
- [ ] Browse all resource pages
- [ ] Download toolkit PDF
- [ ] Bookmark resources
- [ ] View saved resources
- [ ] Remove bookmarks
- [ ] Submit new resource

### Profile & Settings
- [ ] View profile
- [ ] Edit profile fields
- [ ] Upload avatar
- [ ] Update notification preferences
- [ ] Verify changes persist

### Navigation & UX
- [ ] All links work (no 404s)
- [ ] Mobile menu functions
- [ ] Back button works correctly
- [ ] Loading states appear
- [ ] Error messages are clear

---

*Use this document to track QA testing progress before each release.*
