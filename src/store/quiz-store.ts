'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface QuizState {
  selectedCompetitions: string[];
  setCompetitions: (competitions: string[]) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      selectedCompetitions: [
        'Business Plan',
        'Marketing',
        'Public Speaking',
      ], // Default values
      setCompetitions: (competitions) => set({ selectedCompetitions: competitions }),
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
