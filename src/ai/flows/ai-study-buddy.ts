
'use server';
/**
 * @fileOverview An AI study buddy flow.
 *
 * - aiStudyBuddy - A function that handles the AI study buddy conversation.
 * - AIStudyBuddyInput - The input type for the aiStudyBuddy function.
 * - AIStudyBuddyOutput - The return type for the aiStudybuddy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AIStudyBuddyInputSchema = z.object({
  fileDataUri: z
    .string()
    .optional()
    .describe(
      "A file to be used as context for the conversation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userQuery: z.string().describe('The user query regarding the content of the file.'),
  conversationHistory: z.string().optional().describe('The ongoing conversation history.'),
});
export type AIStudyBuddyInput = z.infer<typeof AIStudyBuddyInputSchema>;

const AIStudyBuddyOutputSchema = z.object({
  response: z.string().describe('The AI response to the user query.'),
});
export type AIStudyBuddyOutput = z.infer<typeof AIStudyBuddyOutputSchema>;

export async function aiStudyBuddy(input: AIStudyBuddyInput): Promise<AIStudyBuddyOutput> {
  return aiStudyBuddyFlow(input);
}

const studyBuddyPrompt = ai.definePrompt({
    name: 'studyBuddyPrompt',
    input: { schema: AIStudyBuddyInputSchema },
    output: { schema: AIStudyBuddyOutputSchema },
    prompt: `You are an AI study buddy helping students prepare for FBLA competitions. Your tone should be helpful, encouraging, and knowledgeable about all things FBLA. Your responses must be formatted using Markdown.

    {{#if fileDataUri}}
    The student has provided a file for context. Base your response primarily on this content.
    File Content:
    {{media url=fileDataUri}}
    {{else}}
    The student has not provided a file. You should act as a general FBLA assistant. You can answer questions about competitions, preparation strategies, leadership skills, or any other FBLA-related topic.
    {{/if}}

    Here is the student's query:
    "{{{userQuery}}}"

    Here is the conversation history (if any):
    {{{conversationHistory}}}

    Respond to the user's query based on the provided context (file or general knowledge) and the conversation history.
    `,
});

const aiStudyBuddyFlow = ai.defineFlow(
  {
    name: 'aiStudyBuddyFlow',
    inputSchema: AIStudyBuddyInputSchema,
    outputSchema: AIStudyBuddyOutputSchema,
  },
  async (input) => {
    const { output } = await studyBuddyPrompt(input);
    return output!;
  }
);
