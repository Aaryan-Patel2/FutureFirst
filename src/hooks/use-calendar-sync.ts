/**
 * Hook to integrate Calendar sync with tasks and reminders
 */
'use client';

import { useCallback } from 'react';
import { useCalendarStore } from '@/store/calendar-store';

export interface SyncableItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  type: 'task' | 'reminder' | 'study-session';
}

export function useCalendarSync() {
  const { 
    settings, 
    addPendingEvent, 
    removePendingEvent, 
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent 
  } = useCalendarStore();

  /**
   * Sync an item to calendar when it's created
   */
  const syncItemToCalendar = useCallback(async (item: SyncableItem) => {
    // Check if sync is enabled and this item type should be synced
    if (!settings.enabled) return null;

    const shouldSync = 
      (item.type === 'task' && settings.syncTasks) ||
      (item.type === 'reminder' && settings.syncReminders) ||
      (item.type === 'study-session' && settings.syncStudySessions);

    if (!shouldSync || !item.dueDate) return null;

    // Add to pending events for queue-based syncing
    addPendingEvent({
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      type: item.type,
    });

    return true;
  }, [settings, addPendingEvent]);

  /**
   * Direct sync an item to calendar (bypasses queue)
   */
  const directSyncToCalendar = useCallback(async (item: SyncableItem) => {
    if (!settings.enabled || !item.dueDate) return null;

    const shouldSync = 
      (item.type === 'task' && settings.syncTasks) ||
      (item.type === 'reminder' && settings.syncReminders) ||
      (item.type === 'study-session' && settings.syncStudySessions);

    if (!shouldSync) return null;

    try {
      const calendarEvent = await createCalendarEvent({
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        duration: settings.defaultDuration,
        type: item.type,
      });

      return calendarEvent;
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      return null;
    }
  }, [settings, createCalendarEvent]);

  /**
   * Update an existing calendar event
   */
  const updateCalendarItem = useCallback(async (calendarEventId: string, item: SyncableItem) => {
    if (!settings.enabled || !item.dueDate) return null;

    try {
      const calendarEvent = await updateCalendarEvent(calendarEventId, {
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        duration: settings.defaultDuration,
        type: item.type,
      });

      return calendarEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  }, [settings, updateCalendarEvent]);

  /**
   * Remove an item from calendar
   */
  const removeFromCalendar = useCallback(async (calendarEventId: string) => {
    if (!settings.enabled) return;

    try {
      await deleteCalendarEvent(calendarEventId);
      return true;
    } catch (error) {
      console.error('Error removing from calendar:', error);
      return false;
    }
  }, [settings, deleteCalendarEvent]);

  /**
   * Remove an item from the sync queue
   */
  const removeFromSyncQueue = useCallback((itemId: string) => {
    removePendingEvent(itemId);
  }, [removePendingEvent]);

  /**
   * Helper to create a study session event
   */
  const syncStudySession = useCallback(async (session: {
    title: string;
    subject?: string;
    startTime: Date;
    duration: number; // in minutes
  }) => {
    if (!settings.enabled || !settings.syncStudySessions) return null;

    try {
      const calendarEvent = await createCalendarEvent({
        title: session.subject ? `Study: ${session.subject}` : session.title,
        description: `Study session${session.subject ? ` for ${session.subject}` : ''}`,
        dueDate: session.startTime,
        duration: session.duration,
        type: 'study-session',
      });

      return calendarEvent;
    } catch (error) {
      console.error('Error syncing study session:', error);
      return null;
    }
  }, [settings, createCalendarEvent]);

  return {
    // Settings
    isSyncEnabled: settings.enabled,
    syncSettings: settings,
    
    // Main sync functions
    syncItemToCalendar,
    directSyncToCalendar,
    updateCalendarItem,
    removeFromCalendar,
    removeFromSyncQueue,
    
    // Specialized functions
    syncStudySession,
  };
}

// Helper function to create due date from text input
export function createDueDateFromInput(
  dateInput: string, 
  timeInput?: string
): Date | null {
  try {
    if (!dateInput) return null;
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    
    return date;
  } catch (error) {
    console.error('Error creating due date:', error);
    return null;
  }
}

// Helper function to format date for input fields
export function formatDateForInput(date: Date): { date: string; time: string } {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}
