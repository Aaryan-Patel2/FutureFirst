'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

// Activity types and their point values
// NEW SYSTEM: Focus on CONSISTENCY over quantity
// Only reward proactive engagement activities, limited per day
export const ACTIVITY_POINTS = {
  // POINT-EARNING ACTIVITIES (1 point each, limited per day)
  AI_CONVERSATION_CONTINUED: 1,  // Max 3 per day
  NOTE_EDITED: 1,                 // Max 5 per day
  QUIZ_TAKEN: 1,                  // Max 1 per day
  
  // NON-POINT ACTIVITIES (tracked but no points)
  AI_CONVERSATION_STARTED: 0,
  NOTE_CREATED: 0,
  GCCR_FAVORITED: 0,
  TASK_COMPLETED: 0,
  TASK_CREATED: 0,
  RAFFLE_CODE_ENTERED: 0,
  DOCUMENT_UPLOADED: 0,
} as const;

// Daily limits for point-earning activities
export const DAILY_ACTIVITY_LIMITS = {
  AI_CONVERSATION_CONTINUED: 3,
  NOTE_EDITED: 5,
  QUIZ_TAKEN: 1,
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
          const { currentUserId, activities, dailyActivities } = get();
          if (!currentUserId) {
            console.warn('[ActivityStore] Cannot log activity: no user logged in');
            return;
          }

          const now = new Date();
          const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const points = ACTIVITY_POINTS[type];

          // Check daily limit for point-earning activities
          if (points > 0 && type in DAILY_ACTIVITY_LIMITS) {
            const limit = DAILY_ACTIVITY_LIMITS[type as keyof typeof DAILY_ACTIVITY_LIMITS];
            const todayData = dailyActivities.get(dateKey);
            
            if (todayData) {
              const todayCount = todayData.activities.filter(a => a.type === type && a.points > 0).length;
              
              if (todayCount >= limit) {
                console.log(`[ActivityStore] Daily limit reached for ${type} (${todayCount}/${limit})`);
                // Still log the activity but with 0 points
                const newActivity: Activity = {
                  id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type,
                  timestamp: now,
                  points: 0, // No points awarded due to daily limit
                  metadata: { ...metadata, limitReached: true },
                };
                
                const updatedActivities = [...activities, newActivity];
                const updatedDailyActivities = new Map(dailyActivities);
                const dayData = updatedDailyActivities.get(dateKey)!;
                dayData.activities.push(newActivity);
                updatedDailyActivities.set(dateKey, dayData);
                
                set({
                  activities: updatedActivities,
                  dailyActivities: updatedDailyActivities,
                });
                
                await get().syncToLocalStorage(currentUserId);
                return;
              }
            }
          }

          // Prevent duplicate activities within a short time window (5 seconds)
          const recentActivities = activities.filter(a => {
            const timeDiff = now.getTime() - new Date(a.timestamp).getTime();
            return timeDiff < 5000 && a.type === type;
          });

          // Check for duplicate based on type and metadata
          const isDuplicate = recentActivities.some(a => {
            if (type === 'NOTE_EDITED' && metadata?.noteName && a.metadata?.noteName) {
              return a.metadata.noteName === metadata.noteName;
            }
            if (type === 'TASK_COMPLETED' && metadata?.taskTitle && a.metadata?.taskTitle) {
              return a.metadata.taskTitle === metadata.taskTitle;
            }
            if (type === 'AI_CONVERSATION_CONTINUED' && metadata?.conversationId && a.metadata?.conversationId) {
              return a.metadata.conversationId === metadata.conversationId;
            }
            return false;
          });

          if (isDuplicate) {
            console.log(`[ActivityStore] Skipped duplicate activity: ${type} (within 5s window)`);
            return;
          }

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
          const updatedDailyActivities = new Map(dailyActivities);
          const dayData = updatedDailyActivities.get(dateKey) || {
            date: dateKey,
            activities: [],
            totalPoints: 0,
          };

          dayData.activities.push(newActivity);
          dayData.totalPoints += points;
          updatedDailyActivities.set(dateKey, dayData);

          // Calculate new total points
          const totalPoints = get().totalPoints + points;

          set({
            activities: updatedActivities,
            dailyActivities: updatedDailyActivities,
            totalPoints,
          });

          // Auto-sync to localStorage
          await get().syncToLocalStorage(currentUserId);

          console.log(`[ActivityStore] Logged activity: ${type} (+${points} points, total: ${totalPoints})`);
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
    QUIZ_TAKEN: 'Took Recommendation Quiz',
    RAFFLE_CODE_ENTERED: 'Entered Raffle',
    DOCUMENT_UPLOADED: 'Uploaded Document',
  };
  return names[type];
}

// Helper function to check if activity earns points
export function isPointEarningActivity(type: ActivityType): boolean {
  return type === 'AI_CONVERSATION_CONTINUED' || 
         type === 'NOTE_EDITED' || 
         type === 'QUIZ_TAKEN';
}

// Helper function to get daily limit for an activity
export function getDailyLimit(type: ActivityType): number | null {
  if (type in DAILY_ACTIVITY_LIMITS) {
    return DAILY_ACTIVITY_LIMITS[type as keyof typeof DAILY_ACTIVITY_LIMITS];
  }
  return null;
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
