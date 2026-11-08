'use server';

import { adaptWordListDialect } from '@/ai/flows/adapt-word-list-dialect';
import { generateWordImage } from '@/ai/flows/generate-word-image';
import { z } from 'zod';

const AdaptWordListSchema = z.object({
  wordList: z.string().min(1, 'Word list cannot be empty.'),
  dialect: z.string().min(1, 'Dialect cannot be empty.'),
});

export async function handleAdaptWordList(prevState: any, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = AdaptWordListSchema.safeParse(rawFormData);
    
    if (!validatedFields.success) {
      return { 
        message: 'Invalid form data.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    const { wordList, dialect } = validatedFields.data;
    const words = wordList.split(',').map(w => w.trim()).filter(Boolean);

    if (words.length === 0) {
      return {
        message: 'Invalid form data.',
        errors: { wordList: ['Please provide a comma-separated list of words.'] }
      };
    }

    const result = await adaptWordListDialect({ wordList: words, dialect });
    
    return {
      message: 'success',
      adaptedWordList: result.adaptedWordList,
    };
  } catch (error) {
    console.error('Error adapting word list:', error);
    return { message: 'An unexpected error occurred. Please try again.' };
  }
}

const GenerateImageSchema = z.object({
  word: z.string().min(1, 'Word cannot be empty.'),
});

export async function handleGenerateImage(input: { word: string }) {
  try {
    const validatedFields = GenerateImageSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        message: 'Invalid input.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { word } = validatedFields.data;
    const result = await generateWordImage({ word });

    return {
      message: 'success',
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return { message: 'An unexpected error occurred during image generation.' };
  }
}
