# ADSSIMSIM - Cashback Platform PRD

## Original Problem Statement
1. Host the Startup_1-main app in Emergent preview environment
2. Modify UI elements (remove PRO badge, crown icons, change Partner Brands icon)
3. Run security vulnerability testing and fix discovered issues

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn-ui
- **Backend**: Supabase (hosted BaaS)
- **Database**: Supabase PostgreSQL

## Tech Stack
- Vite 5.x, React 18, TypeScript
- Tailwind CSS, Radix UI (shadcn/ui)
- Supabase Client, Framer Motion, React Query, React Router DOM
- **NEW**: DOMPurify (input sanitization)

## What's Been Implemented

### 2026-01-17 - Initial Hosting
- Extracted and configured Startup_1-main.zip
- Updated Vite config for port 3000 and allowed hosts
- Dependencies installed with yarn

### 2026-01-17 - UI Modifications
- Changed "Active Deals" display to show exact count (no "+")
- Changed Partner Brands icon from Shield to Building2
- Removed PRO badge from Dashboard button
- Removed crown icon from ADSSIMSIM logo and Dashboard button

### 2026-01-17 - Security Vulnerability Fixes
**CRITICAL Fixes:**
1. **XSS Protection** - Added DOMPurify sanitization for:
   - Company signup form (company name)
   - User signup form (full name, state, city)
   - Campaign creation form (title, description)

2. **Email Validation** - Added validation to reject:
   - SQL injection patterns (e.g., `admin'--`, `'; DROP TABLE`)
   - Invalid email formats

3. **Security Headers** - Added CSP and security meta tags:
   - Content-Security-Policy with frame-ancestors 'none'
   - X-Frame-Options: DENY (clickjacking protection)
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin

4. **URL Validation** - Campaign URLs now only allow http/https protocols
   - Blocks javascript: and data: protocol attacks

**Files Created/Modified:**
- `/app/frontend/src/lib/sanitize.ts` (NEW)
- `/app/frontend/src/lib/campaignValidation.ts` (MODIFIED)
- `/app/frontend/src/components/auth/CompanySignupForm.tsx` (MODIFIED)
- `/app/frontend/src/components/auth/UserSignupForm.tsx` (MODIFIED)
- `/app/frontend/index.html` (MODIFIED)

## Environment
- Supabase URL: https://fgugwcgrhepgkareudlc.supabase.co
- Preview URL: https://70e71fe1-90c3-4dd9-82a2-c5013008d8d0.preview.emergentagent.com

## Core Requirements (Static)
- User authentication (Supabase Auth)
- Company/Brand registration and campaign management
- User dashboard with cashback tracking
- Premium subscription system
- Fraud detection and prevention
- Wallet management for users and companies

## User Personas
1. **End Users** - Earn cashback by clicking deals
2. **Brand Partners** - Create and manage ad campaigns
3. **Admins** - Manage fraud rules, verify conversions

## Prioritized Backlog
### P0 (Critical)
- [x] Security vulnerability fixes (XSS, email validation, CSP)

### P1 (High)
- [ ] Server-side input validation (Supabase RLS policies)
- [ ] Rate limiting for signup and campaign creation
- [ ] Comprehensive penetration testing

### P2 (Medium)
- [ ] Add more robust email validation edge cases
- [ ] Implement password strength requirements
- [ ] Add CAPTCHA for signup forms

## Next Tasks
- Test full campaign creation flow with brand account
- Verify conversion tracking webhook security
- Consider adding rate limiting on frontend

### 2026-05-27 - Video Display Bug Fix
**Issue**: Uploaded videos not displaying on campaign detail page
**Root Cause**: 
1. CSP blocking media from Supabase storage (missing `media-src` directive)
2. MOV format not universally supported in browsers
3. CampaignVideoPlayer returned `null` on video error, hiding entire component

**Fixes Applied:**
1. Updated CSP in `index.html` to include `media-src 'self' https://*.supabase.co blob: data:`
2. Added graceful fallback in `CampaignVideoPlayer.tsx` - shows poster image when video fails
3. Added format-specific error message for MOV files recommending MP4
4. Updated `VideoAdMedia.tsx` with video error handling
5. Added warning in campaign creation form about MOV format compatibility

**Files Modified:**
- `/app/frontend/index.html`
- `/app/frontend/src/components/campaign/CampaignVideoPlayer.tsx`
- `/app/frontend/src/components/campaign/VideoAdMedia.tsx`
- `/app/frontend/src/components/brand/CampaignCreationForm.tsx`

### 2026-05-27 - MOV Format Rejection
**Change**: Reject MOV video uploads, only accept MP4/WebM
**Reason**: MOV format has inconsistent browser support

**Implementation:**
1. Added video format validation in `uploadToStorage` function
2. Updated file input `accept` attribute to only allow `video/mp4,video/webm`
3. Updated upload hint text to "MP4 or WebM only (max 100MB)"
4. Added clear error message when MOV upload is attempted

**File Modified:**
- `/app/frontend/src/components/brand/CampaignCreationForm.tsx`
