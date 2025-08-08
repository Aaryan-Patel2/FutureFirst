
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Folder,
  Star,
  Trophy,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useNotesStore } from '@/store/notes-store';
import { useGccrStore } from '@/store/gccr-store';
import { useQuizStore } from '@/store/quiz-store';
import { useUserStore } from '@/store/user-store';

export default function DashboardHomePage() {
  const { user } = useUserStore();
  const { notes } = useNotesStore();
  const favoritedNotes = notes.filter(note => note.isFavorite);

  const { files } = useGccrStore();
  const favoritedFiles = files.filter(file => file.isFavorite);

  const { selectedCompetitions } = useQuizStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}!</span>
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
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                You've completed 3 of 7 tasks this week. Keep it up!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={42} className="h-2" />
              <Button asChild variant="link" className="px-0 mt-2 text-cyan-400">
                <Link href="/dashboard/progress">
                  Go to Progress Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
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
              {favoritedFiles.length > 0 ? (
                 <ul className="space-y-3">
                  {favoritedFiles.map((file) => (
                    <li key={file.name} className="flex items-center gap-3">
                      {file.type === 'folder' ? (
                        <Folder className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">{file.name}</span>
                    </li>
                  ))}
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
                <AvatarImage src={user.profilePictureUrl} alt={user.name} data-ai-hint="student avatar" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.grade}</p>
            </CardContent>
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
