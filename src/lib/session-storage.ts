import type { ProbeSession } from './types';

/**
 * Write-through persistence for the in-progress probe session.
 *
 * The whole session (results with their scored flags and scoring settings,
 * plus the current phase and word position) is stored in localStorage under
 * one versioned key on every state change, so a refresh, crash, or accidental
 * tab close no longer loses the session. A saved value whose version does not
 * match SESSION_STORAGE_VERSION, or that fails structural validation, is
 * ignored and cleared rather than restored.
 */

export const SESSION_STORAGE_KEY = 'phonetic-probe-assist:session:v1';
export const SESSION_STORAGE_VERSION = 1;

export interface SavedSessionEnvelope {
  version: number;
  /** ISO timestamp of the most recent successful save. */
  savedAt: string;
  session: ProbeSession;
  activeTab: string;
  currentWordIndex: number;
}

export function serializeSavedSession(envelope: SavedSessionEnvelope): string {
  return JSON.stringify(envelope);
}

function isValidSession(value: unknown): value is ProbeSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.sessionId === 'string' &&
    typeof session.clientId === 'string' &&
    typeof session.date === 'string' &&
    Array.isArray(session.wordList) &&
    Array.isArray(session.results) &&
    typeof session.countUnadministeredAsCorrect === 'boolean' &&
    (session.scoringBasis === 'attempted' || session.scoringBasis === 'full')
  );
}

/**
 * Parses a stored value back into an envelope. Returns null for a missing
 * value, unparseable JSON, a version mismatch, or a malformed envelope.
 */
export function parseSavedSession(raw: string | null): SavedSessionEnvelope | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== SESSION_STORAGE_VERSION) return null;
  if (typeof envelope.savedAt !== 'string') return null;
  if (typeof envelope.activeTab !== 'string') return null;
  if (typeof envelope.currentWordIndex !== 'number') return null;
  if (!isValidSession(envelope.session)) return null;
  return envelope as unknown as SavedSessionEnvelope;
}

/**
 * Reads the saved session, if any. A stored value that cannot be restored
 * (corrupt or version-mismatched) is cleared so it is not offered again.
 */
export function loadSavedSession(): SavedSessionEnvelope | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
  const envelope = parseSavedSession(raw);
  if (raw !== null && envelope === null) {
    clearSavedSession();
  }
  return envelope;
}

/**
 * Writes the envelope to localStorage. Returns false when the write fails
 * (for example when uploaded word images exceed the storage quota) so the
 * caller can stop retrying and tell the clinician.
 */
export function saveSavedSession(envelope: SavedSessionEnvelope): boolean {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, serializeSavedSession(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage is unavailable, so there is nothing to clear.
  }
}

/** Words that carry any scoring: at least one scored production, or skipped. */
export function countScoredWords(session: ProbeSession): number {
  return session.results.filter(
    (result) =>
      result.skipped || result.productions.some((production) => production.isScored)
  ).length;
}
