'use server';
/**
 * @fileOverview An AI agent that generates an image for a given word.
 *
 * - generateWordImage - A function that generates an image.
 * - GenerateWordImageInput - The input type for the generateWordImage function.
 * - GenerateWordImageOutput - The return type for the generateWordImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWordImageInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type GenerateWordImageInput = z.infer<
  typeof GenerateWordImageInputSchema
>;

const GenerateWordImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateWordImageOutput = z.infer<
  typeof GenerateWordImageOutputSchema
>;

export async function generateWordImage(
  input: GenerateWordImageInput
): Promise<GenerateWordImageOutput> {
  return generateWordImageFlow(input);
}

const generateWordImageFlow = ai.defineFlow(
  {
    name: 'generateWordImageFlow',
    inputSchema: GenerateWordImageInputSchema,
    outputSchema: GenerateWordImageOutputSchema,
  },
  async ({word}) => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a high-quality, realistic photograph of the word: "${word}". The image should be child-friendly, well-lit, and have a clean, simple background.`,
      config: {
        aspectRatio: '4:3',
      },
    });
    
    if (!media || !media.url) {
      throw new Error('Image generation failed.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
