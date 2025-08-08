import { QuizClient } from './quiz-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClipboardQuestion } from 'lucide-react';

export default function CompetitionQuizPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <ClipboardQuestion className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Competition Recommendation Quiz</CardTitle>
          <CardDescription>Answer a few questions to find the best FBLA competitions for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuizClient />
        </CardContent>
      </Card>
    </div>
  );
}
