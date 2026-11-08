import type { PhonemeUnit, ProbeSession, ProbeWordResult } from './types';
import { isProductionCounted } from './scoring';

/**
 * Phonological process analysis, computed from a session's counted
 * productions.
 *
 * A word result aligns phoneme units (target phoneme and position) with
 * productions. Only counted, non-skipped productions feed this analysis
 * (see isProductionCounted in scoring.ts): under the default settings that
 * means scored productions only; when the session counts unadministered
 * words as correct, unscored productions count with the values they carry.
 *
 * Targets and produced segments are compared by IPA class (manner, place,
 * voicing) using the tables below, which cover the English and Spanish
 * phoneme sets in constants.ts. A production feeds a substitution-class
 * rule only when it is an error the clinician recorded as a substitution
 * (an explicit 'substitution' type, or no type, which the rest of the app
 * also treats as a substitution) and its produced IPA parses to a known
 * segment. Omissions are read from the recorded error type, because the
 * IPA field of an omitted production still holds the target text.
 * Distortions and additions never feed the substitution-class rules: a
 * distortion is the target produced with distortion, not a class change,
 * and an addition is an extra segment rather than a changed one. A
 * production whose produced IPA is missing or unparseable feeds no class
 * rule; nothing is guessed.
 */

type SegmentKind = 'stop' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'glide' | 'vowel';
type SegmentPlace = 'bilabial' | 'labiodental' | 'dental' | 'alveolar' | 'palatal' | 'velar' | 'glottal';
type SegmentVoicing = 'voiced' | 'voiceless';

interface SegmentClass {
  /** Canonical symbol for equality checks ('r' and 'ch' resolve to 'ɹ' and 'tʃ'). */
  canonical: string;
  kind: SegmentKind;
  place?: SegmentPlace;
  voicing?: SegmentVoicing;
}

function segment(
  canonical: string,
  kind: SegmentKind,
  place?: SegmentPlace,
  voicing?: SegmentVoicing
): SegmentClass {
  return { canonical, kind, place, voicing };
}

const SEGMENT_TABLE: Record<string, SegmentClass> = {
  // Stops
  p: segment('p', 'stop', 'bilabial', 'voiceless'),
  b: segment('b', 'stop', 'bilabial', 'voiced'),
  t: segment('t', 'stop', 'alveolar', 'voiceless'),
  d: segment('d', 'stop', 'alveolar', 'voiced'),
  k: segment('k', 'stop', 'velar', 'voiceless'),
  g: segment('g', 'stop', 'velar', 'voiced'),
  // Fricatives
  f: segment('f', 'fricative', 'labiodental', 'voiceless'),
  v: segment('v', 'fricative', 'labiodental', 'voiced'),
  'θ': segment('θ', 'fricative', 'dental', 'voiceless'),
  'ð': segment('ð', 'fricative', 'dental', 'voiced'),
  s: segment('s', 'fricative', 'alveolar', 'voiceless'),
  z: segment('z', 'fricative', 'alveolar', 'voiced'),
  'ʃ': segment('ʃ', 'fricative', 'palatal', 'voiceless'),
  'ʒ': segment('ʒ', 'fricative', 'palatal', 'voiced'),
  h: segment('h', 'fricative', 'glottal', 'voiceless'),
  x: segment('x', 'fricative', 'velar', 'voiceless'),
  'β': segment('β', 'fricative', 'bilabial', 'voiced'),
  'ɣ': segment('ɣ', 'fricative', 'velar', 'voiced'),
  // Affricates ('ch' is the Spanish bank's spelling of /tʃ/)
  'tʃ': segment('tʃ', 'affricate', 'palatal', 'voiceless'),
  'dʒ': segment('dʒ', 'affricate', 'palatal', 'voiced'),
  ch: segment('tʃ', 'affricate', 'palatal', 'voiceless'),
  // Nasals
  m: segment('m', 'nasal', 'bilabial', 'voiced'),
  n: segment('n', 'nasal', 'alveolar', 'voiced'),
  'ŋ': segment('ŋ', 'nasal', 'velar', 'voiced'),
  'ñ': segment('ñ', 'nasal', 'palatal', 'voiced'),
  // Liquids ('r' typed for a rhotic resolves to 'ɹ'; both are liquids)
  l: segment('l', 'liquid', 'alveolar', 'voiced'),
  'ɹ': segment('ɹ', 'liquid', 'palatal', 'voiced'),
  r: segment('ɹ', 'liquid', 'palatal', 'voiced'),
  'ɾ': segment('ɾ', 'liquid', 'alveolar', 'voiced'),
  // Glides
  w: segment('w', 'glide', 'bilabial', 'voiced'),
  j: segment('j', 'glide', 'palatal', 'voiced'),
  // Vowels (English and Spanish sets)
  i: segment('i', 'vowel'),
  'ɪ': segment('ɪ', 'vowel'),
  e: segment('e', 'vowel'),
  'ɛ': segment('ɛ', 'vowel'),
  'æ': segment('æ', 'vowel'),
  a: segment('a', 'vowel'),
  'ɑ': segment('ɑ', 'vowel'),
  'ɔ': segment('ɔ', 'vowel'),
  o: segment('o', 'vowel'),
  'ʊ': segment('ʊ', 'vowel'),
  u: segment('u', 'vowel'),
  'ʌ': segment('ʌ', 'vowel'),
  'ə': segment('ə', 'vowel'),
  'ɚ': segment('ɚ', 'vowel'),
  'ɝ': segment('ɝ', 'vowel'),
  'eɪ': segment('eɪ', 'vowel'),
  'aɪ': segment('aɪ', 'vowel'),
  'aʊ': segment('aʊ', 'vowel'),
  'ɔɪ': segment('ɔɪ', 'vowel'),
  'oʊ': segment('oʊ', 'vowel'),
};

