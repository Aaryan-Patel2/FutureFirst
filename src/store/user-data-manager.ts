'use client';

// Central user data manager to coordinate all stores when user switches
import { useUserStore } from './user-store';
import { useQuizStore } from './quiz-store';
import { useNotesStore } from './notes-store';
import { useGccrStore } from './gccr-store';
import { useProgressStore } from './progress-store';
import { useAiStudyBuddyStore } from './ai-study-buddy-store';

export class UserDataManager {
  private static instance: UserDataManager;
  private currentUserId: string | null = null;
  private isInitialized = false;

  static getInstance(): UserDataManager {
    if (!UserDataManager.instance) {
      UserDataManager.instance = new UserDataManager();
    }
    return UserDataManager.instance;
  }

  // Initialize all stores when user logs in
  async initializeUserData(userId: string) {
    if (this.currentUserId === userId && this.isInitialized) {
      console.log('User data already initialized for user:', userId);
      return;
    }

    console.log('Initializing user data for user:', userId);
    
    try {
      // Set current user in all stores
      const userStore = useUserStore.getState();
      const quizStore = useQuizStore.getState();
      const notesStore = useNotesStore.getState();
      const gccrStore = useGccrStore.getState();
      const progressStore = useProgressStore.getState();
      const aiStore = useAiStudyBuddyStore.getState();

      // Clear any previous user's data and set new user
      await quizStore.setCurrentUser(userId);
      await notesStore.setCurrentUser(userId);
      await gccrStore.setCurrentUser(userId);
      await progressStore.setCurrentUser(userId);
      await aiStore.setCurrentUser(userId);
      // Note: userStore manages itself through Firebase Auth listener
      
      this.currentUserId = userId;
      this.isInitialized = true;
      
      console.log('Successfully initialized user data for:', userId);
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  }

  // Clear all user data when user logs out
  clearAllUserData() {
    console.log('Clearing all user data');
    
    try {
      const userStore = useUserStore.getState();
      const quizStore = useQuizStore.getState();
      const notesStore = useNotesStore.getState();
      const gccrStore = useGccrStore.getState();
      const progressStore = useProgressStore.getState();
      const aiStore = useAiStudyBuddyStore.getState();

      // Clear all stores
      userStore.clearUserData(this.currentUserId || undefined);
      quizStore.clearUserData();
      notesStore.clearUserData();
      gccrStore.clearUserData();
      progressStore.clearUserData();
      aiStore.clearUserData();
      
      this.currentUserId = null;
      this.isInitialized = false;
      
      console.log('Successfully cleared all user data');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Sync all stores to localStorage (useful for ensuring data consistency)
  async syncAllToLocalStorage(userId: string) {
    console.log('Syncing all stores to localStorage for user:', userId);
    
    try {
      const userStore = useUserStore.getState();
      const quizStore = useQuizStore.getState();
      const notesStore = useNotesStore.getState();
      const gccrStore = useGccrStore.getState();
      const progressStore = useProgressStore.getState();
      const aiStore = useAiStudyBuddyStore.getState();

      // Sync all stores to localStorage
      await Promise.all([
        userStore.syncToLocalStorage(userId),
        quizStore.syncToLocalStorage(userId),
        notesStore.syncToLocalStorage(userId),
        gccrStore.syncFavoritesToLocalStorage(userId),
        progressStore.syncToLocalStorage(userId),
        aiStore.syncToLocalStorage(userId),
      ]);
      
      console.log('Successfully synced all stores to localStorage');
    } catch (error) {
      console.error('Failed to sync stores to localStorage:', error);
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  isUserInitialized(): boolean {
    return this.isInitialized;
  }
}

// Hook to use the UserDataManager
export function useUserDataManager() {
  return UserDataManager.getInstance();
}
