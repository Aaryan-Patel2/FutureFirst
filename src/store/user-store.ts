
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

export interface UserProfile {
  name: string;
  email: string;
  profilePictureUrl: string;
  grade: string;
  uid: string;
  hasCustomProfilePicture?: boolean; // Track if user has set a custom profile picture
  selectedCompetitions?: string[]; // Quiz competition recommendations
}

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: Partial<UserProfile> | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  initAuthListener: () => void;
  initialized: boolean;
  signOutLocal: () => void;
  clearUserData: (userId?: string) => void;
  syncToLocalStorage: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      setUser: (updates) => {
        if (updates === null) {
          set({ user: null });
          return;
        }
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : (updates as UserProfile),
        }));
      },
      updateProfile: async (updates) => {
        const current = get().user;
        if (!current) return;
        
        try {
          // Update the user data in localStorage
          const updatedProfile = { ...current, ...updates };
          saveUserData(current.uid, STORAGE_KEYS.USER_PROFILE, updatedProfile);
          
          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }));
          
          console.log('[UserStore] Updated profile in localStorage for user:', current.uid);
        } catch (error) {
          console.error('Failed to update profile:', error);
          throw error;
        }
      },
      initAuthListener: () => {
        if (get().initialized) return;
        onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            try {
              // Try to get existing profile from localStorage
              let profile = loadUserData(fbUser.uid, STORAGE_KEYS.USER_PROFILE, null as UserProfile | null);
              
              if (!profile) {
                // Create new profile using Google profile as default
                const newProfile: UserProfile = {
                  uid: fbUser.uid,
                  name: fbUser.displayName || 'Unnamed User',
                  email: fbUser.email || '',
                  profilePictureUrl: fbUser.photoURL || '',
                  grade: '11th Grade',
                  hasCustomProfilePicture: false, // New users start with Google profile picture
                };
                
                // Save to localStorage
                saveUserData(fbUser.uid, STORAGE_KEYS.USER_PROFILE, newProfile);
                profile = newProfile;
                
                console.log('[UserStore] Created new profile from Google data for user:', fbUser.uid);
              } else {
                // Update with latest auth info if needed
                const updates: Partial<UserProfile> = {};
                
                if (fbUser.email && fbUser.email !== profile.email) {
                  updates.email = fbUser.email;
                }
                
                // Handle backward compatibility - if hasCustomProfilePicture is undefined, 
                // assume it's false (using Google photo) for existing users
                const hasCustomPicture = profile.hasCustomProfilePicture ?? false;
                
                // Only update profile picture from Google if user hasn't set a custom one
                if (fbUser.photoURL && fbUser.photoURL !== profile.profilePictureUrl && !hasCustomPicture) {
                  updates.profilePictureUrl = fbUser.photoURL;
                }
                
                // Set the flag if it's undefined (backward compatibility)
                if (profile.hasCustomProfilePicture === undefined) {
                  updates.hasCustomProfilePicture = false;
                }
                
                if (fbUser.displayName && fbUser.displayName !== profile.name && 
                    ['Student Name', 'Unnamed User', ''].includes(profile.name)) {
                  updates.name = fbUser.displayName;
                }
                
                if (Object.keys(updates).length > 0) {
                  const updatedProfile = { ...profile, ...updates };
                  saveUserData(fbUser.uid, STORAGE_KEYS.USER_PROFILE, updatedProfile);
                  profile = updatedProfile;
                  
                  console.log('[UserStore] Updated profile with Google data for user:', fbUser.uid);
                }
              }
              
              set({ user: profile, loading: false });
            } catch (error) {
              console.error('Failed to sync user profile:', error);
              // Fallback to basic Firebase auth data
              const fallbackProfile: UserProfile = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Unnamed User',
                email: fbUser.email || '',
                profilePictureUrl: fbUser.photoURL || '',
                grade: '11th Grade',
                hasCustomProfilePicture: false, // Fallback also starts with Google profile picture
              };
              
              set({ user: fallbackProfile, loading: false });
              
              // Try to save fallback profile to localStorage
              try {
                saveUserData(fbUser.uid, STORAGE_KEYS.USER_PROFILE, fallbackProfile);
              } catch (saveError) {
                console.error('Failed to save fallback profile:', saveError);
              }
            }
          } else {
            set({ user: null, loading: false });
          }
        });
        set({ initialized: true });
      },
      
      clearUserData: (userId) => {
        // Clear user profile data from localStorage if userId is provided
        if (userId) {
          try {
            removeUserData(userId, STORAGE_KEYS.USER_PROFILE);
            console.log('[UserStore] Cleared profile data for user:', userId);
          } catch (error) {
            console.error('[UserStore] Failed to clear profile data:', error);
          }
        }
        
        // Clear local state
        set({ user: null });
      },
      
      syncToLocalStorage: async (userId) => {
        const { user } = get();
        if (user && user.uid === userId) {
          try {
            saveUserData(userId, STORAGE_KEYS.USER_PROFILE, user);
            console.log('[UserStore] Synced profile to localStorage for user:', userId);
          } catch (error) {
            console.error('[UserStore] Failed to sync profile to localStorage:', error);
          }
        }
      },
      
      signOutLocal: () => {
        set({ user: null });
        
        // Import and clear AI Study Buddy data when signing out
        // We do this dynamically to avoid circular dependencies
        if (typeof window !== 'undefined') {
          const aiStoreName = 'ai-study-buddy-storage';
          const storedData = localStorage.getItem(aiStoreName);
          if (storedData) {
            try {
              const parsed = JSON.parse(storedData);
              const clearedData = {
                ...parsed,
                state: {
                  conversations: [],
                  activeConversationId: null,
                  currentUserId: null,
                  loading: false,
                  syncing: false,
                }
              };
              localStorage.setItem(aiStoreName, JSON.stringify(clearedData));
            } catch (error) {
              console.error('Error clearing AI Study Buddy data:', error);
            }
          }
        }
      },
    }),
    {
      name: 'user-storage-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        // Only persist session state, not user data (that's in localStorage via our utility)
        initialized: state.initialized,
        loading: state.loading
      }),
    }
  )
);
