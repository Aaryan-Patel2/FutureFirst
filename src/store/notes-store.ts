'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

export interface NoteFile {
  name: string;
  dataUri: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  isFavorite: boolean;
  fileForDigitization?: NoteFile | null;
}

interface NotesState {
  notes: Note[];
  currentUserId: string | null;
  loading: boolean;
  addNote: (note: Omit<Note, 'id' | 'lastModified' | 'isFavorite'>, userId?: string) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>, userId?: string) => Promise<void>;
  deleteNote: (id: string, userId?: string) => Promise<void>;
  toggleFavorite: (id: string, userId?: string) => Promise<void>;
  setFileForDigitization: (id: string, file: NoteFile) => void;
  clearFileForDigitization: (id: string) => void;
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
  loadUserData: (userId: string) => Promise<void>;
  syncToLocalStorage: (userId: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      currentUserId: null,
      loading: false,

      addNote: async (noteData, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        if (!effectiveUserId) {
          throw new Error('No user ID provided');
        }

        const newNote: Note = {
          ...noteData,
          id: Date.now().toString(),
          lastModified: new Date().toISOString(),
          isFavorite: false,
        };

        set((state) => ({ notes: [...state.notes, newNote] }));
        
        // Save to localStorage
        const updatedNotes = [...get().notes];
        saveUserData(effectiveUserId, STORAGE_KEYS.NOTES, updatedNotes);
        
        console.log('[NotesStore] Added note to localStorage for user:', effectiveUserId);
        return newNote;
      },

      updateNote: async (id, updates, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        if (!effectiveUserId) return;

        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id 
              ? { ...note, ...updates, lastModified: new Date().toISOString() }
              : note
          ),
        }));

        // Save to localStorage
        const updatedNotes = get().notes;
        saveUserData(effectiveUserId, STORAGE_KEYS.NOTES, updatedNotes);
        
        console.log('[NotesStore] Updated note in localStorage for user:', effectiveUserId);
      },

      deleteNote: async (id, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        if (!effectiveUserId) return;

        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));

        // Save to localStorage
        const updatedNotes = get().notes;
        saveUserData(effectiveUserId, STORAGE_KEYS.NOTES, updatedNotes);
        
        console.log('[NotesStore] Deleted note from localStorage for user:', effectiveUserId);
      },

      toggleFavorite: async (id, userId) => {
        const effectiveUserId = userId || get().currentUserId;
        if (!effectiveUserId) return;

        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id 
              ? { ...note, isFavorite: !note.isFavorite, lastModified: new Date().toISOString() }
              : note
          ),
        }));

        // Save to localStorage
        const updatedNotes = get().notes;
        saveUserData(effectiveUserId, STORAGE_KEYS.NOTES, updatedNotes);
        
        console.log('[NotesStore] Toggled favorite in localStorage for user:', effectiveUserId);
      },

      setFileForDigitization: (id, file) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, fileForDigitization: file } : note
          ),
        }));
      },

      clearFileForDigitization: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, fileForDigitization: null } : note
          ),
        }));
      },

      setCurrentUser: async (userId) => {
        const previousUserId = get().currentUserId;
        
        if (previousUserId && previousUserId !== userId) {
          set({ notes: [], currentUserId: userId });
        } else {
          set({ currentUserId: userId });
        }
        
        if (userId) {
          await get().loadUserData(userId);
        }
      },

      clearUserData: () => {
        const { currentUserId } = get();
        if (currentUserId) {
          removeUserData(currentUserId, STORAGE_KEYS.NOTES);
        }
        set({ 
          notes: [], 
          currentUserId: null,
          loading: false 
        });
      },

      loadUserData: async (userId) => {
        try {
          set({ loading: true });
          
          const notes = loadUserData(userId, STORAGE_KEYS.NOTES, [] as Note[]);
          set({ 
            notes, 
            currentUserId: userId,
            loading: false 
          });
          
          console.log('[NotesStore] Loaded notes from localStorage for user:', userId, notes.length);
        } catch (error) {
          console.error('[NotesStore] Failed to load user notes:', error);
          set({ loading: false });
        }
      },

      syncToLocalStorage: async (userId) => {
        const { notes } = get();
        saveUserData(userId, STORAGE_KEYS.NOTES, notes);
        console.log('[NotesStore] Synced notes to localStorage for user:', userId);
      },
    }),
    {
      name: 'notes-storage-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        currentUserId: state.currentUserId,
        loading: state.loading
      }),
    }
  )
);
