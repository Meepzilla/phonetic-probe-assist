import type { DeepProbeSection, PhonemeUnit } from './types';

export const PIP_SECTIONS: DeepProbeSection[] = [
    {
        category: "Phonemic Inventory Probe",
        subCategory: "Contrasts for /p/, /t/, /k/, /w/, /l/, /r/",
        words: [
            // p vs t (4)
            'cup', 'cut', 'pit', 'pip', 'tap', 'pat',
            // p vs k (2)
            'cap', 'pack',
            // p vs w (2)
            'pin', 'win', 'wag', 'pag', // using 'pag' as a stand-in
            // p vs l (1)
            'pill', 'lip', 'lap',
            // p vs r (1)
            'rip', 'rap',
            // t vs k (2)
            'cat', 'take', 'kate',
            // t vs w (3)
            'ten', 'when', 'white', 'tight', 'two', 'woo',
            // t vs l (3)
            'ten', 'len', 'light', 'tight', 'lot', 'let',
            // t vs r (3)
            'try', 'rye', 'rate', 'trait', 'tore', 'roar',
            // k vs w (2)
            'kick', 'wick', 'wake', 'cake',
            // k vs l (2)
            'key', 'lee', 'like', 'lock', 'luck',
            // k vs r (2)
            'rock', 'rack', 'rake',
            // w vs l (2)
            'well', 'will', 'law', 'wall',
            // w vs r (3)
            'wed', 'red', 'right', 'white', 'run', 'won',
            // l vs r (2)
            'light', 'right', 'lot', 'rot'
        ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    }
];


export const PIP_WORD_BANK: Record<string, PhonemeUnit[]> = {
    'cup': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'ʌ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'cut': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'ʌ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'pit': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'pip': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'tap': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'pat': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'cap': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'pack': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'pin': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'win': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'wag': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'g', position: 'final', type: 'consonant' }],
    'pag': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'g', position: 'final', type: 'consonant' }],
    'pill': [{ phoneme: 'p', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'l', position: 'final', type: 'consonant' }],
    'lip': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'lap': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'rip': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'rap': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'p', position: 'final', type: 'consonant' }],
    'cat': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'take': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'kate': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'ten': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'when': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'white': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'tight': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'two': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'u', position: 'final', type: 'vowel' }],
    'woo': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'u', position: 'final', type: 'vowel' }],
    'len': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'light': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'lot': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɑ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'let': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'try': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'final', type: 'vowel' }],
    'rye': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'final', type: 'vowel' }],
    'rate': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'trait': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'tore': [{ phoneme: 't', position: 'initial', type: 'consonant' }, { phoneme: 'ɔ', position: 'medial', type: 'vowel' }, { phoneme: 'r', position: 'final', type: 'consonant' }],
    'roar': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ɔ', position: 'medial', type: 'vowel' }, { phoneme: 'r', position: 'final', type: 'consonant' }],
    'kick': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'wick': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'wake': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'cake': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'key': [{ phoneme: 'k', position: 'initial', type: 'consonant' }, { phoneme: 'i', position: 'final', type: 'vowel' }],
    'lee': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'i', position: 'final', type: 'vowel' }],
    'like': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'lock': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɑ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'luck': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ʌ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'rock': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ɑ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'rack': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'æ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'rake': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'eɪ', position: 'medial', type: 'vowel' }, { phoneme: 'k', position: 'final', type: 'consonant' }],
    'well': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'l', position: 'final', type: 'consonant' }],
    'will': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɪ', position: 'medial', type: 'vowel' }, { phoneme: 'l', position: 'final', type: 'consonant' }],
    'law': [{ phoneme: 'l', position: 'initial', type: 'consonant' }, { phoneme: 'ɔ', position: 'final', type: 'vowel' }],
    'wall': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɔ', position: 'medial', type: 'vowel' }, { phoneme: 'l', position: 'final', type: 'consonant' }],
    'wed': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'd', position: 'final', type: 'consonant' }],
    'red': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ɛ', position: 'medial', type: 'vowel' }, { phoneme: 'd', position: 'final', type: 'consonant' }],
    'right': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'aɪ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
    'run': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ʌ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'won': [{ phoneme: 'w', position: 'initial', type: 'consonant' }, { phoneme: 'ʌ', position: 'medial', type: 'vowel' }, { phoneme: 'n', position: 'final', type: 'consonant' }],
    'rot': [{ phoneme: 'r', position: 'initial', type: 'consonant' }, { phoneme: 'ɑ', position: 'medial', type: 'vowel' }, { phoneme: 't', position: 'final', type: 'consonant' }],
};
