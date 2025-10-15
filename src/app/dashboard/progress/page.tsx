
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays, startOfDay, isWithinInterval, isSameDay, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressStore, Task } from '@/store/progress-store';

const today = startOfDay(new Date());

export default function ProgressPlanPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { tasks, addTask, toggleTask, deleteTask } = useProgressStore();
  const [activeTab, setActiveTab] = useState('all');
  
  // State for the "Add Task" dialog
  const [taskName, setTaskName] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setActiveTab('');
    }
  };
  
  const handleAddTask = () => {
    if (taskName && taskCategory && taskDueDate) {
        addTask({
            title: taskName,
            description: taskCategory,
            dueDate: startOfDay(taskDueDate),
            done: false,
            priority: 'medium',
        });
        // Reset form and close dialog
        setTaskName('');
        setTaskCategory('');
        setTaskDueDate(undefined);
        setIsDialogOpen(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let sortedTasks = [...tasks].sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

    if (selectedDate) {
      return sortedTasks.filter(task => {
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isSameDay(taskDate, selectedDate);
      });
    }
    
    const now = today;
    if (activeTab === '7days') {
      const next7Days = { start: now, end: addDays(now, 7) };
      return sortedTasks.filter(task => {
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isWithinInterval(taskDate, next7Days);
      });
    }
    if (activeTab === '14days') {
      const next14Days = { start: now, end: addDays(now, 14) };
      return sortedTasks.filter(task => {
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isWithinInterval(taskDate, next14Days);
      });
    }
    
    return sortedTasks; // 'all' tab
  }, [tasks, activeTab, selectedDate]);

  const completedTasks = filteredTasks.filter(t => t.done).length;
  const totalTasks = filteredTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const daysWithTasks = useMemo(() => tasks.map(t => t.dueDate), [tasks]);
  
  const currentViewText = () => {
    if (selectedDate) {
      return selectedDate.toLocaleDateString();
    }
    if (activeTab === '7days') {
      return 'next 7 days';
    }
    if (activeTab === '14days') {
      return 'next 14 days';
    }
    return 'all';
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Progress Plan</CardTitle>
            <CardDescription>Track your study tasks and stay on top of your goals. Currently viewing: <span className="text-cyan-400 font-semibold">{currentViewText()}</span> tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
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
                    <div key={task.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-secondary group">
                    <Checkbox
                        id={task.id}
                        checked={task.done}
                        onCheckedChange={() => toggleTask(task.id)}
                    />
                    <label
                        htmlFor={task.id}
                        className={`flex-1 text-sm font-medium leading-none ${task.done ? 'line-through text-muted-foreground' : ''}`}
                    >
                        {task.title}
                    </label>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{task.description}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
                    border: '2px solid hsl(var(--accent))',
                    color: 'hsl(var(--accent))'
                },
                selected: {
                    backgroundColor: 'hsl(var(--accent))',
                    color: 'hsl(var(--accent-foreground))'
                }
              }}
            />
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Manage Tasks</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="animated-button"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Add a new task</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new task to your progress plan.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task-name" className="text-right">
                            Task
                            </Label>
                            <Input id="task-name" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task-category" className="text-right">
                            Category
                            </Label>
                            <Input id="task-category" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task-due-date" className="text-right">
                            Due Date
                            </Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !taskDueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={taskDueDate}
                                        onSelect={setTaskDueDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" onClick={handleAddTask}>Add Task</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
