export type ErrorType = 'substitution' | 'omission' | 'distortion' | 'addition';

export type ScoringBasis = 'attempted' | 'full';

export type PhonemeType = 'consonant' | 'vowel';
export type Voicing = 'voiced' | 'voiceless';
export type Manner = 'stop' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'glide';
export type Place = 'bilabial' | 'labiodental' | 'dental' | 'alveolar' | 'palatal' | 'velar' | 'glottal';
export type Tenseness = 'tense' | 'lax';
export type Stress = 'stressed' | 'unstressed';
export type ProbeType = 
    | 'general' 
    | 'spanish-general'
    | 'pip'
    | 'deep-s' 
    | 'deep-th' 
    | 'deep-r' 
    | 'deep-l' 
    | 'deep-k'
    | 'deep-g' 
    | 'deep-sh'
    | 'deep-ch'
    | 'deep-f'
    | 'deep-t'
    | 'deep-d'
    | 'deep-m'
    | 'deep-n'
    | 'deep-b'
    | 'deep-p';

export interface PhonemeProduction {
  isCorrect: boolean;
  isScored: boolean;
  ipa: string;
  errorType?: ErrorType;
  errorDetail?: string;
}

export interface PhonemeUnit {
  phoneme: string;
  position: 'initial' | 'medial' | 'final';
  type: PhonemeType;
  voicing?: Voicing;
  place?: Place;
  manner?: Manner;
  tenseness?: Tenseness;
  stress?: Stress;
}

export interface ProbeWordResult {
  word: string;
  phonemes: PhonemeUnit[];
  productions: PhonemeProduction[];
  skipped?: boolean;
  category?: string;
  subCategory?: string;
  imageUrl?: string;
  notes?: string;
}

export interface ProbeSession {
  sessionId: string;
  clientId: string;
  date: string;
  /**
   * Optional student birthdate as an ISO date string (yyyy-mm-dd).
   * When set, it takes precedence over studentAgeMonths wherever the
   * student's age is resolved (see student-age.ts).
   */
  studentBirthdate?: string;
  /** Optional student age in completed months, entered directly as years;months. */
  studentAgeMonths?: number;
  wordList: string[];
  results: ProbeWordResult[];
  probeType?: ProbeType;
  countUnadministeredAsCorrect: boolean;
  scoringBasis: ScoringBasis;
}

export interface DeepProbeSection {
  category: string;
  subCategory: string;
  words: string[];
}
