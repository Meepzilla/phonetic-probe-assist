import type { ProbeType } from './types';

/**
 * Per-word image library, stored on the device in IndexedDB.
 *
 * One image can be saved for a word and then appears automatically in every
 * later session that probes that word, instead of the one-off upload that
 * used to live as base64 inside a single session. Images are far too large
 * for the localStorage session store, so they live here; the session itself
 * only ever carries an image set directly on a result, and library images
 * are resolved by word key at render time.
 *
 * Records are keyed by language and normalized word, in the form
 * "language:word" (for example "en:bus" or "es:casa"). The session model
 * carries no language field, so the language scope is derived in exactly
 * one place, wordImageScopeForProbeType, from the session probe type: the
 * 'spanish-general' probe maps to "es" and every other probe type maps to
 * "en". Image pack imports derive their keys through the same functions,
 * so pack keys and runtime keys cannot drift. Scoping by language (rather
 * than by exact probe type) means an image saved in the English general
 * probe also shows in the English deep probes, while an English and a
 * Spanish record for the same spelling stay separate.
 */

export const WORD_IMAGE_DB_NAME = 'phonetic-probe-assist';
export const WORD_IMAGE_DB_VERSION = 1;
export const WORD_IMAGE_STORE_NAME = 'word-images';

export type WordImageScope = 'en' | 'es';

export interface WordImageRecord {
  /** Store key: "language:word" with the word trimmed and lowercased. */
  key: string;
  /** Display word as entered, trimmed but not lowercased. */
  word: string;
  scope: WordImageScope;
  imageDataUrl: string;
  mimeType: string;
  /** ISO timestamp of the most recent write. */
  updatedAt: string;
}

/** A stored record without its image payload, for list views. */
export interface WordImageMeta {
  key: string;
  word: string;
  scope: WordImageScope;
  mimeType: string;
  updatedAt: string;
}

export interface PutWordImageInput {
  scope: WordImageScope;
  word: string;
  imageDataUrl: string;
  mimeType: string;
}

