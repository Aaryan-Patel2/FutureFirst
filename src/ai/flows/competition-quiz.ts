'use server';
/**
 * @fileOverview A competition quiz AI agent.
 *
 * - competitionQuiz - A function that handles the competition quiz process.
 * - CompetitionQuizInput - The input type for the competitionQuiz function.
 * - CompetitionQuizOutput - The return type for the competitionQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { competitions } from '@/lib/competitions';

const CompetitionQuizInputSchema = z.object({
  responses: z.record(z.string(), z.string()).describe('A record of question IDs to user responses. This includes both MCQ and FRQ answers.'),
  studentName: z.string().describe('The student taking the quiz.'),
  recommendationCount: z.number().min(2).max(5).default(5).describe('The number of competitions to recommend.'),
  tags: z.string().optional().describe('A space-separated list of tags to help refine competition recommendations. Multi-word tags should use dashes.'),
});
export type CompetitionQuizInput = z.infer<typeof CompetitionQuizInputSchema>;

const CompetitionQuizOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended competitions based on the quiz results.'),
  feedback: z.string().describe('Overall feedback on the student\'s performance, analyzing their strengths from both MCQ and free-response answers.'),
});
export type CompetitionQuizOutput = z.infer<typeof CompetitionQuizOutputSchema>;

export async function competitionQuiz(input: CompetitionQuizInput): Promise<CompetitionQuizOutput> {
  return competitionQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'competitionQuizPrompt',
  input: {schema: CompetitionQuizInputSchema},
  output: {schema: CompetitionQuizOutputSchema},
  prompt: `You are an expert FBLA competition advisor. A student has taken a quiz and you will evaluate their responses to recommend relevant competitions. The student has provided answers to multiple-choice questions (MCQs) and free-response questions (FRQs).

  **Student Name:** {{{studentName}}}
  **Number of Recommendations Requested:** {{{recommendationCount}}}

  **Available Competitions:**
  The following is a list of all available FBLA competitions. You must only recommend competitions from this list.
  ${competitions.map(c => `- ${c.Event} (${c.Category}, Grades: ${c.Grades})`).join('\n')}

  **Quiz Responses:**
  {{#each responses}}
  **Question ID:** {{@key}}
  **Response:** {{{this}}}
  {{/each}}
  
  {{#if tags}}
  **Refinement Tags:** The student has provided the following tags to guide the recommendations. Give these special consideration: {{{tags}}}
  {{/if}}

  **Your Task:**
  1.  **Analyze all responses:** Carefully review the student's answers to both the multiple-choice and the free-response questions. The FRQs are especially important for understanding their interests, skills, and way of thinking.
  2.  **Consider Tags:** If tags are provided, use them to heavily influence the recommendations towards competitions that match those themes or skills.
  3.  **Identify Strengths:** Based on the analysis, determine the student's key strengths and interests (e.g., strong analytical skills, creative thinking, interest in technology, public speaking affinity).
  4.  **Recommend Competitions:** Recommend exactly {{{recommendationCount}}} competitions from the provided list that best match the student's profile.
  5.  **Provide Feedback:** Write a brief, encouraging feedback summary for the student, explaining *why* you recommended those specific events based on their quiz answers and any tags provided.
  `, 
});

const competitionQuizFlow = ai.defineFlow(
  {
    name: 'competitionQuizFlow',
    inputSchema: CompetitionQuizInputSchema,
    outputSchema: CompetitionQuizOutputSchema,
  },
  async input => {
    // The available competitions are now sourced from the prompt directly.
    const {output} = await prompt(input);
    return output!;
  }
);
