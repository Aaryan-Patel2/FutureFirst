'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { competitionQuiz, CompetitionQuizOutput } from '@/ai/flows/competition-quiz';
import { Loader2, Lightbulb, Star, Send } from 'lucide-react';

const quizQuestions = [
  { id: 'q1', text: 'Which of these subjects are you most interested in?', options: ['Business and Marketing', 'Finance and Accounting', 'Technology and Coding', 'Public Speaking'] },
  { id: 'q2', text: 'Do you prefer working alone or in a team?', options: ['Alone', 'In a team', 'Either is fine'] },
  { id: 'q3', text: 'How comfortable are you with presenting in front of an audience?', options: ['Very comfortable', 'Somewhat comfortable', 'Not comfortable'] },
  { id: 'q4', text: 'Which type of task do you enjoy more?', options: ['Objective tests', 'Creating a presentation', 'Building a product/app', 'Writing a report'] },
];

const availableCompetitions = ["Marketing", "Business Plan", "Public Speaking", "Coding & Programming", "Accounting I", "Introduction to Financial Math"];

export function QuizClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompetitionQuizOutput | null>(null);
  const { toast } = useToast();
  const form = useForm();

  async function onSubmit(data: any) {
    setIsLoading(true);
    setResults(null);
    try {
      const result = await competitionQuiz({
        responses: data,
        availableCompetitions,
        studentName: "Student", // Replace with actual student name from auth
      });
      setResults(result);
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Could not get recommendations. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (results) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary" /> Quiz Results</CardTitle>
          <CardDescription>Based on your answers, here are our recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Star className="h-5 w-5" /> Recommended Competitions</h3>
            <ul className="list-disc pl-5 space-y-1">
              {results.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Advisor Feedback</h3>
            <p className="text-sm text-muted-foreground">{results.feedback}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setResults(null)}>Take Quiz Again</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {quizQuestions.map((q) => (
          <FormField
            key={q.id}
            control={form.control}
            name={q.id}
            rules={{ required: 'This field is required.' }}
            render={({ field }) => (
              <FormItem className="space-y-3 rounded-lg border p-4">
                <FormLabel className="font-semibold text-base">{q.text}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    {q.options.map((opt) => (
                      <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={opt} />
                        </FormControl>
                        <FormLabel className="font-normal">{opt}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="text-center">
            <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Send className="mr-2 h-4 w-4" />
            )}
            Get My Recommendations
            </Button>
        </div>
      </form>
    </Form>
  );
}
