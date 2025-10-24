'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

interface QuizState {
  selectedCompetitions: string[];
  currentUserId: string | null;
  setCompetitions: (competitions: string[], userId?: string) => void;
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
  loadUserData: (userId: string) => Promise<void>;
  syncToLocalStorage: (userId: string) => Promise<void>;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      selectedCompetitions: [],
      currentUserId: null,
      
      setCompetitions: async (competitions, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        set({ selectedCompetitions: competitions });
        
        // Save to localStorage if user is logged in
        if (effectiveUserId) {
          saveUserData(effectiveUserId, STORAGE_KEYS.QUIZ_COMPETITIONS, competitions);
        }
      },
      
      setCurrentUser: (userId) => {
        const previousUserId = get().currentUserId;
        
        // If switching users, clear previous user's data
        if (previousUserId && previousUserId !== userId) {
          set({ 
            selectedCompetitions: [],
            currentUserId: userId 
          });
        } else {
          set({ currentUserId: userId });
        }
        
        // Load new user's data
        if (userId) {
          get().loadUserData(userId);
        }
      },
      
      clearUserData: () => {
        const { currentUserId } = get();
        // Note: We DON'T remove from localStorage - we want data to persist across sessions
        // Only clear the in-memory state
        console.log('[QuizStore] Clearing in-memory state for user:', currentUserId);
        set({ 
          selectedCompetitions: [],
          currentUserId: null
        });
      },
      
      loadUserData: async (userId) => {
        try {
          const competitions = loadUserData(userId, STORAGE_KEYS.QUIZ_COMPETITIONS, [] as string[]);
          set({ selectedCompetitions: competitions, currentUserId: userId });
          console.log('[QuizStore] Loaded competitions from localStorage for user:', userId, competitions);
        } catch (error) {
          console.error('[QuizStore] Failed to load user competitions:', error);
        }
      },
      
      syncToLocalStorage: async (userId) => {
        const { selectedCompetitions } = get();
        saveUserData(userId, STORAGE_KEYS.QUIZ_COMPETITIONS, selectedCompetitions);
        console.log('[QuizStore] Synced competitions to localStorage for user:', userId);
      },
    }),
    {
      name: 'quiz-storage-session',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for temporary UI state only
      partialize: (state) => ({ 
        // Only persist UI state, not user data
        currentUserId: state.currentUserId 
      }),
    }
  )
);
