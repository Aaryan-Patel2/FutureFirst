'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_POINTS, DAILY_ACTIVITY_LIMITS, getActivityDisplayName, getActivityIcon, ActivityType } from '@/store/activity-store';
import { Award } from 'lucide-react';

export function ActivityPointsGuide() {
  // Only show point-earning activities
  const pointEarningActivities = [
    {
      type: 'AI_CONVERSATION_CONTINUED' as ActivityType,
      description: 'Continue conversations with AI Study Buddy',
    },
    {
      type: 'NOTE_EDITED' as ActivityType,
      description: 'Make meaningful edits to your notes',
    },
    {
      type: 'QUIZ_TAKEN' as ActivityType,
      description: 'Complete the recommendation quiz',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" style={{ color: '#EAA83D' }} />
          How to Earn Activity Points
        </CardTitle>
        <CardDescription>
          Points reward CONSISTENCY, not quantity. Engage daily to build your streak!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-2">
            {pointEarningActivities.map(({ type, description }) => {
              const limit = DAILY_ACTIVITY_LIMITS[type as keyof typeof DAILY_ACTIVITY_LIMITS];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getActivityIcon(type)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{getActivityDisplayName(type)}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                      <div className="text-xs mt-1" style={{ color: '#EAA83D' }}>
                        Max {limit} per day
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    style={{ 
                      backgroundColor: 'rgba(234, 168, 61, 0.2)', 
                      color: '#EAA83D',
                      borderColor: 'rgba(234, 168, 61, 0.5)'
                    }}
                  >
                    +{ACTIVITY_POINTS[type]} pt
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Pro Tip:</strong> Build a daily habit! Show up consistently to maximize your points over time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
