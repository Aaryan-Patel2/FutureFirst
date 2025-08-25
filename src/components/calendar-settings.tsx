/**
 * Calendar Settings Component
 * Allows users to configure Google Calendar sync for FutureFirst reminders
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useCalendarStore } from '@/store/calendar-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export function CalendarSettings() {
  const {
    settings,
    updateSettings,
    hasCalendarAccess,
    isCheckingAccess,
    checkCalendarAccess,
    pendingEvents,
    isSyncing,
    lastSyncAt,
    syncPendingEvents,
  } = useCalendarStore();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await checkCalendarAccess();
      setIsInitializing(false);
    };
    initialize();
  }, [checkCalendarAccess]);

  const handleEnableSync = async (enabled: boolean) => {
    if (enabled && !hasCalendarAccess) {
      // Redirect to Google OAuth for Calendar permissions
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive.file' // Keep existing Drive permissions
      ].join(' ');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/settings')}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      window.location.href = authUrl;
      return;
    }

    updateSettings({ enabled });
    
    if (enabled && pendingEvents.length > 0) {
      await syncPendingEvents();
    }
  };

  const syncStatusCounts = {
    pending: pendingEvents.filter(e => e.syncStatus === 'pending').length,
    synced: pendingEvents.filter(e => e.syncStatus === 'synced').length,
    error: pendingEvents.filter(e => e.syncStatus === 'error').length,
  };

  if (isInitializing || isCheckingAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Checking calendar permissions...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your FutureFirst tasks and reminders to a dedicated "FutureFirst - Reminders" calendar in dark purple/navy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Calendar Sync</Label>
            <p className="text-sm text-muted-foreground">
              {hasCalendarAccess 
                ? "Connected to Google Calendar" 
                : "Requires Google Calendar permissions"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasCalendarAccess ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
            <Switch
              checked={settings.enabled && hasCalendarAccess}
              onCheckedChange={handleEnableSync}
            />
          </div>
        </div>

        {!hasCalendarAccess && settings.enabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Calendar sync is enabled but you haven't granted Calendar permissions yet. 
              Toggle the switch above to connect your Google Calendar.
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Settings - Only show if sync is enabled and connected */}
        {settings.enabled && hasCalendarAccess && (
          <>
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Sync Preferences</h4>
              
              {/* Event Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-tasks">Tasks</Label>
                  <Switch
                    id="sync-tasks"
                    checked={settings.syncTasks}
                    onCheckedChange={(checked) => updateSettings({ syncTasks: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-reminders">Reminders</Label>
                  <Switch
                    id="sync-reminders"
                    checked={settings.syncReminders}
                    onCheckedChange={(checked) => updateSettings({ syncReminders: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-study-sessions">Study Sessions</Label>
                  <Switch
                    id="sync-study-sessions"
                    checked={settings.syncStudySessions}
                    onCheckedChange={(checked) => updateSettings({ syncStudySessions: checked })}
                  />
                </div>
              </div>

              {/* Duration Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-duration">Default Duration</Label>
                  <Select 
                    value={settings.defaultDuration.toString()} 
                    onValueChange={(value) => updateSettings({ defaultDuration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminder-offset">Reminder Before</Label>
                  <Select 
                    value={settings.reminderOffset.toString()} 
                    onValueChange={(value) => updateSettings({ reminderOffset: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            {pendingEvents.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Sync Status</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncPendingEvents()}
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{syncStatusCounts.pending}</div>
                    <div className="text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{syncStatusCounts.synced}</div>
                    <div className="text-muted-foreground">Synced</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{syncStatusCounts.error}</div>
                    <div className="text-muted-foreground">Errors</div>
                  </div>
                </div>

                {lastSyncAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last sync: {lastSyncAt.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Creates a dedicated "FutureFirst - Reminders" calendar in dark purple/navy</li>
            <li>Automatically syncs new tasks, reminders, and study sessions</li>
            <li>Updates events when you modify them in FutureFirst</li>
            <li>Removes events from calendar when deleted from FutureFirst</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
