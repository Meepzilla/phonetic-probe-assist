import {
  listWordImages,
  putWordImage,
  wordImageKey,
  type WordImageScope,
} from './word-image-db';

/**
 * Default pictogram seeding.
 *
 * The app bundles the ARASAAC pictogram set as static assets under
 * /pictograms/ (one PNG per word, named by library key, plus a
 * manifest.json describing them). On first launch this module fills the
 * on-device word image library (see word-image-db.ts) from those bundled
 * files, so the pictograms are simply there instead of arriving through
 * a manual pack import.
 *
 * Seeding is conservative:
 * - A localStorage flag records that seeding completed (its value is the
 *   number of pictograms in the bundled set). While the flag is set,
 *   nothing is fetched and nothing is written, even if the user later
 *   removes some of the seeded images by hand.
 * - Without the flag, only the manifest keys missing from the store are
 *   downloaded and written, through the same putWordImage path the pack
 *   import uses, so a hand-added or previously imported image is never
 *   overwritten: it is not in the missing set by construction.
 * - The flag is set only when nothing is missing anymore. A failed
 *   download or write leaves the flag unset, and the next launch resumes
 *   by filling only what is still missing.
 * - If IndexedDB is unavailable the run reports a failed status and the
 *   app keeps its one-off upload behavior, exactly as before.
 */

export const PICTOGRAM_SEED_FLAG_KEY = 'phonetic-probe-assist:pictograms-seeded:v1';

const MANIFEST_URL = '/pictograms/manifest.json';
const PICTOGRAM_URL_PREFIX = '/pictograms/';
const FETCH_BATCH_SIZE = 10;

export type PictogramSeedState = 'idle' | 'seeding' | 'seeded' | 'failed';

export interface PictogramSeedStatus {
  state: PictogramSeedState;
  /** Pictograms present in the library out of the bundled set. */
  done: number;
  /** Pictograms in the bundled set. */
  total: number;
}

interface PictogramManifestRecord {
  key: string;
  word: string;
  language: WordImageScope;
  file: string;
  sourceId: number;
}

interface PictogramManifest {
  version: number;
  source: string;
  records: PictogramManifestRecord[];
}

let currentStatus: PictogramSeedStatus = { state: 'idle', done: 0, total: 0 };
const listeners = new Set<() => void>();

function setStatus(next: PictogramSeedStatus): void {
  currentStatus = next;
  listeners.forEach((listener) => listener());
}

/** Current seeding status, for useSyncExternalStore and plain reads. */
export function getPictogramSeedStatus(): PictogramSeedStatus {
  return currentStatus;
}

/** Subscribes to seeding status changes. Returns an unsubscribe function. */
export function subscribeToPictogramSeedStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSeededTotal(): number | null {
  try {
    const raw = window.localStorage.getItem(PICTOGRAM_SEED_FLAG_KEY);
    if (raw === null) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return null;
  }
}

function writeSeededFlag(total: number): void {
  try {
    window.localStorage.setItem(PICTOGRAM_SEED_FLAG_KEY, String(total));
  } catch {
    // A flag that cannot be written just means the next launch re-checks
    // the store and finds nothing missing, then tries the flag again.
  }
}

function isManifestRecord(value: unknown): value is PictogramManifestRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === 'string' &&
    typeof record.word === 'string' &&
    (record.language === 'en' || record.language === 'es') &&
    typeof record.file === 'string'
  );
}

async function fetchManifest(): Promise<PictogramManifestRecord[]> {
  const response = await fetch(MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`Pictogram manifest request failed with ${response.status}.`);
  }
  const parsed: unknown = await response.json();
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Pictogram manifest is not an object.');
  }
  const manifest = parsed as Partial<PictogramManifest>;
  if (!Array.isArray(manifest.records)) {
    throw new Error('Pictogram manifest carries no records.');
  }
  const records = manifest.records.filter(isManifestRecord);
  if (records.length !== manifest.records.length) {
    throw new Error('Pictogram manifest carries malformed records.');
  }
  return records;
}

/** Converts a fetched image blob to the data URL form the library stores. */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK_SIZE = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE));
  }
  const mimeType = blob.type || 'image/png';
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function seedMissingPictograms(
  record: PictogramManifestRecord
): Promise<void> {
  const response = await fetch(
    `${PICTOGRAM_URL_PREFIX}${encodeURIComponent(record.file)}`
  );
  if (!response.ok) {
    throw new Error(`Pictogram request for ${record.file} failed with ${response.status}.`);
  }
  const imageDataUrl = await blobToDataUrl(await response.blob());
  await putWordImage({
    scope: record.language,
    word: record.word,
    imageDataUrl,
    mimeType: 'image/png',
  });
}

async function runSeeding(): Promise<void> {
  const seededTotal = readSeededTotal();
  if (seededTotal !== null) {
    setStatus({ state: 'seeded', done: seededTotal, total: seededTotal });
    return;
  }

  setStatus({ state: 'seeding', done: 0, total: 0 });
  try {
    const records = await fetchManifest();
    const total = records.length;

    const stored = await listWordImages();
    const storedKeys = new Set(stored.map((meta) => meta.key));
    const missing = records.filter(
      (record) => !storedKeys.has(wordImageKey(record.language, record.word))
    );

    let done = total - missing.length;
    setStatus({ state: 'seeding', done, total });

    let anyFailure = false;
    for (let start = 0; start < missing.length; start += FETCH_BATCH_SIZE) {
      const batch = missing.slice(start, start + FETCH_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((record) => seedMissingPictograms(record))
      );
      for (const result of results) {
        if (result.status === 'fulfilled') {
          done += 1;
        } else {
          anyFailure = true;
        }
      }
      setStatus({ state: 'seeding', done, total });
    }

    if (anyFailure) {
      setStatus({ state: 'failed', done, total });
      return;
    }
    writeSeededFlag(total);
    setStatus({ state: 'seeded', done: total, total });
  } catch {
    // Manifest unreachable, IndexedDB unavailable, or a store read/write
    // failed. The flag stays unset so a later launch resumes.
    setStatus({ state: 'failed', done: currentStatus.done, total: currentStatus.total });
  }
}

let inFlight: Promise<void> | null = null;

/**
 * Ensures the bundled default pictograms are in the word image library.
 * Safe to call on every launch and from several components at once:
 * concurrent calls share one run, a completed seeding short-circuits on
 * the localStorage flag, and a failed run may be retried by calling
 * again. Never rejects.
 */
export function ensureDefaultPictogramsSeeded(): Promise<void> {
  if (inFlight === null) {
    inFlight = runSeeding().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
