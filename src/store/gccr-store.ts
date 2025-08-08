
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GccrFile {
  name: string;
  type: 'file' | 'folder';
  date: string;
  isFavorite: boolean;
}

interface GccrState {
  files: GccrFile[];
  toggleFavorite: (name: string) => void;
}

const initialFiles: GccrFile[] = [
  { name: 'Business Plan 2023.pdf', type: 'file', date: '2023-10-26', isFavorite: true },
  { name: 'Marketing Presentation Slides.pptx', type: 'file', date: '2023-10-25', isFavorite: false },
  { name: 'Archived Projects', type: 'folder', date: '2023-10-24', isFavorite: false },
  { name: 'Public Speaking Guide.docx', type: 'file', date: '2023-10-22', isFavorite: true },
  { name: 'Event Study Cases', type: 'folder', date: '2023-10-20', isFavorite: true },
  { name: '2022 National Winners', type: 'folder', date: '2023-09-15', isFavorite: false },
  { name: 'Hospitality Management Test.pdf', type: 'file', date: '2023-09-10', isFavorite: false },
];

export const useGccrStore = create<GccrState>()(
  persist(
    (set) => ({
      files: initialFiles,
      toggleFavorite: (name) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.name === name ? { ...file, isFavorite: !file.isFavorite } : file
          ),
        }));
      },
    }),
    {
      name: 'gccr-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
