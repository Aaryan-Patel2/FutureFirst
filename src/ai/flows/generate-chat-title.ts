
'use server';
/**
 * @fileOverview A flow to generate a title for a chat conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateChatTitleInputSchema = z.object({
  firstMessage: z.string().describe('The first message from the user in a new conversation.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the conversation (max 5 words).'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const titlePrompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: { schema: GenerateChatTitleInputSchema },
  output: { schema: GenerateChatTitleOutputSchema },
  prompt: `Based on the following user message, create a short, descriptive title for the new chat session. The title should be no more than 5 words.

User Message: "{{{firstMessage}}}"

Title:`,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const { output } = await titlePrompt(input);
    return output!;
  }
);
