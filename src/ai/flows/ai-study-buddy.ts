// This file is for the AI Study Buddy flow, allowing users to upload files and have ongoing conversations to help them prepare for FBLA competitions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIStudyBuddyInputSchema = z.object({
  fileDataUri: z
    .string()
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

const prompt = ai.definePrompt({
  name: 'aiStudyBuddyPrompt',
  input: {schema: AIStudyBuddyInputSchema},
  output: {schema: AIStudyBuddyOutputSchema},
  prompt: `You are an AI study buddy helping students prepare for FBLA competitions.

  Here is the file content provided by the student:
  {{media url=fileDataUri}}

  Here is the student's query:
  {{userQuery}}

  Here is the conversation history:
  {{conversationHistory}}

  Respond to the user query based on the file content and conversation history. Be helpful and informative.
  `,
});

const aiStudyBuddyFlow = ai.defineFlow(
  {
    name: 'aiStudyBuddyFlow',
    inputSchema: AIStudyBuddyInputSchema,
    outputSchema: AIStudyBuddyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
