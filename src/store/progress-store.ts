'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';
import { useActivityStore } from './activity-store';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

interface ProgressState {
  // User management
  currentUserId: string | null;
  
  // Tasks
  tasks: Task[];
  completedTasksCount: number;
  totalTasksCount: number;
  
  // Statistics
  weeklyProgress: number;
  monthlyProgress: number;
  
  // Actions
  setCurrentUser: (userId: string) => Promise<void>;
  clearUserData: () => void;
  
  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  
  // Sync
  syncToLocalStorage: (userId: string) => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
}

export const useProgressStore = create<ProgressState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentUserId: null,
        tasks: [],
        completedTasksCount: 0,
        totalTasksCount: 0,
        weeklyProgress: 0,
        monthlyProgress: 0,

        // Set current user and load their data
        setCurrentUser: async (userId: string) => {
          if (get().currentUserId === userId) return;
          
          console.log('[ProgressStore] Setting current user:', userId);
          set({ currentUserId: userId });
          await get().loadUserData(userId);
        },

        // Clear all user data
        clearUserData: () => {
          const { currentUserId } = get();
          if (currentUserId) {
            removeUserData(currentUserId, STORAGE_KEYS.PROGRESS_TASKS);
          }
          console.log('[ProgressStore] Clearing user data');
          set({
            currentUserId: null,
            tasks: [],
            completedTasksCount: 0,
            totalTasksCount: 0,
            weeklyProgress: 0,
            monthlyProgress: 0,
          });
        },

        // Add a new task
        addTask: async (taskData) => {
          const { currentUserId } = get();
          if (!currentUserId) return;

          const newTask: Task = {
            ...taskData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => {
            const newTasks = [...state.tasks, newTask];
            const completed = newTasks.filter(t => t.done).length;
            
            return {
              tasks: newTasks,
              completedTasksCount: completed,
              totalTasksCount: newTasks.length,
            };
          });

          // Log activity
          const activityStore = useActivityStore.getState();
          await activityStore.logActivity('TASK_CREATED', { taskTitle: newTask.title });

          // Save to localStorage
          await get().syncToLocalStorage(currentUserId);
        },

        // Update an existing task
        updateTask: async (id, updates) => {
          const { currentUserId } = get();
          if (!currentUserId) return;

          set((state) => {
            const newTasks = state.tasks.map(task =>
              task.id === id 
                ? { ...task, ...updates, updatedAt: new Date() }
                : task
            );
            const completed = newTasks.filter(t => t.done).length;
            
            return {
              tasks: newTasks,
              completedTasksCount: completed,
              totalTasksCount: newTasks.length,
            };
          });

          // Save to localStorage
          await get().syncToLocalStorage(currentUserId);
        },

        // Delete a task
        deleteTask: async (id) => {
          const { currentUserId } = get();
          if (!currentUserId) return;

          set((state) => {
            const newTasks = state.tasks.filter(task => task.id !== id);
            const completed = newTasks.filter(t => t.done).length;
            
            return {
              tasks: newTasks,
              completedTasksCount: completed,
              totalTasksCount: newTasks.length,
            };
          });

          // Save to localStorage
          await get().syncToLocalStorage(currentUserId);
        },

        // Toggle task completion
        toggleTask: async (id) => {
          const { currentUserId, tasks } = get();
          if (!currentUserId) return;

          const task = tasks.find(t => t.id === id);
          const wasCompleted = task?.done || false;

          set((state) => {
            const newTasks = state.tasks.map(task =>
              task.id === id 
                ? { ...task, done: !task.done, updatedAt: new Date() }
                : task
            );
            const completed = newTasks.filter(t => t.done).length;
            
            return {
              tasks: newTasks,
              completedTasksCount: completed,
              totalTasksCount: newTasks.length,
            };
          });

          // Log activity only when completing a task (not uncompleting)
          if (!wasCompleted && task) {
            const activityStore = useActivityStore.getState();
            await activityStore.logActivity('TASK_COMPLETED', { taskTitle: task.title });
          }

          // Save to localStorage
          await get().syncToLocalStorage(currentUserId);
        },

        // Sync current state to localStorage
        syncToLocalStorage: async (userId: string) => {
          try {
            const { tasks } = get();
            saveUserData(userId, STORAGE_KEYS.PROGRESS_TASKS, tasks);
            console.log('[ProgressStore] Synced to localStorage for user:', userId);
          } catch (error) {
            console.error('[ProgressStore] Failed to sync to localStorage:', error);
          }
        },

        // Load user data from localStorage
        loadUserData: async (userId: string) => {
          try {
            console.log('[ProgressStore] Loading user data for:', userId);
            
            const tasks = loadUserData(userId, STORAGE_KEYS.PROGRESS_TASKS, [] as Task[]);
            const completed = tasks.filter((t: Task) => t.done).length;
            
            // Calculate progress statistics
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const weeklyCompleted = tasks.filter((t: Task) => 
              t.done && new Date(t.updatedAt) >= weekAgo
            ).length;
            const monthlyCompleted = tasks.filter((t: Task) => 
              t.done && new Date(t.updatedAt) >= monthAgo
            ).length;
            
            set({
              tasks,
              completedTasksCount: completed,
              totalTasksCount: tasks.length,
              weeklyProgress: weeklyCompleted,
              monthlyProgress: monthlyCompleted,
            });
            
            console.log('[ProgressStore] Loaded tasks for user:', userId, tasks.length);
          } catch (error) {
            console.error('[ProgressStore] Failed to load user data:', error);
            set({
              tasks: [],
              completedTasksCount: 0,
              totalTasksCount: 0,
              weeklyProgress: 0,
              monthlyProgress: 0,
            });
          }
        },
      }),
      {
        name: 'progress-storage',
        // Only persist non-user-specific UI state
        partialize: (state) => ({
          // Don't persist user-specific data
        }),
      }
    )
  )
);
