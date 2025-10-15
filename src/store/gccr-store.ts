
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GccrItem, googleDriveService } from '@/lib/google-drive-service';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface GccrState {
  items: GccrItem[];
  currentFolderId: string;
  breadcrumbs: BreadcrumbItem[];
  favorites: Set<string>;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
  setItems: (items: GccrItem[]) => void;
  setCurrentFolder: (folderId: string, folderName: string) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  navigateToFolder: (folderId: string, folderName: string) => void;
  navigateToBreadcrumb: (index: number) => void;
  toggleFavorite: (id: string, userId?: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadGccrContents: (folderId?: string, useCache?: boolean) => Promise<void>;
  searchGccr: (query: string) => Promise<GccrItem[]>;
  refreshCurrentFolder: () => Promise<void>;
  getAllFavoritedItems: () => Promise<GccrItem[]>;
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
  loadUserFavorites: (userId: string) => Promise<void>;
  syncFavoritesToLocalStorage: (userId: string) => Promise<void>;
}

// Mock data removed – always using real GCCR data now.

const initialBreadcrumbs: BreadcrumbItem[] = [
  { id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_GCCR_FOLDER_ID || 'root', name: 'GCCR' }
];

export const useGccrStore = create<GccrState>()(
  persist(
    (set, get) => ({
      // Real Google Drive data - with safe defaults
      items: [],
      currentFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_GCCR_FOLDER_ID || 'root',
      breadcrumbs: initialBreadcrumbs,
      favorites: new Set<string>(),
      currentUserId: null,
      isLoading: false,
      error: null,
      
      
      // Actions
      setItems: (items) => set({ items: items || [] }),
      
      setCurrentFolder: (folderId, folderName) => set({ currentFolderId: folderId }),
      
      addBreadcrumb: (item) => set((state) => ({
        breadcrumbs: [...(state.breadcrumbs || []), item]
      })),
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs: breadcrumbs || [] }),
      
      navigateToFolder: (folderId, folderName) => {
        set((state) => ({
          currentFolderId: folderId,
          breadcrumbs: [...(state.breadcrumbs || []), { id: folderId, name: folderName }]
        }));
        get().loadGccrContents(folderId);
      },
      
      navigateToBreadcrumb: (index) => {
        const state = get();
        const breadcrumbs = state.breadcrumbs || [];
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
        set({
          breadcrumbs: newBreadcrumbs,
          currentFolderId: targetFolder?.id || 'root'
        });
        if (targetFolder) {
          get().loadGccrContents(targetFolder.id);
        }
      },
      
      toggleFavorite: async (id, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        
        if (!effectiveUserId) return;
        
        // Update local state first
        set((state) => {
          const favorites = new Set(state.favorites || new Set());
          if (favorites.has(id)) {
            favorites.delete(id);
          } else {
            favorites.add(id);
          }
          return {
            favorites,
            items: (state.items || []).map(item => ({
              ...item,
              isFavorite: favorites.has(item.id)
            }))
          };
        });
        
        // Save to localStorage
        const { favorites } = get();
        const favoritesArray = Array.from(favorites);
        saveUserData(effectiveUserId, STORAGE_KEYS.GCCR_FAVORITES, favoritesArray);
        
        console.log('[GccrStore] Saved favorites to localStorage for user:', effectiveUserId);
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      // Data loading
      loadGccrContents: async (folderId, useCache = true) => {
        const state = get();
        const targetFolderId = folderId || state.currentFolderId;
        
        set({ isLoading: true, error: null });
        
        try {
          const items = await googleDriveService.getFolderContents(targetFolderId, useCache);
          
          // Apply favorites
          const favorites = state.favorites || new Set();
          const itemsWithFavorites = (items || []).map(item => ({
            ...item,
            isFavorite: favorites.has(item.id)
          }));
          
          set({ 
            items: itemsWithFavorites, 
      isLoading: false
          });
        } catch (error) {
          console.error('Failed to load GCCR contents:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load contents',
      isLoading: false
          });
        }
      },
      
      searchGccr: async (query: string) => {
        const state = get();
    if (!query.trim()) {
          return state.items || [];
        }
        
        try {
          const results = await googleDriveService.searchGccr(query);
          const favorites = state.favorites || new Set();
          
          // Apply favorites
          return (results || []).map(item => ({
            ...item,
            isFavorite: favorites.has(item.id)
          }));
        } catch (error) {
          console.error('Search failed:', error);
          throw error;
        }
      },
      
      refreshCurrentFolder: async () => {
        const { currentFolderId } = get();
        await get().loadGccrContents(currentFolderId, false); // Force refresh
      },

      getAllFavoritedItems: async () => {
        const { favorites } = get();
        console.log('getAllFavoritedItems called with favorites:', favorites);
        
        if (!favorites || favorites.size === 0) {
          return [];
        }

        try {
          const favoritedItems: GccrItem[] = [];
          const favoriteIds = Array.from(favorites);
          console.log('Looking for favorite IDs:', favoriteIds);
          
          // Get individual file details using Google Drive API
          for (const itemId of favoriteIds) {
            try {
              console.log(`Fetching details for item: ${itemId}`);
              const item = await googleDriveService.getFileDetails(itemId);
              if (item) {
                favoritedItems.push({ ...item, isFavorite: true });
                console.log(`Found favorited item: ${item.name}`);
              }
            } catch (error) {
              console.warn(`Failed to get details for favorited item ${itemId}:`, error);
            }
          }

          console.log('Final favorited items:', favoritedItems);
          return favoritedItems;
        } catch (error) {
          console.error('Failed to get favorited items:', error);
          return [];
        }
      },
      
      setCurrentUser: (userId) => {
        const previousUserId = get().currentUserId;
        
        // If switching users, clear previous user's favorites
        if (previousUserId && previousUserId !== userId) {
          set({ 
            favorites: new Set<string>(),
            currentUserId: userId,
            items: (get().items || []).map(item => ({ ...item, isFavorite: false }))
          });
        } else {
          set({ currentUserId: userId });
        }
        
        // Load new user's favorites
        if (userId) {
          get().loadUserFavorites(userId);
        }
      },
      
      clearUserData: () => {
        const { currentUserId } = get();
        if (currentUserId) {
          removeUserData(currentUserId, STORAGE_KEYS.GCCR_FAVORITES);
        }
        set({ 
          favorites: new Set<string>(),
          currentUserId: null,
          items: (get().items || []).map(item => ({ ...item, isFavorite: false }))
        });
      },
      
      loadUserFavorites: async (userId) => {
        try {
          const favoritesArray = loadUserData(userId, STORAGE_KEYS.GCCR_FAVORITES, [] as string[]);
          const favoriteIds = new Set(favoritesArray);
          
          set({ 
            favorites: favoriteIds,
            currentUserId: userId,
            items: (get().items || []).map(item => ({
              ...item,
              isFavorite: favoriteIds.has(item.id)
            }))
          });
          
          console.log('[GccrStore] Loaded user favorites from localStorage:', favoriteIds.size);
        } catch (error) {
          console.error('[GccrStore] Failed to load user favorites:', error);
        }
      },
      
      syncFavoritesToLocalStorage: async (userId) => {
        try {
          const { favorites } = get();
          const favoritesArray = Array.from(favorites);
          saveUserData(userId, STORAGE_KEYS.GCCR_FAVORITES, favoritesArray);
          console.log('[GccrStore] Synced favorites to localStorage for user:', userId);
        } catch (error) {
          console.error('[GccrStore] Failed to sync favorites to localStorage:', error);
        }
      },
    }),
    {
      name: 'gccr-storage-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        try {
          return {
            // Only persist navigation state, not user data
            currentFolderId: state.currentFolderId,
            breadcrumbs: state.breadcrumbs,
            currentUserId: state.currentUserId
          };
        } catch (error) {
          console.error('Error partializing state:', error);
          return {
            currentFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_GCCR_FOLDER_ID || 'root',
            breadcrumbs: initialBreadcrumbs,
            currentUserId: null
          };
        }
      },
      onRehydrateStorage: () => (state) => {
        try {
          if (state) {
            // Ensure favorites is a Set
            if (!state.favorites || !(state.favorites instanceof Set)) {
              state.favorites = new Set<string>();
            }
            
            // Ensure breadcrumbs are initialized
            if (!Array.isArray(state.breadcrumbs)) {
              state.breadcrumbs = initialBreadcrumbs;
            }
            
            // Ensure items array exists
            if (!Array.isArray(state.items)) {
              state.items = [];
            }
          }
        } catch (error) {
          console.error('Error rehydrating state:', error);
          // Reset to safe defaults
          if (state) {
            state.favorites = new Set();
            state.breadcrumbs = initialBreadcrumbs;
            state.items = [];
          }
        }
      },
    }
  )
);
