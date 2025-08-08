
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, startOfDay } from 'date-fns';
import { produce } from 'immer';

const today = startOfDay(new Date());

export interface Task {
  id: string;
  label: string;
  done: boolean;
  category: string;
  dueDate: Date;
}

interface ProgressState {
  tasks: Task[];
  addTask: (newTask: Omit<Task, 'id' | 'done'>) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
}

const initialTasks: Task[] = [
  { id: 'task1', label: 'Complete Marketing Chapter 1', done: true, category: 'Marketing', dueDate: today },
  { id: 'task2', label: 'Practice Impromptu Speech (5 mins)', done: false, category: 'Public Speaking', dueDate: addDays(today, 2) },
  { id: 'task3', label: 'Review Business Law Case Studies', done: false, category: 'Business Law', dueDate: addDays(today, 5) },
  { id: 'task4', label: 'Draft Business Plan Executive Summary', done: true, category: 'Business Plan', dueDate: addDays(today, 8) },
  { id: 'task5', label: 'Take practice test for Accounting I', done: false, category: 'Accounting', dueDate: addDays(today, 12) },
  { id: 'task6', label: 'Research 2024 NLC location', done: true, category: 'General', dueDate: addDays(today, 15) },
  { id: 'task7', label: 'Update Career Portfolio', done: false, category: 'Presentation', dueDate: addDays(today, 6) },
];


export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      addTask: (newTask) => {
        set(produce((state: ProgressState) => {
            const taskToAdd: Task = {
                ...newTask,
                id: `task${Date.now()}`,
                done: false,
            };
            state.tasks.push(taskToAdd);
        }));
      },
      toggleTask: (taskId) => {
        set(produce((state: ProgressState) => {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.done = !task.done;
            }
        }));
      },
      deleteTask: (taskId) => {
        set(produce((state: ProgressState) => {
            state.tasks = state.tasks.filter(t => t.id !== taskId);
        }));
      },
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => localStorage, {
        // Zod objects with functions can't be stored directly. We need to serialize/deserialize
        reviver: (key, value: any) => {
            if (key === 'tasks') {
                return value.map((task: any) => ({ ...task, dueDate: new Date(task.dueDate) }));
            }
            return value;
        },
      }),
    }
  )
);
