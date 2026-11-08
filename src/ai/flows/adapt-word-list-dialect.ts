'use server';
/**
 * @fileOverview An AI agent that adapts a word list to a specific dialect.
 *
 * - adaptWordListDialect - A function that adapts the word list dialect.
 * - AdaptWordListDialectInput - The input type for the adaptWordListDialect function.
 * - AdaptWordListDialectOutput - The return type for the adaptWordListDialect function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptWordListDialectInputSchema = z.object({
  wordList: z.array(z.string()).describe('A list of words to adapt to the specified dialect.'),
  dialect: z.string().describe('The target dialect to adapt the word list to.'),
});
export type AdaptWordListDialectInput = z.infer<typeof AdaptWordListDialectInputSchema>;

const AdaptWordListDialectOutputSchema = z.object({
  adaptedWordList: z
    .array(z.string())
    .describe('The word list adapted to the specified dialect.'),
});
export type AdaptWordListDialectOutput = z.infer<typeof AdaptWordListDialectOutputSchema>;

export async function adaptWordListDialect(
  input: AdaptWordListDialectInput
): Promise<AdaptWordListDialectOutput> {
  return adaptWordListDialectFlow(input);
}

const adaptWordListDialectPrompt = ai.definePrompt({
  name: 'adaptWordListDialectPrompt',
  input: {schema: AdaptWordListDialectInputSchema},
  output: {schema: AdaptWordListDialectOutputSchema},
  prompt: `You are an expert linguist specializing in adapting word lists to different dialects.

You will take a word list and adapt it to the specified dialect, ensuring that the words are relevant and easily understood by a child from that dialect.

Word List:
{{#each wordList}}- {{{this}}}\n{{/each}}

Dialect: {{{dialect}}}

Adapted Word List:`,
});

const adaptWordListDialectFlow = ai.defineFlow(
  {
    name: 'adaptWordListDialectFlow',
    inputSchema: AdaptWordListDialectInputSchema,
    outputSchema: AdaptWordListDialectOutputSchema,
  },
  async input => {
    const {output} = await adaptWordListDialectPrompt(input);
    return output!;
  }
);
