
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Note {
  id: number;
  title: string;
  content: string;
  lastModified: string;
  isFavorite: boolean;
}

interface NotesState {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'lastModified' | 'isFavorite'>) => Note;
  updateNote: (id: number, updates: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  toggleFavorite: (id: number) => void;
}

const mockNotes: Note[] = [
    { id: 1, title: 'Marketing Midterm Study Guide', content: '# Marketing Concepts\n\n- SWOT Analysis\n- 4 Ps of Marketing\n- Target Audience', lastModified: '2 hours ago', isFavorite: true },
    { id: 2, title: 'Business Plan Ideas', content: '## Idea 1: Eco-friendly packaging\n\n* **Target Market:** Environmentally conscious consumers\n* **Value Prop:** Reduce plastic waste', lastModified: '1 day ago', isFavorite: true },
    { id: 3, title: 'Public Speaking Tips', content: '- Practice in front of a mirror\n- Know your audience\n- Use gestures effectively', lastModified: '3 days ago', isFavorite: false },
  ];
  

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: mockNotes,
      addNote: (note) => {
        const newNote: Note = {
          ...note,
          id: Date.now(),
          lastModified: 'Just now',
          isFavorite: false,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return newNote;
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        }));
      },
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },
      toggleFavorite: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
          ),
        }));
      },
    }),
    {
      name: 'notes-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
