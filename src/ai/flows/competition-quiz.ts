'use server';
/**
 * @fileOverview A competition quiz AI agent.
 *
 * - competitionQuiz - A function that handles the competition quiz process.
 * - CompetitionQuizInput - The input type for the competitionQuiz function.
 * - CompetitionQuizOutput - The return type for the competitionQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompetitionQuizInputSchema = z.object({
  responses: z.record(z.string(), z.string()).describe('A record of question IDs to user responses.'),
  availableCompetitions: z.array(z.string()).describe('A list of available competitions.'),
  studentName: z.string().describe('The student taking the quiz.'),
});
export type CompetitionQuizInput = z.infer<typeof CompetitionQuizInputSchema>;

const CompetitionQuizOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended competitions based on the quiz results.'),
  feedback: z.string().describe('Overall feedback on the student\'s performance.'),
});
export type CompetitionQuizOutput = z.infer<typeof CompetitionQuizOutputSchema>;

export async function competitionQuiz(input: CompetitionQuizInput): Promise<CompetitionQuizOutput> {
  return competitionQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'competitionQuizPrompt',
  input: {schema: CompetitionQuizInputSchema},
  output: {schema: CompetitionQuizOutputSchema},
  prompt: `You are an expert FBLA competition advisor. A student has taken a quiz and you will evaluate their responses and recommend relevant competitions.

  Student Name: {{{studentName}}}

  Available Competitions:
  {{#each availableCompetitions}}
  - {{{this}}}
  {{/each}}

  Quiz Responses:
  {{#each (eachProperty responses)}}
  Question ID: {{{this.key}}}, Response: {{{this.value}}}
  {{/each}}

  Based on the student\'s responses, provide a list of recommended competitions and overall feedback on their performance. Focus recommendations on the student's strengths.
  `, 
});

const competitionQuizFlow = ai.defineFlow(
  {
    name: 'competitionQuizFlow',
    inputSchema: CompetitionQuizInputSchema,
    outputSchema: CompetitionQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
