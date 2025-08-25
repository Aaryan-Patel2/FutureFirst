
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, updateUserProfile } from '@/lib/firestore';

export interface UserProfile {
  name: string;
  email: string;
  profilePictureUrl: string;
  grade: string;
  uid: string;
}

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: Partial<UserProfile> | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  initAuthListener: () => void;
  initialized: boolean;
  signOutLocal: () => void;
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
          await updateUserProfile(current.uid, updates);
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }));
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
              // Try to get existing profile from Firestore
              let profile = await getUserProfile(fbUser.uid);
              
              if (!profile) {
                // Create new profile in Firestore
                const newProfile = {
                  name: fbUser.displayName || 'Unnamed User',
                  email: fbUser.email || '',
                  profilePictureUrl: fbUser.photoURL || '',
                  grade: '11th Grade',
                };
                await createUserProfile(fbUser.uid, newProfile);
                profile = { ...newProfile, uid: fbUser.uid };
              } else {
                // Update with latest auth info if needed
                const updates: Partial<UserProfile> = {};
                if (fbUser.email && fbUser.email !== profile.email) {
                  updates.email = fbUser.email;
                }
                if (fbUser.photoURL && fbUser.photoURL !== profile.profilePictureUrl) {
                  updates.profilePictureUrl = fbUser.photoURL;
                }
                if (fbUser.displayName && fbUser.displayName !== profile.name && 
                    ['Student Name', 'Unnamed User', ''].includes(profile.name)) {
                  updates.name = fbUser.displayName;
                }
                
                if (Object.keys(updates).length > 0) {
                  await updateUserProfile(fbUser.uid, updates);
                  profile = { ...profile, ...updates };
                }
              }
              
              set({ user: profile, loading: false });
            } catch (error) {
              console.error('Failed to sync user profile:', error);
              // Fallback to basic Firebase auth data
              set({
                user: {
                  uid: fbUser.uid,
                  name: fbUser.displayName || 'Unnamed User',
                  email: fbUser.email || '',
                  profilePictureUrl: fbUser.photoURL || '',
                  grade: '11th Grade',
                },
                loading: false,
              });
            }
          } else {
            set({ user: null, loading: false });
          }
        });
        set({ initialized: true });
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
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
