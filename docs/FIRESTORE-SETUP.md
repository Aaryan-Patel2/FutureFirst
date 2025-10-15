# Firestore Setup Instructions

## Required Firestore Indexes

Your application requires several composite indexes for Firestore queries to work properly. When you see console errors about missing indexes, follow the provided links to create them automatically, or create them manually using the instructions below.

### 1. Favorites Collection Index

**Fields:**
- `userId` (Ascending)
- `createdAt` (Ascending)
- `__name__` (Ascending)

**Firebase Console URL:** 
```
https://console.firebase.google.com/v1/r/project/fbla-edge/firestore/indexes?create_composite=...
```

### 2. Notes Collection Index

**Fields:**
- `userId` (Ascending) 
- `updatedAt` (Ascending)
- `__name__` (Ascending)

### 3. Tasks Collection Index (if needed)

**Fields:**
- `userId` (Ascending)
- `dueDate` (Ascending)
- `__name__` (Ascending)

## How to Create Indexes

### Option 1: Automatic (Recommended)
1. Run your application and trigger the queries that need indexes
2. Check the browser console for Firestore index error messages
3. Click the provided links in the error messages
4. Firebase will automatically create the required indexes

### Option 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`fbla-edge`)
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Select the collection and add the required fields as listed above

## Security Rules

Make sure to deploy the firestore.rules file to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

## Troubleshooting

### Index Creation Errors
- Wait 5-10 minutes after creating indexes before testing
- Indexes need time to build, especially for large collections
- Check the Firebase Console for index build status

### Permission Errors
- Ensure firestore.rules are deployed correctly
- Verify user authentication is working
- Check that userId fields match the authenticated user's UID

### Data Isolation Issues
- All user-specific data should include a `userId` field
- Queries should always filter by the current user's ID
- Test with multiple user accounts to verify isolation

## Testing User Isolation

1. **Create test data with User A:**
   - Add some notes, favorites, or tasks
   - Note the specific content

2. **Switch to User B:**
   - Log out and log in with a different account
   - Verify you see a clean slate (no User A data)
   - Create different content

3. **Return to User A:**
   - Log back in with the original account
   - Verify you only see User A's original data
   - User B's content should not appear

## Index URLs (Auto-generated from errors)

When you encounter index errors, the console will provide specific URLs like:

```
https://console.firebase.google.com/v1/r/project/fbla-edge/firestore/indexes?create_composite=Cktwcm9qZWN0cy9mYmxhLWVkZ2UvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2Zhdm9yaXRlcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

Click these URLs to automatically create the required indexes.
