'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays, startOfDay, isWithinInterval, isSameDay } from 'date-fns';

const today = startOfDay(new Date());

const tasksData = [
  { id: 'task1', label: 'Complete Marketing Chapter 1', done: true, category: 'Marketing', dueDate: today },
  { id: 'task2', label: 'Practice Impromptu Speech (5 mins)', done: false, category: 'Public Speaking', dueDate: addDays(today, 2) },
  { id: 'task3', label: 'Review Business Law Case Studies', done: false, category: 'Business Law', dueDate: addDays(today, 5) },
  { id: 'task4', label: 'Draft Business Plan Executive Summary', done: true, category: 'Business Plan', dueDate: addDays(today, 8) },
  { id: 'task5', label: 'Take practice test for Accounting I', done: false, category: 'Accounting', dueDate: addDays(today, 12) },
  { id: 'task6', label: 'Research 2024 NLC location', done: true, category: 'General', dueDate: addDays(today, 15) },
  { id: 'task7', label: 'Update Career Portfolio', done: false, category: 'Presentation', dueDate: addDays(today, 6) },
];

export default function ProgressPlanPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [tasks, setTasks] = useState(tasksData);
  const [activeTab, setActiveTab] = useState('all');
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // If a date is selected, clear the active tab so the view defaults to the selected date
    if (date) {
      setActiveTab('');
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task));
  };
  
  const filteredTasks = useMemo(() => {
    if (selectedDate) {
      return tasks.filter(task => isSameDay(task.dueDate, selectedDate));
    }
    
    const now = today;
    if (activeTab === '7days') {
      const next7Days = { start: now, end: addDays(now, 7) };
      return tasks.filter(task => isWithinInterval(task.dueDate, next7Days));
    }
    if (activeTab === '14days') {
      const next14Days = { start: now, end: addDays(now, 14) };
      return tasks.filter(task => isWithinInterval(task.dueDate, next14Days));
    }
    
    return tasks; // 'all' tab
  }, [tasks, activeTab, selectedDate]);

  const completedTasks = filteredTasks.filter(t => t.done).length;
  const totalTasks = filteredTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const daysWithTasks = useMemo(() => tasks.map(t => t.dueDate), [tasks]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Progress Plan</CardTitle>
            <CardDescription>Track your study tasks and stay on top of your goals. Currently viewing: <span className="text-primary font-semibold">{selectedDate ? selectedDate.toLocaleDateString() : activeTab}</span> tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <p className="text-right text-sm text-muted-foreground mt-2">{completedTasks} of {totalTasks} tasks completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Tabs defaultValue="all" value={activeTab} onValueChange={value => { setSelectedDate(undefined); setActiveTab(value); }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="7days">Next 7 Days</TabsTrigger>
                <TabsTrigger value="14days">Next 14 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
                <div className="space-y-4">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
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
                )) : <p className="text-center text-muted-foreground py-10">No tasks in this period.</p>}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Calendar</CardTitle>
            <CardDescription>Select a day to view its tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md"
              modifiers={{
                hasTask: daysWithTasks,
              }}
              modifiersStyles={{
                hasTask: {
                    border: '2px solid hsl(var(--primary))',
                    color: 'hsl(var(--primary))'
                },
                selected: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                }
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Manage Tasks</CardTitle>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
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
