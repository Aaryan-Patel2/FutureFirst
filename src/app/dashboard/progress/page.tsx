'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const tasksData = [
  { id: 'task1', label: 'Complete Marketing Chapter 1', done: true, category: 'Marketing' },
  { id: 'task2', label: 'Practice Impromptu Speech (5 mins)', done: false, category: 'Public Speaking' },
  { id: 'task3', label: 'Review Business Law Case Studies', done: false, category: 'Business Law' },
  { id: 'task4', label: 'Draft Business Plan Executive Summary', done: true, category: 'Business Plan' },
  { id: 'task5', label: 'Take practice test for Accounting I', done: false, category: 'Accounting' },
  { id: 'task6', label: 'Research 2024 NLC location', done: true, category: 'General' },
];

export default function ProgressPlanPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState(tasksData);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task));
  };
  
  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Progress Plan</CardTitle>
            <CardDescription>Track your study tasks and stay on top of your goals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <p className="text-right text-sm text-muted-foreground mt-2">{completedTasks} of {totalTasks} tasks completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>What you need to get done.</CardDescription>
            </div>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
                <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-accent">
                    <Checkbox
                        id={task.id}
                        checked={task.done}
                        onCheckedChange={() => toggleTask(task.id)}
                    />
                    <label
                        htmlFor={task.id}
                        className={`flex-1 text-sm font-medium leading-none ${task.done ? 'line-through text-muted-foreground' : ''}`}
                    >
                        {task.label}
                    </label>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{task.category}</div>
                    </div>
                ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Calendar</CardTitle>
            <CardDescription>Visualize your study schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Sync</CardTitle>
            <CardDescription>Connect your calendar to sync deadlines.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">Sync events and due dates seamlessly.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
