'use client';

/**
 * User-specific localStorage utility
 * Handles storing data per user with isolated namespaces
 */

// Master account that should maintain raffle access
const MASTER_ACCOUNT_EMAIL = 'aaryanp0302@gmail.com';

// Storage keys for different data types
export const STORAGE_KEYS = {
  QUIZ_COMPETITIONS: 'quiz_competitions',
  NOTES: 'notes',
  AI_CONVERSATIONS: 'ai_conversations', 
  GCCR_FAVORITES: 'gccr_favorites',
  PROGRESS_TASKS: 'progress_tasks',
  USER_PROFILE: 'user_profile'
} as const;

/**
 * Generate user-specific localStorage key
 */
function getUserKey(userId: string, dataType: string): string {
  return `user_${userId}_${dataType}`;
}

/**
 * Save data to user-specific localStorage
 */
export function saveUserData<T>(userId: string, dataType: string, data: T): boolean {
  try {
    const key = getUserKey(userId, dataType);
    const serializedData = JSON.stringify({
      data,
      timestamp: Date.now(),
      userId
    });
    localStorage.setItem(key, serializedData);
    console.log(`[UserStorage] Saved ${dataType} for user:`, userId);
    return true;
  } catch (error) {
    console.error(`[UserStorage] Failed to save ${dataType} for user ${userId}:`, error);
    return false;
  }
}

/**
 * Load data from user-specific localStorage
 */
export function loadUserData<T>(userId: string, dataType: string, defaultValue: T): T {
  try {
    const key = getUserKey(userId, dataType);
    const storedData = localStorage.getItem(key);
    
    if (!storedData) {
      console.log(`[UserStorage] No stored ${dataType} found for user:`, userId);
      return defaultValue;
    }

    const parsed = JSON.parse(storedData);
    
    // Validate the data belongs to the correct user
    if (parsed.userId !== userId) {
      console.warn(`[UserStorage] Data mismatch for ${dataType}, expected user ${userId}, got ${parsed.userId}`);
      return defaultValue;
    }

    console.log(`[UserStorage] Loaded ${dataType} for user:`, userId);
    return parsed.data as T;
  } catch (error) {
    console.error(`[UserStorage] Failed to load ${dataType} for user ${userId}:`, error);
    return defaultValue;
  }
}

/**
 * Remove specific data type for a user
 */
export function removeUserData(userId: string, dataType: string): boolean {
  try {
    const key = getUserKey(userId, dataType);
    localStorage.removeItem(key);
    console.log(`[UserStorage] Removed ${dataType} for user:`, userId);
    return true;
  } catch (error) {
    console.error(`[UserStorage] Failed to remove ${dataType} for user ${userId}:`, error);
    return false;
  }
}

/**
 * Clear all data for a specific user (except master account protections)
 */
export function clearAllUserData(userId: string, userEmail?: string): void {
  try {
    // Protect master account raffle access
    const isMasterAccount = userEmail === MASTER_ACCOUNT_EMAIL;
    
    // Get all localStorage keys for this user
    const userPrefix = `user_${userId}_`;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) {
        // For master account, preserve raffle-related data
        if (isMasterAccount && key.includes('raffle')) {
          console.log(`[UserStorage] Preserving raffle data for master account:`, key);
          continue;
        }
        keysToRemove.push(key);
      }
    }
    
    // Remove the identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[UserStorage] Removed:`, key);
    });
    
    console.log(`[UserStorage] Cleared ${keysToRemove.length} items for user:`, userId);
  } catch (error) {
    console.error(`[UserStorage] Failed to clear data for user ${userId}:`, error);
  }
}

/**
 * Get all users who have data stored
 */
export function getAllUserIds(): string[] {
  try {
    const userIds = new Set<string>();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        const match = key.match(/^user_([^_]+)_/);
        if (match) {
          userIds.add(match[1]);
        }
      }
    }
    
    return Array.from(userIds);
  } catch (error) {
    console.error('[UserStorage] Failed to get user IDs:', error);
    return [];
  }
}

/**
 * Check if user has any stored data
 */
export function hasUserData(userId: string): boolean {
  try {
    const userPrefix = `user_${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`[UserStorage] Failed to check data for user ${userId}:`, error);
    return false;
  }
}

/**
 * Export user data for backup/migration
 */
export function exportUserData(userId: string): Record<string, any> {
  try {
    const userData: Record<string, any> = {};
    const userPrefix = `user_${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) {
        const dataType = key.replace(userPrefix, '');
        const value = localStorage.getItem(key);
        if (value) {
          userData[dataType] = JSON.parse(value);
        }
      }
    }
    
    return userData;
  } catch (error) {
    console.error(`[UserStorage] Failed to export data for user ${userId}:`, error);
    return {};
  }
}

/**
 * Reset all non-master account data (for testing)
 */
export function resetAllUserData(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        // Check if this belongs to master account
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // If this is master account data, check if it's raffle-related
            if (key.includes(MASTER_ACCOUNT_EMAIL.replace('@', '_').replace('.', '_')) && 
                key.includes('raffle')) {
              console.log(`[UserStorage] Preserving master account raffle data:`, key);
              continue;
            }
          } catch (e) {
            // If parsing fails, remove it
          }
        }
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[UserStorage] Reset ${keysToRemove.length} user data items`);
  } catch (error) {
    console.error('[UserStorage] Failed to reset user data:', error);
  }
}