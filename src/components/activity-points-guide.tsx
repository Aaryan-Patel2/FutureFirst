'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_POINTS, getActivityDisplayName, getActivityIcon, ActivityType } from '@/store/activity-store';
import { Info } from 'lucide-react';

export function ActivityPointsGuide() {
  // Group activities by point value
  const activityGroups = [
    {
      title: 'High Value Activities',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
      activities: [
        'AI_CONVERSATION_STARTED',
        'QUIZ_TAKEN',
      ] as ActivityType[],
    },
    {
      title: 'Medium Value Activities',
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50',
      activities: [
        'TASK_COMPLETED',
        'NOTE_CREATED',
        'AI_CONVERSATION_CONTINUED',
        'DOCUMENT_UPLOADED',
      ] as ActivityType[],
    },
    {
      title: 'Engagement Activities',
      color: 'bg-green-500/20 text-green-400 border-green-400/50',
      activities: [
        'TASK_CREATED',
        'RAFFLE_CODE_ENTERED',
        'NOTE_EDITED',
        'GCCR_FAVORITED',
      ] as ActivityType[],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-cyan-400" />
          How to Earn Activity Points
        </CardTitle>
        <CardDescription>
          Stay active and engaged to earn points! Here's what counts:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activityGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${group.color.split(' ')[0]}`} />
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.activities.map((activityType) => (
                <div
                  key={activityType}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getActivityIcon(activityType)}</span>
                    <span className="text-sm">{getActivityDisplayName(activityType)}</span>
                  </div>
                  <Badge variant="outline" className={group.color}>
                    +{ACTIVITY_POINTS[activityType]} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Pro Tip:</strong> Complete tasks and engage with AI Study Buddy for maximum points!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
