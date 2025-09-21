# Dev Login System Implementation

## Overview
Implemented a complete development-only authentication system that allows easy user role switching without Supabase configuration.

## Key Components Modified

### 1. Login Page (`app/auth/login-page.tsx`)
- Added dev user selection buttons (Guest, Free, Pro, Admin)
- Each user type has a fixed ID (e.g., `dev-admin-001`)
- Stores user info in localStorage

### 2. API Endpoints
- **Rate Limits** (`app/api/rate-limits/route.ts`): Recognizes all `dev-*` users
- **Server Validation** (`lib/server/api.ts`): Bypasses auth for `dev-*` users
- **Usage Tracking** (`lib/usage.ts`): Skips tracking for dev users

### 3. Client-Side Auth
- **Guest User ID** (`lib/api.ts`): Checks for existing dev users before creating new ones
- **Auth Popup** (`app/components/chat-input/popover-content-auth.tsx`): Doesn't show for dev users

### 4. UI Components
- **Header** (`app/components/layout/header.tsx`): Shows logged-in state for dev users
- **User Menu** (`app/components/layout/user-menu.tsx`): Displays dev user info

## User Types & Limits
- **Admin** (`dev-admin-001`): 1000 daily messages
- **Pro** (`dev-pro-001`): 1000 daily messages  
- **Free** (`dev-free-001`): 100 daily messages
- **Guest** (`dev-guest-001`): 50 daily messages

## localStorage Keys
- `guestUserId`: Stores the dev user ID
- `devUserType`: Stores user type (admin/pro/free/guest)
- `devUserName`: Stores display name

## How to Use
1. Navigate to `/auth`
2. Select a user type
3. App recognizes user as logged in
4. All features work without real authentication