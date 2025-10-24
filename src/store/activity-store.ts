'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

// Activity types and their point values
export const ACTIVITY_POINTS = {
  AI_CONVERSATION_STARTED: 5,
  AI_CONVERSATION_CONTINUED: 3,
  NOTE_CREATED: 3,
  NOTE_EDITED: 2,
  GCCR_FAVORITED: 1,
  TASK_COMPLETED: 4,
  TASK_CREATED: 2,
  QUIZ_TAKEN: 5,
  RAFFLE_CODE_ENTERED: 2,
  DOCUMENT_UPLOADED: 3,
} as const;

export type ActivityType = keyof typeof ACTIVITY_POINTS;

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: Date;
  points: number;
  metadata?: {
    taskTitle?: string;
    noteName?: string;
    conversationId?: string;
    [key: string]: any;
  };
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  activities: Activity[];
  totalPoints: number;
}

interface ActivityState {
  // User management
  currentUserId: string | null;
  
  // Activities
  activities: Activity[];
  dailyActivities: Map<string, DailyActivity>;
  totalPoints: number;
  
  // Actions
  setCurrentUser: (userId: string) => Promise<void>;
  clearUserData: () => void;
  
  // Activity tracking
  logActivity: (type: ActivityType, metadata?: Activity['metadata']) => Promise<void>;
  
  // Analytics
  getWeeklyActivityData: () => Array<{
    date: string;
    day: string;
    points: number;
    activityCount: number;
  }>;
  getDailyBreakdown: (date: string) => {
    [key in ActivityType]?: number;
  };
  getTotalPointsForPeriod: (startDate: Date, endDate: Date) => number;
  
  // Sync
  syncToLocalStorage: (userId: string) => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
}

