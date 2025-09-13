
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GccrItem, googleDriveService } from '@/lib/google-drive-service';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface GccrState {
  items: GccrItem[];
  currentFolderId: string;
  breadcrumbs: BreadcrumbItem[];
  favorites: Set<string>;
  isLoading: boolean;
  error: string | null;
  setItems: (items: GccrItem[]) => void;
  setCurrentFolder: (folderId: string, folderName: string) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  navigateToFolder: (folderId: string, folderName: string) => void;
  navigateToBreadcrumb: (index: number) => void;
  toggleFavorite: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadGccrContents: (folderId?: string, useCache?: boolean) => Promise<void>;
  searchGccr: (query: string) => Promise<GccrItem[]>;
  refreshCurrentFolder: () => Promise<void>;
  getAllFavoritedItems: () => Promise<GccrItem[]>;
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
      
      toggleFavorite: (id) => set((state) => {
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
      }),
      
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
    }),
    {
      name: 'gccr-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        try {
          return {
            favorites: Array.from(state.favorites || new Set()),
            
          };
        } catch (error) {
          console.error('Error partializing state:', error);
          return {
            favorites: [],
          };
        }
      },
      onRehydrateStorage: () => (state) => {
        try {
          if (state) {
            // Convert favorites array back to Set, ensuring it's always a valid array
            const favoritesArray = Array.isArray(state.favorites) ? state.favorites : [];
            state.favorites = new Set(favoritesArray);
            
            // Ensure other arrays are properly initialized
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