/** Voicing cognate pairs, keyed by canonical symbol. */
const VOICELESS_COGNATE: Record<string, string> = {
  b: 'p', d: 't', g: 'k', v: 'f', 'ð': 'θ', z: 's', 'ʒ': 'ʃ', 'dʒ': 'tʃ',
};
const VOICED_COGNATE: Record<string, string> = {
  p: 'b', t: 'd', k: 'g', f: 'v', 'θ': 'ð', s: 'z', 'ʃ': 'ʒ', 'tʃ': 'dʒ',
};
/** Nasal to oral cognate pairs used by denasalization. */
const DENASAL_COGNATE: Record<string, string> = { m: 'b', n: 'd', 'ŋ': 'g' };

function classify(symbol: string | undefined): SegmentClass | null {
  if (!symbol) return null;
  return SEGMENT_TABLE[symbol.trim()] ?? null;
}

function isObstruent(cls: SegmentClass): boolean {
  return cls.kind === 'stop' || cls.kind === 'fricative' || cls.kind === 'affricate';
}

export interface PhonologicalProcessExample {
  word: string;
  /** Target phoneme symbol for the production. */
  target: string;
  /** What the child produced ('ø' for an omission). */
  produced: string;
  position: 'initial' | 'medial' | 'final';
}

export interface PhonologicalProcessResult {
  id: string;
  label: string;
  occurrences: number;
  /** Counted contexts where the process could have applied. */
  opportunities: number;
  /** Occurrences as a rounded percent of opportunities. */
  percent: number;
  /** Present when the process occurs at least twice and in at least 40% of its opportunities. */
  present: boolean;
  examples: PhonologicalProcessExample[];
}

export interface PhonologicalProcessAnalysis {
  /** Processes with at least one occurrence, in rule definition order. */
  processes: PhonologicalProcessResult[];
  /** Counted productions across non-skipped words. */
  countedProductions: number;
  /** Non-skipped words holding at least one counted production. */
  countedWords: number;
}

