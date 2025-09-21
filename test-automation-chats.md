# Test Automation Chats

## Available Chats in Database

### Chat 1
- **ID**: `6acac358-0e13-42c5-817c-cb3130fe659e`
- **User ID**: `dec2e41f-3521-426e-9cd7-1d43846a85ba`
- **Title**: Automation Run - 2025-09-21 06:28
- **URL**: http://localhost:3000/c/6acac358-0e13-42c5-817c-cb3130fe659e

### Chat 2
- **ID**: `6b2ba4a7-d693-44f2-a8f9-58ac3419355a`
- **User ID**: `94f1e311-b937-41ca-a27d-d179c4c16ef8`
- **Title**: Automation Test - 06:28
- **URL**: http://localhost:3000/c/6b2ba4a7-d693-44f2-a8f9-58ac3419355a

## How It Works

The system has been modified with a development hack that allows opening ANY chat by ID, regardless of the user who created it:

1. Navigate to `/c/[chatId]` with any chat ID
2. The system bypasses authentication in development mode
3. If chat not found in user's chats, it fetches directly from database (bypassing user check)
4. The chat will be temporarily added to your chats list and displayed

## Implementation Details

### Files Modified:
- `app/c/[chatId]/page.tsx` - Skip authentication redirect in development mode
- `lib/chat-store/chats/provider.tsx` - Added `fetchChatDirectly()` function, handle no userId
- `app/components/chat/chat.tsx` - Added loading state for automation chats
- `lib/chat-store/messages/api.ts` - Added chat existence validation
- `components/prompt-kit/code-block.tsx` - Fixed shiki TypeError

### Key Changes:
1. **Server-side bypass**: The page component now allows unauthenticated access in development
2. **Client-side fetching**: ChatsProvider can fetch any chat by ID directly
3. **Loading states**: Proper loading UI while fetching automation chats
4. **Error handling**: Foreign key constraints handled gracefully

### Security Note
This is a DEVELOPMENT ONLY hack. In production, you should properly handle user authentication and ownership. The hack only works when `NODE_ENV=development`.