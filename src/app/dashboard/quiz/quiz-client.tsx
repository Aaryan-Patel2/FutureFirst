'use client';

import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { competitionQuiz, CompetitionQuizInput, CompetitionQuizOutput } from '@/ai/flows/competition-quiz';
import { sendQuizResultsEmail } from '@/ai/flows/send-quiz-results-email';
import { Loader2, Lightbulb, Star, Send, Share2, GripVertical, CheckCircle, Tags, BrainCircuit } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ToastAction } from '@/components/ui/toast';
import { useQuizStore } from '@/store/quiz-store';
import { Input } from '@/components/ui/input';

const quizQuestions = [
  { id: 'q1', type: 'mcq', text: 'Which of these subjects are you most interested in?', options: ['Business and Marketing', 'Finance and Accounting', 'Technology and Coding', 'Public Speaking'] },
  { id: 'frq1', type: 'frq', text: 'Describe a project or accomplishment you are proud of. What role did you play?' },
  { id: 'q2', type: 'mcq', text: 'Do you prefer working alone or in a team?', options: ['Alone', 'In a team', 'Either is fine'] },
  { id: 'q3', type: 'mcq', text: 'How comfortable are you with presenting in front of an audience?', options: ['Very comfortable', 'Somewhat comfortable', 'Not comfortable'] },
  { id: 'frq2', type: 'frq', text: 'If you had to start a business, what problem would it solve and why?' },
  { id: 'q4', type: 'mcq', text: 'Which type of task do you enjoy more?', options: ['Objective tests', 'Creating a presentation', 'Building a product/app', 'Writing a report'] },
];

type FormData = {
    recommendationCount: number;
    q1: string; frq1: string;
    q2: string; q3: string;
    frq2: string; q4: string;
};

export function QuizClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [results, setResults] = useState<CompetitionQuizOutput | null>(null);
  const [rankedRecommendations, setRankedRecommendations] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const { toast } = useToast();
  const { setCompetitions } = useQuizStore();

  const form = useForm<FormData>({
    defaultValues: {
      recommendationCount: 5,
      q1: '', frq1: '',
      q2: '', q3: '',
      frq2: '', q4: '',
    },
  });

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.dataTransfer.setData('draggedIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    const draggedIndex = parseInt(e.dataTransfer.getData('draggedIndex'));
    const newRanked = [...rankedRecommendations];
    const draggedItem = newRanked[draggedIndex];
    newRanked.splice(draggedIndex, 1);
    newRanked.splice(dropIndex, 0, draggedItem);
    setRankedRecommendations(newRanked);
  };
  
  async function onSubmit(data: FormData, refinementTags?: string) {
    setIsLoading(true);
    setResults(null);
    try {
      const { recommendationCount, ...responses } = data;
      const result = await competitionQuiz({
        responses,
        studentName: "Student",
        recommendationCount,
        tags: refinementTags,
      });
      setResults(result);
      setRankedRecommendations(result.recommendations);
      setCompetitions(result.recommendations); // Save to store
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

  const handleRefineSubmit = () => {
      const currentData = form.getValues();
      onSubmit(currentData, tags);
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
        await sendQuizResultsEmail({
            studentName: 'Student', // Replace with actual student name
            rankedCompetitions: rankedRecommendations
        });
        toast({
            title: "Email Sent!",
            description: "Your competition list has been sent to Ms. Herbert.",
            action: <ToastAction altText="Close"><CheckCircle className="text-green-500" /></ToastAction>
        });
    } catch(e) {
        console.error("Failed to send email", e);
        toast({
            variant: 'destructive',
            title: 'Email Failed',
            description: 'There was a problem sending your results. Please try again later.'
        });
    } finally {
        setIsSendingEmail(false);
    }
  };


  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-2xl font-semibold">Finding your perfect match...</h2>
              <p className="text-muted-foreground">Our AI advisor is analyzing your responses.</p>
          </div>
      );
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
            <p className="text-sm text-muted-foreground mb-4">Drag and drop to rank your preferred competitions before sharing.</p>
            <ul className="space-y-2">
                {rankedRecommendations.map((rec, index) => (
                    <li 
                        key={rec} 
                        className="flex items-center gap-2 p-3 rounded-md border bg-background cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{index + 1}.</span>
                        <span>{rec}</span>
                    </li>
                ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Advisor Feedback</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{results.feedback}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-between">
          <Button onClick={() => setResults(null)} variant="outline">Take Quiz Again</Button>
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="secondary"><Tags className="mr-2 h-4 w-4" /> Refine with Tags</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Refine Recommendations</AlertDialogTitle>
                            <AlertDialogDescription>
                                Add up to 5 tags to help us narrow down the best competitions for you. Separate tags with spaces. Use dashes for multi-word tags (e.g., `public-speaking`).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input 
                            placeholder="e.g. technology leadership presentation"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRefineSubmit}>
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                Re-run with Tags
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button><Share2 className="mr-2"/> Share with Ms. Herbert</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Your Ranked List</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to send the following ranked list of competitions to Ms. Herbert. Please review it before sending.
                            <ol className="list-decimal list-inside my-4 space-y-1 rounded-md border p-4 bg-background">
                                {rankedRecommendations.map(rec => <li key={rec}>{rec}</li>)}
                            </ol>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendEmail} disabled={isSendingEmail}>
                            {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Confirm & Send
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(d => onSubmit(d))} className="space-y-8">
        <FormField
            control={form.control}
            name="recommendationCount"
            render={({ field }) => (
                <FormItem className="rounded-lg border p-4 space-y-4">
                    <FormLabel className="font-semibold text-base">How many competition recommendations would you like?</FormLabel>
                    <FormControl>
                       <div className="flex items-center gap-4">
                         <Slider
                            min={2}
                            max={5}
                            step={1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                         />
                         <span className="font-bold text-lg text-primary w-8 text-center">{field.value}</span>
                       </div>
                    </FormControl>
                    <FormDescription>
                        Choose between 2 and 5 recommendations. The default is 5.
                    </FormDescription>
                </FormItem>
            )}
        />

        {quizQuestions.map((q) => (
          <FormField
            key={q.id}
            control={form.control}
            name={q.id as any}
            rules={{ required: 'This field is required.' }}
            render={({ field }) => (
              <FormItem className="space-y-3 rounded-lg border p-4">
                <FormLabel className="font-semibold text-base">{q.text}</FormLabel>
                <FormControl>
                  {q.type === 'mcq' ? (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {q.options!.map((opt) => (
                        <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={opt} />
                          </FormControl>
                          <FormLabel className="font-normal">{opt}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Answer in 2-3 sentences..."
                      className="resize-none"
                      {...field}
                    />
                  )}
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