export const PHONOLOGICAL_PROCESS_DEFINITIONS: readonly { id: string; label: string }[] = [
  { id: 'final-consonant-deletion', label: 'Final Consonant Deletion' },
  { id: 'initial-consonant-deletion', label: 'Initial Consonant Deletion' },
  { id: 'cluster-reduction', label: 'Cluster Reduction' },
  { id: 'stopping', label: 'Stopping' },
  { id: 'fronting', label: 'Fronting' },
  { id: 'backing', label: 'Backing' },
  { id: 'gliding', label: 'Gliding' },
  { id: 'vocalization', label: 'Vocalization' },
  { id: 'final-devoicing', label: 'Final Devoicing' },
  { id: 'prevocalic-voicing', label: 'Prevocalic Voicing' },
  { id: 'denasalization', label: 'Denasalization' },
  { id: 'deaffrication', label: 'Deaffrication' },
  { id: 'assimilation', label: 'Assimilation' },
  { id: 'addition', label: 'Addition (Epenthesis)' },
];

const MAX_EXAMPLES = 5;

interface Accumulator {
  occurrences: number;
  opportunities: number;
  examples: PhonologicalProcessExample[];
}

/**
 * Computes the phonological processes detectable in a session.
 *
 * Opportunities are counted contexts, per process:
 * - Final / initial consonant deletion: counted singleton consonant
 *   productions in that position, plus one per cluster run in that
 *   position holding at least one counted production. A run is in
 *   initial position when it includes the word's first unit and in
 *   final position when it includes the word's last unit.
 * - Cluster reduction: counted productions on members of a consonant
 *   cluster (a run of two or more consecutive consonant units in a word).
 *
 * One omission feeds exactly one deletion-family process. An omitted
 * cluster member whose run partially surfaces is cluster reduction
 * only, never also a position deletion. A cluster omitted in full
 * counts once as a position deletion for the run's position, not once
 * per member. Singleton omissions count under their own position, and
 * medial omissions feed nothing, as there is no medial deletion
 * process.
 * - Stopping: counted fricative and affricate productions. Deaffrication:
 *   counted affricate productions.
 * - Fronting: counted velar productions. Backing: counted alveolar
 *   consonant productions.
 * - Gliding and vocalization: counted liquid productions.
 * - Final devoicing: counted voiced obstruent productions in final
 *   position. Prevocalic voicing: counted voiceless obstruent productions
 *   in initial position.
 * - Denasalization: counted nasal productions.
 * - Assimilation: counted consonant productions in words with at least
 *   two counted consonants.
 * - Addition: counted words (non-skipped words with at least one counted
 *   production).
 */
