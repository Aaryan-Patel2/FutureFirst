
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GccrItem, googleDriveService } from '@/lib/google-drive-service';

// Fallback mockup data
export interface GccrFile {
  name: string;
  type: 'file' | 'folder';
  date: string;
  isFavorite: boolean;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface GccrState {
  // Real Google Drive data
  items: GccrItem[];
  currentFolderId: string;
  breadcrumbs: BreadcrumbItem[];
  favorites: Set<string>; // File IDs
  isLoading: boolean;
  error: string | null;
  useRealData: boolean;
  
  // Mockup fallback data
  mockupFiles: GccrFile[];
  
  // Actions
  setItems: (items: GccrItem[]) => void;
  setCurrentFolder: (folderId: string, folderName: string) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  navigateToFolder: (folderId: string, folderName: string) => void;
  navigateToBreadcrumb: (index: number) => void;
  toggleFavorite: (id: string) => void;
  toggleFavoriteMockup: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUseRealData: (useReal: boolean) => void;
  toggleDataSource: () => void; // New toggle function
  clearError: () => void;
  
  // Data loading
  loadGccrContents: (folderId?: string, useCache?: boolean) => Promise<void>;
  searchGccr: (query: string) => Promise<GccrItem[]>;
  refreshCurrentFolder: () => Promise<void>;
}

const initialMockupFiles: GccrFile[] = [
  { name: 'Business Plan 2023.pdf', type: 'file', date: '2023-10-26', isFavorite: true },
  { name: 'Marketing Presentation Slides.pptx', type: 'file', date: '2023-10-25', isFavorite: false },
  { name: 'Archived Projects', type: 'folder', date: '2023-10-24', isFavorite: false },
  { name: 'Public Speaking Guide.docx', type: 'file', date: '2023-10-22', isFavorite: true },
  { name: 'Event Study Cases', type: 'folder', date: '2023-10-20', isFavorite: true },
  { name: '2022 National Winners', type: 'folder', date: '2023-09-15', isFavorite: false },
  { name: 'Hospitality Management Test.pdf', type: 'file', date: '2023-09-10', isFavorite: false },
];

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
      useRealData: true,
      
      // Mockup fallback data - with safe defaults
      mockupFiles: initialMockupFiles,
      
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
      
      toggleFavoriteMockup: (name) => set((state) => ({
        mockupFiles: (state.mockupFiles || []).map((file) =>
          file.name === name ? { ...file, isFavorite: !file.isFavorite } : file
        ),
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setUseRealData: (useReal) => set({ useRealData: useReal }),
      
      toggleDataSource: () => {
        const currentUseRealData = get().useRealData;
        const newUseRealData = !currentUseRealData;
        set({ 
          useRealData: newUseRealData,
          error: null, // Clear any previous errors
          isLoading: false
        });
        
        // If switching to real data, load the contents
        if (newUseRealData) {
          get().loadGccrContents();
        }
      },
      
      clearError: () => set({ error: null }),
      
      // Data loading
      loadGccrContents: async (folderId, useCache = true) => {
        const state = get();
        const targetFolderId = folderId || state.currentFolderId;
        
        // Only load if using real data
        if (!state.useRealData) {
          return;
        }
        
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
            isLoading: false,
            useRealData: true
          });
        } catch (error) {
          console.error('Failed to load GCCR contents:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load contents',
            isLoading: false,
            useRealData: false // Fall back to mockup
          });
        }
      },
      
      searchGccr: async (query: string) => {
        const state = get();
        if (!query.trim() || !state.useRealData) {
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
    }),
    {
      name: 'gccr-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        try {
          return {
            favorites: Array.from(state.favorites || new Set()),
            mockupFiles: state.mockupFiles || initialMockupFiles,
            useRealData: state.useRealData,
          };
        } catch (error) {
          console.error('Error partializing state:', error);
          return {
            favorites: [],
            mockupFiles: initialMockupFiles,
            useRealData: true,
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
            if (!Array.isArray(state.mockupFiles)) {
              state.mockupFiles = initialMockupFiles;
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
            state.mockupFiles = initialMockupFiles;
            state.breadcrumbs = initialBreadcrumbs;
            state.items = [];
            state.useRealData = true;
          }
        }
      },
    }
  )
);
