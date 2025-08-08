
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  name: string;
  grade: string;
  email: string;
}

interface UserState {
  user: User;
  setUser: (user: Partial<User>) => void;
}

const initialUser: User = {
  name: 'Student Name',
  grade: '11th Grade',
  email: 'student@example.com',
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUser,
      setUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
