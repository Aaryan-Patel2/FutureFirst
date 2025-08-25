/**
 * Calendar Store
 * Manages Google Calendar sync settings and state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { googleCalendarService, CreateEventRequest, CalendarEvent } from '@/lib/google-calendar-service';

interface CalendarSyncSettings {
  enabled: boolean;
  syncTasks: boolean;
  syncReminders: boolean;
  syncStudySessions: boolean;
  defaultDuration: number; // in minutes
  reminderOffset: number; // minutes before event
}

interface PendingCalendarEvent {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  type: 'task' | 'reminder' | 'study-session';
  calendarEventId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  errorMessage?: string;
}

interface CalendarStore {
  // Settings
  settings: CalendarSyncSettings;
  updateSettings: (settings: Partial<CalendarSyncSettings>) => void;
  
  // Calendar access
  hasCalendarAccess: boolean;
  isCheckingAccess: boolean;
  checkCalendarAccess: () => Promise<void>;
  
  // Events management
  pendingEvents: PendingCalendarEvent[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  
  // Actions
  addPendingEvent: (event: Omit<PendingCalendarEvent, 'id' | 'syncStatus'>) => void;
  removePendingEvent: (eventId: string) => void;
  syncPendingEvents: () => Promise<void>;
  syncSingleEvent: (eventId: string) => Promise<void>;
  
  // Direct calendar operations
  createCalendarEvent: (request: CreateEventRequest) => Promise<CalendarEvent | null>;
  updateCalendarEvent: (eventId: string, request: CreateEventRequest) => Promise<CalendarEvent | null>;
  deleteCalendarEvent: (calendarEventId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      // Initial settings
      settings: {
        enabled: false,
        syncTasks: true,
        syncReminders: true,
        syncStudySessions: true,
        defaultDuration: 30,
        reminderOffset: 15,
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      // Calendar access
      hasCalendarAccess: false,
      isCheckingAccess: false,

      checkCalendarAccess: async () => {
        set({ isCheckingAccess: true });
        try {
          const hasAccess = await googleCalendarService.checkCalendarAccess();
          set({ hasCalendarAccess: hasAccess, isCheckingAccess: false });
        } catch (error) {
          console.error('Error checking calendar access:', error);
          set({ hasCalendarAccess: false, isCheckingAccess: false });
        }
      },

      // Events state
      pendingEvents: [],
      isSyncing: false,
      lastSyncAt: null,

      // Add pending event
      addPendingEvent: (event) => {
        const newEvent: PendingCalendarEvent = {
          ...event,
          id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          syncStatus: 'pending',
        };

        set((state) => ({
          pendingEvents: [...state.pendingEvents, newEvent]
        }));

        // Auto-sync if enabled
        const { settings } = get();
        if (settings.enabled) {
          get().syncSingleEvent(newEvent.id);
        }
      },

      removePendingEvent: (eventId) => {
        set((state) => ({
          pendingEvents: state.pendingEvents.filter(e => e.id !== eventId)
        }));
      },

      // Sync all pending events
      syncPendingEvents: async () => {
        const { settings, pendingEvents } = get();
        if (!settings.enabled || pendingEvents.length === 0) return;

        set({ isSyncing: true });

        try {
          const updatedEvents = [...pendingEvents];

          for (let i = 0; i < updatedEvents.length; i++) {
            const event = updatedEvents[i];
            
            if (event.syncStatus === 'synced') continue;

            // Check if we should sync this type of event
            const shouldSync = 
              (event.type === 'task' && settings.syncTasks) ||
              (event.type === 'reminder' && settings.syncReminders) ||
              (event.type === 'study-session' && settings.syncStudySessions);

            if (!shouldSync) continue;

            try {
              const request: CreateEventRequest = {
                title: event.title,
                description: event.description,
                dueDate: event.dueDate,
                duration: settings.defaultDuration,
                type: event.type,
              };

              const calendarEvent = await googleCalendarService.createEvent(request);
              
              updatedEvents[i] = {
                ...event,
                calendarEventId: calendarEvent.id,
                syncStatus: 'synced',
                errorMessage: undefined,
              };

            } catch (error) {
              console.error(`Error syncing event ${event.id}:`, error);
              updatedEvents[i] = {
                ...event,
                syncStatus: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          }

          set({ 
            pendingEvents: updatedEvents,
            lastSyncAt: new Date(),
            isSyncing: false 
          });

        } catch (error) {
          console.error('Error syncing events:', error);
          set({ isSyncing: false });
        }
      },

      // Sync single event
      syncSingleEvent: async (eventId) => {
        const { settings, pendingEvents } = get();
        if (!settings.enabled) return;

        const eventIndex = pendingEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const event = pendingEvents[eventIndex];
        
        // Check if we should sync this type of event
        const shouldSync = 
          (event.type === 'task' && settings.syncTasks) ||
          (event.type === 'reminder' && settings.syncReminders) ||
          (event.type === 'study-session' && settings.syncStudySessions);

        if (!shouldSync) return;

        try {
          const request: CreateEventRequest = {
            title: event.title,
            description: event.description,
            dueDate: event.dueDate,
            duration: settings.defaultDuration,
            type: event.type,
          };

          const calendarEvent = await googleCalendarService.createEvent(request);

          set((state) => ({
            pendingEvents: state.pendingEvents.map((e, i) => 
              i === eventIndex 
                ? {
                    ...e,
                    calendarEventId: calendarEvent.id,
                    syncStatus: 'synced' as const,
                    errorMessage: undefined,
                  }
                : e
            )
          }));

        } catch (error) {
          console.error(`Error syncing event ${eventId}:`, error);
          
          set((state) => ({
            pendingEvents: state.pendingEvents.map((e, i) => 
              i === eventIndex 
                ? {
                    ...e,
                    syncStatus: 'error' as const,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                  }
                : e
            )
          }));
        }
      },

      // Direct calendar operations
      createCalendarEvent: async (request) => {
        const { settings } = get();
        if (!settings.enabled) return null;

        try {
          return await googleCalendarService.createEvent(request);
        } catch (error) {
          console.error('Error creating calendar event:', error);
          return null;
        }
      },

      updateCalendarEvent: async (eventId, request) => {
        const { settings } = get();
        if (!settings.enabled) return null;

        try {
          return await googleCalendarService.updateEvent(eventId, request);
        } catch (error) {
          console.error('Error updating calendar event:', error);
          return null;
        }
      },

      deleteCalendarEvent: async (calendarEventId) => {
        const { settings } = get();
        if (!settings.enabled) return;

        try {
          await googleCalendarService.deleteEvent(calendarEventId);
          
          // Remove from pending events if exists
          set((state) => ({
            pendingEvents: state.pendingEvents.filter(e => e.calendarEventId !== calendarEventId)
          }));
        } catch (error) {
          console.error('Error deleting calendar event:', error);
        }
      },
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({
        settings: state.settings,
        pendingEvents: state.pendingEvents,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