/** Derives the library language scope from a session probe type. */
export function wordImageScopeForProbeType(
  probeType: ProbeType | string | null | undefined
): WordImageScope {
  return probeType === 'spanish-general' ? 'es' : 'en';
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function wordImageKey(scope: WordImageScope, word: string): string {
  return `${scope}:${normalizeWord(word)}`;
}

function openWordImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available on this device.'));
      return;
    }
    const request = indexedDB.open(WORD_IMAGE_DB_NAME, WORD_IMAGE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORD_IMAGE_STORE_NAME)) {
        db.createObjectStore(WORD_IMAGE_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open the word image library.'));
    request.onblocked = () =>
      reject(new Error('The word image library is blocked by another tab.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('A word image library request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('A word image library write failed.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('A word image library write was aborted.'));
  });
}

/** Returns the full stored record for a key, or null when none exists. */
export async function getWordImage(key: string): Promise<WordImageRecord | null> {
  const db = await openWordImageDb();
  const store = db.transaction(WORD_IMAGE_STORE_NAME, 'readonly').objectStore(WORD_IMAGE_STORE_NAME);
  const record = await requestToPromise(store.get(key));
  return record ?? null;
}

/** Saves (or replaces) the image for a word and returns the stored record. */
export async function putWordImage(input: PutWordImageInput): Promise<WordImageRecord> {
  const record: WordImageRecord = {
    key: wordImageKey(input.scope, input.word),
    word: input.word.trim(),
    scope: input.scope,
    imageDataUrl: input.imageDataUrl,
    mimeType: input.mimeType,
    updatedAt: new Date().toISOString(),
  };
  const db = await openWordImageDb();
  const transaction = db.transaction(WORD_IMAGE_STORE_NAME, 'readwrite');
  transaction.objectStore(WORD_IMAGE_STORE_NAME).put(record);
  await transactionDone(transaction);
  return record;
}

export async function deleteWordImage(key: string): Promise<void> {
  const db = await openWordImageDb();
  const transaction = db.transaction(WORD_IMAGE_STORE_NAME, 'readwrite');
  transaction.objectStore(WORD_IMAGE_STORE_NAME).delete(key);
  await transactionDone(transaction);
}

/**
 * Lists every stored record as metadata only. The image payloads stay in
 * the store; callers that need a thumbnail fetch it with getWordImage.
 */
export async function listWordImages(): Promise<WordImageMeta[]> {
  const db = await openWordImageDb();
  const store = db.transaction(WORD_IMAGE_STORE_NAME, 'readonly').objectStore(WORD_IMAGE_STORE_NAME);
  const records = await requestToPromise(store.getAll());
  return records
    .map((record) => ({
      key: record.key,
      word: record.word,
      scope: record.scope,
      mimeType: record.mimeType,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Resolves a set of keys to a key-to-data-URL map, omitting missing keys. */
export async function getWordImagesForWords(
  keys: string[]
): Promise<Record<string, string>> {
  const uniqueKeys = Array.from(new Set(keys));
  const images: Record<string, string> = {};
  if (uniqueKeys.length === 0) return images;
  const db = await openWordImageDb();
  const store = db.transaction(WORD_IMAGE_STORE_NAME, 'readonly').objectStore(WORD_IMAGE_STORE_NAME);
  const records = await Promise.all(
    uniqueKeys.map((key) => requestToPromise(store.get(key)))
  );
  records.forEach((record, index) => {
    if (record) {
      images[uniqueKeys[index]] = record.imageDataUrl;
    }
  });
  return images;
}

/**
 * Image pack import.
 *
 * A pack is a JSON file of the form:
 *   { "version": 1, "source": "ARASAAC",
 *     "records": [{ "key": "en:bus", "word": "bus", "language": "en",
 *                   "image": "data:image/png;base64,...", "sourceId": 1234 }] }
 *
 * Pack languages are "en" and "es", the same scopes the runtime derivation
 * produces. Each record's store key is always derived here from its word
 * and language through wordImageKey; the pack's own key field is only
 * cross-checked against the derived key, never trusted. A whole file that
 * is unparseable or carries the wrong version imports nothing.
 */

export const WORD_IMAGE_PACK_VERSION = 1;

export interface WordImagePackRecord {
  word: string;
  language: WordImageScope;
  image: string;
  /** The key derived from word and language, used as the store key. */
  key: string;
}

export type ImportWordImagePackResult =
  | {
      ok: true;
      imported: number;
      /** Records left untouched because an image already exists for the key. */
      skippedExisting: number;
      /** Records rejected on their own fields or a failed key cross-check. */
      skippedInvalid: number;
    }
  | { ok: false; error: string };

function isWordImageScope(value: unknown): value is WordImageScope {
  return value === 'en' || value === 'es';
}

/**
 * Validates one raw pack record. Returns the record with its derived key,
 * or null when the record is unusable: missing or mistyped fields, an
 * unsupported language, an image that is not an image data URL, or a pack
 * key that disagrees with the derived key.
 */
export function parseWordImagePackRecord(raw: unknown): WordImagePackRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.word !== 'string' || record.word.trim() === '') return null;
  if (!isWordImageScope(record.language)) return null;
  if (typeof record.image !== 'string' || !record.image.startsWith('data:image/')) {
    return null;
  }
  const key = wordImageKey(record.language, record.word);
  if ('key' in record && record.key !== key) return null;
  return { word: record.word, language: record.language, image: record.image, key };
}

/**
 * Parses and validates a whole pack file. Returns the raw record list, or
 * null when the file is invalid as a whole: unparseable JSON, not an
 * object, a version other than WORD_IMAGE_PACK_VERSION, or no records
 * array. Per-record problems are left to parseWordImagePackRecord.
 */
export function parseWordImagePack(jsonText: string): unknown[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const pack = parsed as Record<string, unknown>;
  if (pack.version !== WORD_IMAGE_PACK_VERSION) return null;
  if (!Array.isArray(pack.records)) return null;
  return pack.records;
}

function mimeTypeFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;,]+)/.exec(dataUrl);
  return match ? match[1] : 'image/*';
}

/**
 * Imports a pack file's text. An invalid file imports nothing and returns
 * ok: false. Otherwise each valid record is written only when no record
 * already exists for its key, so an image added by hand is never
 * overwritten by a pack.
 */
export async function importWordImagePack(
  jsonText: string
): Promise<ImportWordImagePackResult> {
  const rawRecords = parseWordImagePack(jsonText);
  if (rawRecords === null) {
    return {
      ok: false,
      error: 'That file is not a valid word image pack. Nothing was imported.',
    };
  }
  let imported = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  for (const raw of rawRecords) {
    const record = parseWordImagePackRecord(raw);
    if (record === null) {
      skippedInvalid += 1;
      continue;
    }
    const existing = await getWordImage(record.key);
    if (existing !== null) {
      skippedExisting += 1;
      continue;
    }
    await putWordImage({
      scope: record.language,
      word: record.word,
      imageDataUrl: record.image,
      mimeType: mimeTypeFromDataUrl(record.image),
    });
    imported += 1;
  }
  return { ok: true, imported, skippedExisting, skippedInvalid };
}
