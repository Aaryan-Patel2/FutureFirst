'use server';
/**
 * @fileOverview An AI flow to compose and send an email with quiz results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/services/email-service';

const TEACHER_EMAIL = 'aaryanp0302@gmail.com';
const FROM_EMAIL = 'fbla-edge-noreply@example.com';

const SendQuizResultsEmailInputSchema = z.object({
  studentName: z.string().describe('The name of the student who took the quiz.'),
  rankedCompetitions: z.array(z.string()).describe('The ordered list of competitions, ranked by the student.'),
});
export type SendQuizResultsEmailInput = z.infer<typeof SendQuizResultsEmailInputSchema>;

const SendQuizResultsEmailOutputSchema = z.object({
  success: z.boolean(),
});
export type SendQuizResultsEmailOutput = z.infer<typeof SendQuizResultsEmailOutputSchema>;


export async function sendQuizResultsEmail(input: SendQuizResultsEmailInput): Promise<SendQuizResultsEmailOutput> {
    return sendQuizResultsEmailFlow(input);
}

const emailPrompt = ai.definePrompt({
  name: 'emailComposerPrompt',
  input: { schema: SendQuizResultsEmailInputSchema },
  output: {schema: z.object({response: z.string()})},
  prompt: `A student, {{{studentName}}}, has completed the FBLA Competition Quiz and has ranked their preferred events. 
  
  Your task is to compose a clean, professional, and well-formatted HTML email body to be sent to their teacher.

  The email should:
  1. Have a clear subject line: "FBLA Competition Choices for {{{studentName}}}".
  2. Start with a polite greeting to the teacher.
  3. State that the student has completed the quiz and ranked their choices.
  4. List the competitions in a numbered, ordered list (<ol>).
  5. End with a polite closing.

  Here is the student's ranked list:
  {{#each rankedCompetitions}}
  - {{{this}}}
  {{/each}}
  
  Generate the full HTML for the email body now.
  `,
});

const sendQuizResultsEmailFlow = ai.defineFlow(
    {
      name: 'sendQuizResultsEmailFlow',
      inputSchema: SendQuizResultsEmailInputSchema,
      outputSchema: SendQuizResultsEmailOutputSchema,
    },
    async (input) => {
      // 1. Generate the email content using the AI prompt
      const { output } = await emailPrompt(input);
      const emailBody = output!.response;
  
      // 2. Send the email using the mock service
      const result = await sendEmail({
        to: TEACHER_EMAIL,
        from: FROM_EMAIL,
        subject: `FBLA Competition Choices for ${input.studentName}`,
        body: emailBody, 
      });
  
      return { success: result.success };
    }
);