export const useActivityStore = create<ActivityState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentUserId: null,
        activities: [],
        dailyActivities: new Map(),
        totalPoints: 0,

        // Set current user and load their data
        setCurrentUser: async (userId: string) => {
          if (get().currentUserId === userId) return;
          
          console.log('[ActivityStore] Setting current user:', userId);
          set({ currentUserId: userId });
          await get().loadUserData(userId);
        },

        // Clear all user data
        clearUserData: () => {
          const { currentUserId } = get();
          // Note: We DON'T remove from localStorage - we want data to persist across sessions
          // Only clear the in-memory state
          console.log('[ActivityStore] Clearing in-memory state for user:', currentUserId);
          set({
            currentUserId: null,
            activities: [],
            dailyActivities: new Map(),
            totalPoints: 0,
          });
        },

        // Log a new activity
        logActivity: async (type: ActivityType, metadata?: Activity['metadata']) => {
          const { currentUserId, activities } = get();
          if (!currentUserId) {
            console.warn('[ActivityStore] Cannot log activity: no user logged in');
            return;
          }

          const now = new Date();
          const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const points = ACTIVITY_POINTS[type];

          const newActivity: Activity = {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: now,
            points,
            metadata,
          };

          // Update activities array
          const updatedActivities = [...activities, newActivity];

          // Update daily activities map
          const dailyActivities = new Map(get().dailyActivities);
          const dayData = dailyActivities.get(dateKey) || {
            date: dateKey,
            activities: [],
            totalPoints: 0,
          };

          dayData.activities.push(newActivity);
          dayData.totalPoints += points;
          dailyActivities.set(dateKey, dayData);

          // Calculate new total points
          const totalPoints = get().totalPoints + points;

          set({
            activities: updatedActivities,
            dailyActivities,
            totalPoints,
          });

          // Auto-sync to localStorage
          await get().syncToLocalStorage(currentUserId);

          console.log(`[ActivityStore] Logged activity: ${type} (+${points} points)`);
        },

        // Get weekly activity data for chart
        getWeeklyActivityData: () => {
          const today = new Date();
          const weekData = [];

          for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            
            const dayData = get().dailyActivities.get(dateKey);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            weekData.push({
              date: dateKey,
              day: dayName,
              points: dayData?.totalPoints || 0,
              activityCount: dayData?.activities.length || 0,
            });
          }

          return weekData;
        },

        // Get breakdown of activities for a specific day
        getDailyBreakdown: (date: string) => {
          const dayData = get().dailyActivities.get(date);
          if (!dayData) return {};

          const breakdown: { [key in ActivityType]?: number } = {};
          dayData.activities.forEach(activity => {
            breakdown[activity.type] = (breakdown[activity.type] || 0) + 1;
          });

          return breakdown;
        },

        // Get total points for a date range
        getTotalPointsForPeriod: (startDate: Date, endDate: Date) => {
          const { dailyActivities } = get();
          let total = 0;

          dailyActivities.forEach((dayData) => {
            const date = new Date(dayData.date);
            if (date >= startDate && date <= endDate) {
              total += dayData.totalPoints;
            }
          });

          return total;
        },

        // Sync to localStorage
        syncToLocalStorage: async (userId: string) => {
          const { activities, dailyActivities, totalPoints } = get();
          
          // Convert Map to array for storage
          const dailyActivitiesArray = Array.from(dailyActivities.entries());
          
          saveUserData(userId, STORAGE_KEYS.ACTIVITY_LOG, {
            activities,
            dailyActivities: dailyActivitiesArray,
            totalPoints,
          });
          
          console.log('[ActivityStore] Synced to localStorage');
        },

        // Load user data from localStorage
        loadUserData: async (userId: string) => {
          console.log('[ActivityStore] Loading user data for:', userId);
          
          const data = loadUserData(userId, STORAGE_KEYS.ACTIVITY_LOG, {
            activities: [],
            dailyActivities: [],
            totalPoints: 0
          });
          
          if (data && data.activities) {
            // Convert array back to Map
            const dailyActivitiesMap = new Map<string, DailyActivity>(data.dailyActivities || []);
            
            // Convert date strings back to Date objects
            const activities = (data.activities || []).map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
            }));

            set({
              activities,
              dailyActivities: dailyActivitiesMap,
              totalPoints: data.totalPoints || 0,
            });
            
            console.log('[ActivityStore] Loaded user data:', {
              activitiesCount: activities.length,
              totalPoints: data.totalPoints || 0,
            });
          } else {
            console.log('[ActivityStore] No existing data found');
            set({
              activities: [],
              dailyActivities: new Map(),
              totalPoints: 0,
            });
          }
        },
      }),
      {
        name: 'activity-storage',
        partialize: (state) => ({
          currentUserId: state.currentUserId,
        }),
      }
    )
  )
);

// Helper function to get activity display name
export function getActivityDisplayName(type: ActivityType): string {
  const names: Record<ActivityType, string> = {
    AI_CONVERSATION_STARTED: 'Started AI Chat',
    AI_CONVERSATION_CONTINUED: 'Continued AI Chat',
    NOTE_CREATED: 'Created Note',
    NOTE_EDITED: 'Edited Note',
    GCCR_FAVORITED: 'Favorited Resource',
    TASK_COMPLETED: 'Completed Task',
    TASK_CREATED: 'Created Task',
    QUIZ_TAKEN: 'Took Quiz',
    RAFFLE_CODE_ENTERED: 'Entered Raffle',
    DOCUMENT_UPLOADED: 'Uploaded Document',
  };
  return names[type];
}

// Helper function to get activity icon/emoji
export function getActivityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    AI_CONVERSATION_STARTED: '💬',
    AI_CONVERSATION_CONTINUED: '💭',
    NOTE_CREATED: '📝',
    NOTE_EDITED: '✏️',
    GCCR_FAVORITED: '⭐',
    TASK_COMPLETED: '✅',
    TASK_CREATED: '📋',
    QUIZ_TAKEN: '🎯',
    RAFFLE_CODE_ENTERED: '🎟️',
    DOCUMENT_UPLOADED: '📄',
  };
  return icons[type];
}
