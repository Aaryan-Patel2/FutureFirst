# Google Calendar Integration

The FutureFirst app now includes Google Calendar integration that automatically syncs your tasks, reminders, and study sessions to a dedicated calendar.

## Features

### Dedicated Calendar
- Creates a "FutureFirst - Reminders" calendar in dark purple/navy color
- All FutureFirst items sync to this dedicated calendar
- Keeps your personal calendar organized and separate

### What Gets Synced
- **Tasks**: Assignment due dates, project deadlines
- **Reminders**: Important dates and events
- **Study Sessions**: Planned study time with duration

### Settings & Configuration
- Enable/disable Calendar sync in Dashboard Settings
- Choose which types of items to sync
- Set default duration for calendar events
- Configure reminder timing before events

## How to Set Up

### 1. Enable Calendar Sync
1. Go to Dashboard → Settings
2. Find the "Google Calendar Integration" section
3. Toggle "Calendar Sync" to enabled
4. Grant Google Calendar permissions when prompted

### 2. Configure Preferences
- Choose what to sync: tasks, reminders, study sessions
- Set default event duration (15min to 2 hours)
- Set reminder time before events

### 3. Start Creating Items
- Use the Quick Task Creator on the dashboard
- Create tasks with due dates and times
- Items automatically sync to your calendar

## Using the Integration

### Quick Task Creator
Located on the main dashboard, allows you to:
- Create tasks, reminders, or study sessions
- Set due dates and times
- See real-time sync status
- Works even when offline (queued for later sync)

### Automatic Sync
- New items sync immediately when created
- Updates sync when you modify items
- Deletions remove items from calendar
- Retry mechanism for failed syncs

### Calendar Events
Each synced item includes:
- Title and description from FutureFirst
- Correct date and time
- Duration based on your settings
- Dark purple/navy color coding
- Source link back to FutureFirst app

## Technical Details

### OAuth Permissions
The integration uses the same Google OAuth setup as the Google Drive integration, with additional Calendar API permissions.

### Data Storage
- Calendar sync settings stored locally with Zustand persistence
- Pending sync queue survives app restarts
- No sensitive data stored permanently

### API Usage
- Uses Google Calendar API v3
- Respects rate limits and handles errors gracefully
- Minimal API calls through intelligent caching

## Troubleshooting

### Calendar Not Syncing
1. Check that Calendar sync is enabled in settings
2. Verify Google Calendar permissions are granted
3. Check internet connection
4. Try manual sync in settings

### Missing Calendar Events
1. Ensure due date/time is set on items
2. Check that the item type is enabled for sync
3. Look in the "FutureFirst - Reminders" calendar specifically
4. Check sync status in settings

### Permission Issues
1. Go to Dashboard Settings
2. Disable and re-enable Calendar sync
3. This will prompt for fresh permissions
4. Grant all requested Calendar permissions

## Privacy & Security

- Only creates events in your own Google Calendar
- No access to existing calendar events
- Can only modify events created by FutureFirst
- Uses secure OAuth 2.0 authentication
- No calendar data stored on FutureFirst servers

## Development

### Files Structure
```
src/
├── lib/google-calendar-service.ts    # Calendar API service
├── store/calendar-store.ts           # Sync state management
├── hooks/use-calendar-sync.ts        # Integration hook
├── components/calendar-settings.tsx  # Settings UI
└── components/quick-task-creator.tsx # Demo component
```

### Key Functions
- `googleCalendarService`: Main Calendar API interface
- `useCalendarStore`: Sync settings and queue management  
- `useCalendarSync`: Hook for components to sync items
- `CalendarSettings`: Settings UI component

### Adding Sync to Components
```typescript
import { useCalendarSync } from '@/hooks/use-calendar-sync';

const { syncItemToCalendar } = useCalendarSync();

// When creating a task
await syncItemToCalendar({
  id: 'task-id',
  title: 'Task Title',
  dueDate: new Date(),
  type: 'task'
});
```