export function analyzePhonologicalProcesses(session: ProbeSession): PhonologicalProcessAnalysis {
  const accumulators = new Map<string, Accumulator>();
  const accumulatorFor = (id: string): Accumulator => {
    let acc = accumulators.get(id);
    if (!acc) {
      acc = { occurrences: 0, opportunities: 0, examples: [] };
      accumulators.set(id, acc);
    }
    return acc;
  };
  const addOpportunity = (id: string) => {
    accumulatorFor(id).opportunities++;
  };
  const addOccurrence = (id: string, example: PhonologicalProcessExample) => {
    const acc = accumulatorFor(id);
    acc.occurrences++;
    if (acc.examples.length < MAX_EXAMPLES) acc.examples.push(example);
  };

  let countedProductions = 0;
  let countedWords = 0;

  for (const result of session.results) {
    if (result.skipped) continue;

    const entries = result.phonemes.map((unit, index) => ({
      unit,
      index,
      production: result.productions[index],
      counted: isProductionCounted(result.productions[index], session),
    }));
    const countedEntries = entries.filter((entry) => entry.counted);
    if (countedEntries.length === 0) continue;

    countedWords++;
    countedProductions += countedEntries.length;

    // Addition opportunities are counted words.
    accumulatorFor('addition').opportunities++;

    // Cluster runs: maximal runs of two or more consecutive consonant
    // units, recorded as sets of unit indices.
    const clusterRunByIndex = new Map<number, number[]>();
    const clusterRuns: number[][] = [];
    let run: number[] = [];
    const closeRun = () => {
      if (run.length >= 2) {
        clusterRuns.push(run);
        for (const idx of run) clusterRunByIndex.set(idx, run);
      }
      run = [];
    };
    for (const entry of entries) {
      if (entry.unit.type === 'consonant') {
        run.push(entry.index);
      } else {
        closeRun();
      }
    }
    closeRun();

    // Deletion-family precedence for cluster runs, resolved once per run
    // so one omission cannot feed two processes:
    // - The run adds one deletion opportunity for its position when it
    //   holds at least one counted production. A run's position is
    //   initial when it includes the word's first unit and final when it
    //   includes the word's last unit; medial runs add none.
    // - A member omitted while at least one other counted member
    //   surfaces (is not itself omitted) feeds cluster reduction; those
    //   member indices are collected here and credited in the entry loop.
    // - A run omitted in full feeds the position deletion rule for the
    //   run's position exactly once, credited here from the first
    //   omitted member.
    const clusterReductionIndices = new Set<number>();
    for (const indices of clusterRuns) {
      const countedMembers: typeof entries = [];
      for (const idx of indices) {
        const member = entries[idx];
        if (member && member.counted) countedMembers.push(member);
      }
      if (countedMembers.length === 0) continue;
      const runPosition = indices.includes(0)
        ? 'initial'
        : indices.includes(entries.length - 1)
          ? 'final'
          : null;
      if (runPosition === 'initial') addOpportunity('initial-consonant-deletion');
      if (runPosition === 'final') addOpportunity('final-consonant-deletion');
      const omittedMembers = countedMembers.filter((m) => m.production?.errorType === 'omission');
      if (omittedMembers.length === 0) continue;
      const anyMemberSurfaces = countedMembers.some((m) => m.production?.errorType !== 'omission');
      if (anyMemberSurfaces) {
        for (const m of omittedMembers) clusterReductionIndices.add(m.index);
      } else if (runPosition) {
        const firstOmitted = omittedMembers[0];
        if (firstOmitted) {
          addOccurrence(
            runPosition === 'initial' ? 'initial-consonant-deletion' : 'final-consonant-deletion',
            {
              word: result.word,
              target: firstOmitted.unit.phoneme,
              produced: 'ø',
              position: firstOmitted.unit.position,
            }
          );
        }
      }
    }

    const countedConsonants = countedEntries.filter((entry) => entry.unit.type === 'consonant');
    const assimilationApplies = countedConsonants.length >= 2;

    for (const entry of countedEntries) {
      const { unit, production } = entry;
      if (!production) continue;
      const targetClass = classify(unit.phoneme);
      const example: PhonologicalProcessExample = {
        word: result.word,
        target: unit.phoneme,
        produced: production.ipa?.trim() ?? '',
        position: unit.position,
      };

      // Opportunities driven by position and target class alone.
      // Deletion opportunities count singleton productions here; cluster
      // runs contribute one per run in the run pass above.
      if (unit.type === 'consonant') {
        if (!clusterRunByIndex.has(entry.index)) {
          if (unit.position === 'final') addOpportunity('final-consonant-deletion');
          if (unit.position === 'initial') addOpportunity('initial-consonant-deletion');
        }
        if (clusterRunByIndex.has(entry.index)) addOpportunity('cluster-reduction');
        if (assimilationApplies) addOpportunity('assimilation');
      }
      if (targetClass) {
        if (targetClass.kind === 'fricative' || targetClass.kind === 'affricate') {
          addOpportunity('stopping');
        }
        if (targetClass.kind === 'affricate') addOpportunity('deaffrication');
        if (targetClass.place === 'velar' && unit.type === 'consonant') addOpportunity('fronting');
        if (targetClass.place === 'alveolar' && unit.type === 'consonant') addOpportunity('backing');
        if (targetClass.kind === 'liquid') {
          addOpportunity('gliding');
          addOpportunity('vocalization');
        }
        if (targetClass.kind === 'nasal') addOpportunity('denasalization');
        if (isObstruent(targetClass) && targetClass.voicing === 'voiced' && unit.position === 'final') {
          addOpportunity('final-devoicing');
        }
        if (isObstruent(targetClass) && targetClass.voicing === 'voiceless' && unit.position === 'initial') {
          addOpportunity('prevocalic-voicing');
        }
      }

      if (production.isCorrect) continue;

      // Omissions: the recorded error type carries the deletion, because
      // the IPA field of an omitted production still holds the target.
      if (production.errorType === 'omission' && unit.type === 'consonant') {
        const omissionExample = { ...example, produced: 'ø' };
        if (clusterRunByIndex.has(entry.index)) {
          // Cluster member: cluster reduction only, and only when the
          // run partially surfaces (resolved in the run pass above). A
          // run omitted in full was credited there, once, as a position
          // deletion, so it adds nothing here.
          if (clusterReductionIndices.has(entry.index)) {
            addOccurrence('cluster-reduction', omissionExample);
          }
        } else {
          if (unit.position === 'final') addOccurrence('final-consonant-deletion', omissionExample);
          if (unit.position === 'initial') addOccurrence('initial-consonant-deletion', omissionExample);
        }
        continue;
      }

      if (production.errorType === 'addition') {
        const producedText = production.ipa?.trim() || production.errorDetail?.trim() || '—';
        addOccurrence('addition', { ...example, produced: producedText });
        continue;
      }

      // Substitution-class rules: substitutions only (an unset error type
      // is a substitution, as elsewhere in the app). Distortions are the
      // target with distortion, not a class change, so they never feed
      // these rules.
      if (production.errorType !== 'substitution' && production.errorType !== undefined) continue;
      const producedClass = classify(production.ipa);
      if (!targetClass || !producedClass) continue;

      if (
        (targetClass.kind === 'fricative' || targetClass.kind === 'affricate') &&
        producedClass.kind === 'stop'
      ) {
        addOccurrence('stopping', example);
      }
      if (targetClass.kind === 'affricate' && producedClass.kind === 'fricative') {
        addOccurrence('deaffrication', example);
      }
      if (targetClass.place === 'velar' && producedClass.place === 'alveolar') {
        addOccurrence('fronting', example);
      }
      if (targetClass.place === 'alveolar' && producedClass.place === 'velar') {
        addOccurrence('backing', example);
      }
      if (targetClass.kind === 'liquid' && producedClass.kind === 'glide') {
        addOccurrence('gliding', example);
      }
      if (targetClass.kind === 'liquid' && producedClass.kind === 'vowel') {
        addOccurrence('vocalization', example);
      }
      if (
        unit.position === 'final' &&
        isObstruent(targetClass) &&
        VOICELESS_COGNATE[targetClass.canonical] === producedClass.canonical &&
        VOICELESS_COGNATE[targetClass.canonical] !== undefined
      ) {
        addOccurrence('final-devoicing', example);
      }
      if (
        unit.position === 'initial' &&
        isObstruent(targetClass) &&
        VOICED_COGNATE[targetClass.canonical] === producedClass.canonical &&
        VOICED_COGNATE[targetClass.canonical] !== undefined
      ) {
        addOccurrence('prevocalic-voicing', example);
      }
      const denasalTarget = DENASAL_COGNATE[targetClass.canonical];
      if (targetClass.kind === 'nasal' && denasalTarget !== undefined && denasalTarget === producedClass.canonical) {
        addOccurrence('denasalization', example);
      }
      // Assimilation (approximate, place only): the produced segment is a
      // different consonant that is itself a target consonant elsewhere in
      // the same word.
      if (
        unit.type === 'consonant' &&
        producedClass.kind !== 'vowel' &&
        producedClass.canonical !== targetClass.canonical &&
        result.phonemes.some(
          (otherUnit: PhonemeUnit, otherIndex: number) =>
            otherIndex !== entry.index &&
            otherUnit.type === 'consonant' &&
            classify(otherUnit.phoneme)?.canonical === producedClass.canonical
        )
      ) {
        addOccurrence('assimilation', example);
      }
    }
  }

  const processes: PhonologicalProcessResult[] = [];
  for (const definition of PHONOLOGICAL_PROCESS_DEFINITIONS) {
    const acc = accumulators.get(definition.id);
    if (!acc || acc.occurrences === 0) continue;
    const percent = acc.opportunities === 0 ? 0 : Math.round((acc.occurrences / acc.opportunities) * 100);
    processes.push({
      id: definition.id,
      label: definition.label,
      occurrences: acc.occurrences,
      opportunities: acc.opportunities,
      percent,
      present: acc.occurrences >= 2 && percent >= 40,
      examples: acc.examples,
    });
  }

  return { processes, countedProductions, countedWords };
}
