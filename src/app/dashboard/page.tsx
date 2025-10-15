
'use client';

import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Folder,
  Star,
  Trophy,
  BookOpen,
  ArrowRight,
  Settings,
  ChevronDown,
  LineChart,
} from 'lucide-react';
import { useNotesStore } from '@/store/notes-store';
import { useGccrStore } from '@/store/gccr-store';
import { useQuizStore } from '@/store/quiz-store';
import { useUserStore } from '@/store/user-store';
import { useProgressStore } from '@/store/progress-store';
import { useMemo, useState, useEffect } from 'react';
import { isWithinInterval, startOfDay, addDays, format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export default function DashboardHomePage() {
  const { user } = useUserStore();
  const { notes } = useNotesStore();
  const favoritedNotes = notes.filter(note => note.isFavorite);

  const { items, favorites, getAllFavoritedItems } = useGccrStore();
  
  // Get ALL favorited files from everywhere
  const [favoritedFiles, setFavoritedFiles] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    const loadAllFavorites = async () => {
      console.log('Favorites changed:', favorites);
      console.log('Favorites size:', favorites?.size);
      
      if (!favorites || favorites.size === 0) {
        setFavoritedFiles([]);
        return;
      }

      setLoadingFavorites(true);
      try {
        console.log('Calling getAllFavoritedItems...');
        const allFavorites = await getAllFavoritedItems();
        console.log('Got favorites:', allFavorites);
        setFavoritedFiles(allFavorites);
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setFavoritedFiles([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadAllFavorites();
  }, [favorites, getAllFavoritedItems]);

  const { selectedCompetitions } = useQuizStore();
  const { tasks } = useProgressStore();
  const [isChartOpen, setIsChartOpen] = useState(true);

  const isSameDay = (date1: Date | string, date2: Date) => {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const weeklyChartData = useMemo(() => {
    const today = startOfDay(new Date());
    const data = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, i);
      const dayTasks = tasks.filter(task => {
        // Ensure task.dueDate is converted to Date object
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isSameDay(taskDate, day);
      });
      data.push({
        date: format(day, 'EEE'),
        Done: dayTasks.filter(t => t.done).length,
        Pending: dayTasks.filter(t => !t.done).length,
      });
    }
    return data;
  }, [tasks]);

  const chartConfig = {
    Done: { label: 'Done', color: 'hsl(var(--accent))' },
    Pending: { label: 'Pending', color: 'hsl(var(--secondary))' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Student'}!</span>
          </h1>
          <p className="text-muted-foreground">
            Here's a snapshot of your FBLA journey.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progress Plan */}
           <Card className="hover:border-cyan-400/50 transition-all">
            <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle>Your Weekly Progress</CardTitle>
                    <CardDescription>
                      A look at your tasks for the next 7 days.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <LineChart className="h-5 w-5 mr-2" />
                    <ChevronDown className={`h-4 w-4 transition-transform ${isChartOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                   <ChartContainer config={chartConfig} className="h-64">
                    <BarChart accessibilityLayer data={weeklyChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value}
                      />
                       <YAxis 
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="Pending" fill="var(--color-Pending)" radius={4} />
                      <Bar dataKey="Done" fill="var(--color-Done)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <Button asChild variant="link" className="px-0 mt-2 text-cyan-400">
                    <Link href="/dashboard/progress">
                      Go to Full Progress Plan <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>


          {/* Favorited Repository Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-yellow-400" /> Favorited from GCCR
              </CardTitle>
              <CardDescription>
                Your pinned resources for quick access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFavorites ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                  Loading favorites...
                </div>
              ) : favoritedFiles.length > 0 ? (
                <ul className="space-y-3">
                  {favoritedFiles.map((file: any) => {
                    const fileName = file.name || 'Untitled File';
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    
                    return (
                      <li key={file.id} className="flex items-center gap-3">
                        {isFolder ? (
                          <Folder className="h-5 w-5 text-cyan-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{fileName}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You haven't favorited any files yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Favorited Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="text-cyan-400" /> Favorited Notes
              </CardTitle>
              <CardDescription>
                Your most important notes, front and center.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoritedNotes.length > 0 ? (
                <ul className="space-y-3">
                  {favoritedNotes.map((note) => (
                    <li key={note.id} className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{note.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You haven't favorited any notes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.profilePictureUrl || ''} alt={user?.name || 'Student'} data-ai-hint="student avatar" />
                <AvatarFallback>{user?.name?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user?.name || 'Student'}</h3>
              <p className="text-muted-foreground">{user?.grade || 'Grade not set'}</p>
            </CardContent>
            <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            </CardFooter>
          </Card>

          {/* Selected Competitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-cyan-400" /> Your Competitions
              </CardTitle>
              <CardDescription>
                Events selected from the quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedCompetitions.map((comp) => (
                  <li key={comp} className="font-medium">
                    {comp}
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" className="w-full mt-4">
                <Link href="/dashboard/quiz">Retake Quiz</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
