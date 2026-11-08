
'use client'

import { useMemo, useState } from 'react';
import type { ProbeSession, ErrorType, ProbeWordResult } from '@/lib/types';
import { ALL_PHONEMES, ALL_SPANISH_PHONEMES } from '@/lib/constants';
import { isProductionCounted } from '@/lib/scoring';

interface CoverageData {
    [phoneme: string]: {
        initial: number;
        medial: number;
        final: number;
    }
}

interface ErrorRecord {
    phoneme: string;
    position: 'initial' | 'medial' | 'final';
    errorType: ErrorType;
    word: string;
    detail: string;
}

export function usePhonemeCoverage(session: ProbeSession | null) {

    const phonemeSet = useMemo(() => {
        if (!session) return [];
        return session.probeType === 'spanish-general' ? ALL_SPANISH_PHONEMES : ALL_PHONEMES;
    }, [session]);

    const { coverage, errors, phoneticInventory, correctWords, attemptedWords, scoredUnits } = useMemo(() => {
        if (!session) return { coverage: {}, errors: [], phoneticInventory: [], correctWords: {}, attemptedWords: 0, scoredUnits: 0 };

        const coverage: CoverageData = phonemeSet.reduce((acc, p) => ({ ...acc, [p]: { initial: 0, medial: 0, final: 0 } }), {});
        const errors: ErrorRecord[] = [];
        const correctWords: Record<string, Record<string, ProbeWordResult[]>> = {};
        let attemptedWords = 0;
        let scoredUnits = 0;

        session.results.forEach(result => {
            const wordCounted = result.productions.some(prod => isProductionCounted(prod, session));
            if (!wordCounted) return;

            if (!result.skipped) {
                attemptedWords++;
                scoredUnits += result.productions.filter(prod => isProductionCounted(prod, session)).length;
            }

            if (result.skipped) {
                // If word is skipped, count all its phonemes as omissions
                result.phonemes.forEach(unit => {
                     if (unit.phoneme && coverage[unit.phoneme]) {
                        errors.push({
                            phoneme: unit.phoneme,
                            position: unit.position,
                            errorType: 'omission',
                            word: result.word,
                            detail: `Skipped`
                        });
                    }
                });
                return;
            }

            result.phonemes.forEach((unit, index) => {
                const prod = result.productions[index];
                if (!isProductionCounted(prod, session)) return; // Guard against missing production data and productions that do not count under the session's scoring settings
                const position = unit.position;
                const targetPhoneme = unit.phoneme;

                if (targetPhoneme && coverage[targetPhoneme]) {
                    if (prod.isCorrect) {
                        coverage[targetPhoneme][position]++;
                        if (!correctWords[targetPhoneme]) {
                            correctWords[targetPhoneme] = { initial: [], medial: [], final: [] };
                        }
                        if(!correctWords[targetPhoneme][position].find(r => r.word === result.word)) {
                           correctWords[targetPhoneme][position].push(result);
                        }
                    } else {
                        errors.push({
                            phoneme: targetPhoneme,
                            position,
                            errorType: prod.errorType || 'substitution', // Default to substitution if no type is set
                            word: result.word,
                            detail: `${prod.ipa || "ø"} for /${targetPhoneme}/`
                        });
                    }
                }
            });
        });
        
        const phoneticInventory = phonemeSet.filter(p => {
            const positions = coverage[p];
            if (!positions) return false;
            // A phoneme is in the inventory if it's produced correctly at least twice in ANY single position.
            return positions.initial >= 2 || positions.medial >= 2 || positions.final >= 2;
        });

        return { coverage, errors, phoneticInventory, correctWords, attemptedWords, scoredUnits };
    }, [session, phonemeSet]);
    
    const [selectedWordDetails, setSelectedWordDetails] = useState<ProbeWordResult | null>(null);
    const onWordClick = (wordResult: ProbeWordResult) => {
        setSelectedWordDetails(wordResult);
    }

    return { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits, selectedWordDetails, setSelectedWordDetails, onWordClick };
}
