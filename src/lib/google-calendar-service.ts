/**
 * Google Calendar API Service
 * Handles all Google Calendar API interactions for FutureFirst reminders
 */

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  colorId?: string;
  source?: {
    title: string;
    url?: string;
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  dueDate: Date;
  duration?: number; // in minutes, default 30
  type: 'task' | 'reminder' | 'study-session';
}

class GoogleCalendarService {
  private static readonly CALENDAR_NAME = 'FutureFirst - Reminders';
  private static readonly CALENDAR_COLOR = '9'; // Dark purple/navy (Google's color ID 9)
  
  /**
   * Get access token from our existing Google Drive token endpoint
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('/api/google-drive/token');
      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  private async makeCalendarRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendar API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Find or create the FutureFirst calendar
   */
  private async findOrCreateFutureFirstCalendar(): Promise<string> {
    try {
      // First, try to find existing FutureFirst calendar
      const calendars = await this.makeCalendarRequest('/users/me/calendarList');
      
      const existingCalendar = calendars.items?.find((cal: any) => 
        cal.summary === GoogleCalendarService.CALENDAR_NAME
      );
      
      if (existingCalendar) {
        console.log('Found existing FutureFirst calendar:', existingCalendar.id);
        return existingCalendar.id;
      }

      // Create new calendar if it doesn't exist
      console.log('Creating new FutureFirst calendar...');
      const newCalendar = await this.makeCalendarRequest('/calendars', {
        method: 'POST',
        body: JSON.stringify({
          summary: GoogleCalendarService.CALENDAR_NAME,
          description: 'Tasks, reminders, and study sessions from FutureFirst app',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      // Set calendar color to dark purple/navy
      await this.makeCalendarRequest(`/users/me/calendarList/${newCalendar.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          colorId: GoogleCalendarService.CALENDAR_COLOR,
        }),
      });

      console.log('Created new FutureFirst calendar:', newCalendar.id);
      return newCalendar.id;
    } catch (error) {
      console.error('Error finding/creating FutureFirst calendar:', error);
      throw new Error('Failed to set up FutureFirst calendar');
    }
  }

  /**
   * Create a new event in the FutureFirst calendar
   */
  async createEvent(eventRequest: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const calendarId = await this.findOrCreateFutureFirstCalendar();
      const duration = eventRequest.duration || 30; // Default 30 minutes
      
      const startTime = new Date(eventRequest.dueDate);
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
      
      const event: CalendarEvent = {
        summary: eventRequest.title,
        description: eventRequest.description || `${eventRequest.type} from FutureFirst app`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        colorId: GoogleCalendarService.CALENDAR_COLOR,
        source: {
          title: 'FutureFirst App',
          url: window.location.origin,
        },
      };

      const createdEvent = await this.makeCalendarRequest(`/calendars/${calendarId}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      });

      console.log('Created calendar event:', createdEvent.id);
      return createdEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event in the FutureFirst calendar
   */
  async updateEvent(eventId: string, eventRequest: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const calendarId = await this.findOrCreateFutureFirstCalendar();
      const duration = eventRequest.duration || 30;
      
      const startTime = new Date(eventRequest.dueDate);
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
      
      const event: CalendarEvent = {
        summary: eventRequest.title,
        description: eventRequest.description || `${eventRequest.type} from FutureFirst app`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        colorId: GoogleCalendarService.CALENDAR_COLOR,
      };

      const updatedEvent = await this.makeCalendarRequest(`/calendars/${calendarId}/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });

      console.log('Updated calendar event:', eventId);
      return updatedEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete an event from the FutureFirst calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const calendarId = await this.findOrCreateFutureFirstCalendar();
      
      await this.makeCalendarRequest(`/calendars/${calendarId}/events/${eventId}`, {
        method: 'DELETE',
      });

      console.log('Deleted calendar event:', eventId);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Get all FutureFirst events for a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const calendarId = await this.findOrCreateFutureFirstCalendar();
      
      const events = await this.makeCalendarRequest(
        `/calendars/${calendarId}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&orderBy=startTime&singleEvents=true`
      );

      return events.items || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Check if user has granted Calendar access
   */
  async checkCalendarAccess(): Promise<boolean> {
    try {
      await this.makeCalendarRequest('/users/me/calendarList');
      return true;
    } catch (error) {
      console.error('Calendar access check failed:', error);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
