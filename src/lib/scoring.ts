import type { PhonemeProduction, ProbeSession, ScoringBasis } from './types';

/**
 * Whether a production participates in scoring at all.
 * A production counts when it was scored during administration, or when the
 * session counts unadministered words as correct (mark-errors-only workflow),
 * in which case unscored productions count with the value they carry.
 */
export function isProductionCounted(
  production: PhonemeProduction | undefined,
  session: ProbeSession
): boolean {
  if (!production) return false;
  return production.isScored || session.countUnadministeredAsCorrect;
}

/**
 * Whether a production counts as a correct production: it must participate
 * in scoring (see isProductionCounted) and be marked correct.
 */
export function isProductionCorrect(
  production: PhonemeProduction | undefined,
  session: ProbeSession
): boolean {
  return isProductionCounted(production, session) && !!production && production.isCorrect;
}

/** Plain-language label for a scoring basis, for display and export. */
export function scoringBasisLabel(basis: ScoringBasis): string {
  return basis === 'full' ? 'Percent of full probe' : 'Percent of attempted';
}
