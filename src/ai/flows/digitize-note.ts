
'use server';
/**
 * @fileOverview A flow to digitize a file (image, pdf, docx) and extract text.
 * 
 * - digitizeNote - A function that handles the note digitization process.
 * - DigitizeNoteInput - The input type for the digitizeNote function.
 * - DigitizeNoteOutput - The return type for the digitizeNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DigitizeNoteInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file to be digitized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DigitizeNoteInput = z.infer<typeof DigitizeNoteInputSchema>;

const DigitizeNoteOutputSchema = z.object({
  digitizedContent: z
    .string()
    .describe('The extracted text content from the file, formatted as Markdown.'),
});
export type DigitizeNoteOutput = z.infer<typeof DigitizeNoteOutputSchema>;

const digitizePrompt = ai.definePrompt({
  name: 'digitizeNotePrompt',
  input: { schema: DigitizeNoteInputSchema },
  output: { schema: DigitizeNoteOutputSchema },
  prompt: `You are an OCR (Optical Character Recognition) and text extraction expert. Your task is to extract all readable text from the provided file.

  - Analyze the provided file.
  - Extract all text content accurately.
  - If the file is an image with handwriting, do your best to transcribe it.
  - Format the output as clean Markdown. Preserve basic formatting like headers, lists, and paragraphs if possible.
  - If you detect tabular data, format it as a proper Markdown table.
  - Do not add any commentary or text that was not present in the original file.
  
  File for digitization:
  {{media url=fileDataUri}}
  `,
});

export async function digitizeNote(input: DigitizeNoteInput): Promise<DigitizeNoteOutput> {
  const digitizeNoteFlow = ai.defineFlow(
    {
      name: 'digitizeNoteFlow',
      inputSchema: DigitizeNoteInputSchema,
      outputSchema: DigitizeNoteOutputSchema,
    },
    async (input) => {
      const { output } = await digitizePrompt(input);
      return output!;
    }
  );
  
  return await digitizeNoteFlow(input);
}
