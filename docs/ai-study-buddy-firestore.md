# AI Study Buddy - Firestore Integration

The AI Study Buddy now properly stores conversations in Firebase Firestore, ensuring that each user's conversations are saved individually and persist across sign-ins/sign-outs.

## How It Works

### User-Specific Storage
- Each conversation is stored in Firestore with a `userId` field
- Conversations are automatically filtered by the current user's UID
- When users switch accounts, conversations are properly cleared and reloaded

### Real-Time Synchronization
- **Local-First**: New conversations are created locally first for immediate UI response
- **Background Sync**: Conversations are then saved to Firestore in the background
- **Real-Time Updates**: Uses Firestore's `onSnapshot` for real-time updates across devices
- **Offline Support**: Works offline and syncs when connection is restored

### Data Flow

#### Creating a New Conversation
1. User clicks "New Conversation" button
2. Conversation is immediately added to local state
3. If user is logged in, conversation is saved to Firestore
4. Local conversation is updated with Firestore document ID
5. Real-time listener picks up the change and syncs across devices

#### User Sign-In/Sign-Out
1. **Sign-In**: `initSync()` is called with user UID
2. Existing local conversations are cleared if user changed
3. User's conversations are loaded from Firestore
4. Real-time listener is established for updates
5. **Sign-Out**: All conversation data is cleared from local storage

#### Message Handling
1. Messages are added to local conversation immediately
2. If conversation has a Firestore ID, message is synced to Firestore
3. Real-time updates propagate changes across devices

## Key Features

### Automatic User Switching
- Detects when a different user signs in
- Automatically clears previous user's data
- Loads new user's conversations from Firestore
- Maintains clean separation between users

### Hybrid Storage Strategy
- **Local Storage**: For immediate UI responsiveness and offline support
- **Firestore**: For persistence, sync, and multi-device access
- **Smart Merging**: Combines local-only conversations with Firestore data

### Error Handling
- Graceful fallbacks when Firestore is unavailable
- Continues working offline
- Automatically retries failed operations
- Preserves local data even if sync fails

## Technical Implementation

### Store Structure
```typescript
interface AiStudyBuddyState {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId: string | null; // Track current user
  // ... other fields

  // User management
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
  
  // Enhanced sync methods
  createNewConversation: (userId?: string) => Promise<void>;
  syncConversations: (userId: string) => Promise<void>;
  initSync: (userId: string) => () => void;
}
```

### Conversation Data Model
```typescript
// Local conversation
interface Conversation {
  id: string;              // Local ID
  title: string;
  messages: Message[];
  createdAt: Date;
  firestoreId?: string;    // Firestore document ID
}

// Firestore conversation
interface ChatConversation {
  id: string;              // Firestore document ID
  userId: string;          // Owner's UID
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Sync Process
1. **Initialize**: Call `initSync(userId)` when user signs in
2. **Load**: Fetch user's conversations from Firestore
3. **Merge**: Combine with any local-only conversations
4. **Subscribe**: Set up real-time listener for updates
5. **Cleanup**: Return unsubscribe function for cleanup

## Usage

### In Components
```tsx
function AiStudyBuddyPage() {
  const { createNewConversation } = useAiStudyBuddyStore();
  const { user } = useUserStore();

  const handleCreateConversation = async () => {
    if (user?.uid) {
      await createNewConversation(user.uid);
    }
  };

  // Component renders...
}
```

### In AI Study Buddy Client
```tsx
function AiStudyBuddyClient() {
  const { initSync } = useAiStudyBuddyStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = initSync(user.uid);
      return unsubscribe; // Cleanup on unmount or user change
    }
  }, [user?.uid, initSync]);
}
```

## Benefits

### For Users
- 🔒 **Privacy**: Conversations are private to each user
- 📱 **Multi-Device**: Access conversations from any device
- ⚡ **Fast**: Immediate local updates with background sync
- 🔄 **Reliable**: Works offline and syncs when online
- 🚪 **Clean**: Proper data separation between user accounts

### For Developers
- 🏗️ **Scalable**: Firestore handles multi-user data efficiently
- 🔧 **Maintainable**: Clear separation of concerns
- 🛠️ **Debuggable**: Comprehensive logging throughout sync process
- 🔄 **Resilient**: Graceful error handling and recovery
- ⚡ **Performant**: Local-first with background sync

## Database Structure

### Firestore Collection: `conversations`
```
conversations/
  {docId}/
    userId: string          // Owner's UID
    title: string          // Conversation title
    messages: array        // Array of message objects
      - role: 'user'|'assistant'
      - content: string
      - timestamp: Date
    createdAt: Timestamp   // When conversation was created
    updatedAt: Timestamp   // Last modification time
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations are private to each user
    match /conversations/{docId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

This implementation ensures that AI Study Buddy conversations are properly stored per user, persist across sessions, and maintain privacy and data integrity.
