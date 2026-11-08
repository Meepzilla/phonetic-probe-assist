import type { ProbeSession } from './types';
import { isProductionCounted, isProductionCorrect } from './scoring';

/** The phonemes whose pairwise contrasts the PIP results grid reports. */
export const PIP_CONTRAST_PHONEMES: readonly string[] = ['p', 't', 'k', 'w', 'l', 'r'];

export interface PipContrastCell {
  /** Times the pair was produced correctly (both target productions counted and correct). */
  produced: number;
  /** Times the pair was attempted (both target productions counted). */
  attempted: number;
}

export interface PipContrastData {
  /** Symmetric grid indexed by PIP_CONTRAST_PHONEMES order; null on the diagonal. */
  grid: (PipContrastCell | null)[][];
  /** Counted productions on contrast phonemes in non-skipped words. */
  countedProductions: number;
  /** Total unordered contrast pairs attempted across the session. */
  attemptedPairs: number;
  /** Total unordered contrast pairs produced correctly across the session. */
  producedPairs: number;
}

function zeroMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function matrixValue(matrix: number[][], row: number, col: number): number {
  const rowValues = matrix[row];
  if (!rowValues) return 0;
  return rowValues[col] ?? 0;
}

function incrementPair(matrix: number[][], i: number, j: number): void {
  const rowI = matrix[i];
  const rowJ = matrix[j];
  if (!rowI || !rowJ) return;
  rowI[j] = (rowI[j] ?? 0) + 1;
  rowJ[i] = (rowJ[i] ?? 0) + 1;
}

/**
 * Computes the PIP contrast grid from a session.
 *
 * A word contributes one count for each unordered pair of distinct contrast
 * phonemes it contains. A pair is attempted when both target productions
 * count under the session scoring settings (see isProductionCounted), and
 * produced when every counted production of both phonemes in that word is
 * correct. Productions are read by their original phoneme index, so a word
 * whose phoneme list contains the same contrast phoneme twice (for example
 * 'trait', with /t/ in two positions) still contributes each pair once, and
 * an error on either occurrence keeps the pair from counting as produced.
 * Skipped words never contribute.
 */
export function computePipContrasts(session: ProbeSession): PipContrastData {
  const size = PIP_CONTRAST_PHONEMES.length;
  const produced = zeroMatrix(size);
  const attempted = zeroMatrix(size);
  let countedProductions = 0;

  for (const result of session.results) {
    if (result.skipped) continue;

    // Aggregate this word's counted productions per contrast phoneme,
    // keyed by contrast index and read by original phoneme index.
    const byContrastIndex = new Map<number, { counted: number; allCorrect: boolean }>();
    result.phonemes.forEach((unit, index) => {
      const contrastIndex = PIP_CONTRAST_PHONEMES.indexOf(unit.phoneme);
      if (contrastIndex === -1) return;
      const production = result.productions[index];
      if (!isProductionCounted(production, session)) return;

      countedProductions++;
      const entry = byContrastIndex.get(contrastIndex) ?? { counted: 0, allCorrect: true };
      entry.counted++;
      if (!isProductionCorrect(production, session)) entry.allCorrect = false;
      byContrastIndex.set(contrastIndex, entry);
    });

    const presentIndices = Array.from(byContrastIndex.keys()).sort((a, b) => a - b);
    for (let a = 0; a < presentIndices.length; a++) {
      for (let b = a + 1; b < presentIndices.length; b++) {
        const i = presentIndices[a];
        const j = presentIndices[b];
        if (i === undefined || j === undefined) continue;
        incrementPair(attempted, i, j);
        const entryI = byContrastIndex.get(i);
        const entryJ = byContrastIndex.get(j);
        if (entryI?.allCorrect && entryJ?.allCorrect) {
          incrementPair(produced, i, j);
        }
      }
    }
  }

  let attemptedPairs = 0;
  let producedPairs = 0;
  const grid: (PipContrastCell | null)[][] = PIP_CONTRAST_PHONEMES.map((_, i) =>
    PIP_CONTRAST_PHONEMES.map((_, j) => {
      if (i === j) return null;
      return { produced: matrixValue(produced, i, j), attempted: matrixValue(attempted, i, j) };
    })
  );
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      attemptedPairs += matrixValue(attempted, i, j);
      producedPairs += matrixValue(produced, i, j);
    }
  }

  return { grid, countedProductions, attemptedPairs, producedPairs };
}
