/**
 * Quick Task Creator with Calendar Sync
 * Example component showing how to integrate Calendar sync with task creation
 */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalendarSync, createDueDateFromInput } from '@/hooks/use-calendar-sync';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function QuickTaskCreator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [taskType, setTaskType] = useState<'task' | 'reminder' | 'study-session'>('task');
  const [isCreating, setIsCreating] = useState(false);

  const { syncItemToCalendar, isSyncEnabled } = useCalendarSync();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a task title',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create the task (in a real app, this would save to your task store/database)
      const taskId = `task-${Date.now()}`;
      const parsedDueDate = createDueDateFromInput(dueDate, dueTime);
      
      const newTask = {
        id: taskId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: parsedDueDate,
        type: taskType,
        createdAt: new Date(),
        completed: false,
      };

      // Log the task creation (replace with actual task storage)
      console.log('Created task:', newTask);

      // Sync to calendar if enabled and has due date
      if (isSyncEnabled && parsedDueDate) {
        await syncItemToCalendar({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          dueDate: parsedDueDate,
          type: taskType,
        });

        toast({
          title: 'Task Created',
          description: `Task created and ${isSyncEnabled ? 'synced to calendar' : 'saved'}`,
        });
      } else {
        toast({
          title: 'Task Created',
          description: 'Task created successfully',
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setDueTime('');
      setTaskType('task');

    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Task Creator
          {isSyncEnabled && (
            <Badge variant="secondary" className="ml-auto">
              <Calendar className="h-3 w-3 mr-1" />
              Calendar Sync On
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Create tasks, reminders, and study sessions that sync to your Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-type">Type</Label>
            <Select value={taskType} onValueChange={(value) => setTaskType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="study-session">Study Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-time">Due Time</Label>
              <Input
                id="due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {isSyncEnabled && dueDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
              <Calendar className="h-4 w-4" />
              <span>This {taskType} will be synced to your "FutureFirst - Reminders" calendar</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isCreating || !title.trim()}
            className="w-full"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create {taskType.charAt(0).toUpperCase() + taskType.slice(1)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
