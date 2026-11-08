'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProbeSession } from '@/lib/types';
import { isProductionCounted, scoringBasisLabel } from '@/lib/scoring';
import { useMemo } from 'react';

interface PCCProps {
    session: ProbeSession | null;
}

export function PCC({ session }: PCCProps) {
    const { pcc, attemptedWords, scoredConsonants } = useMemo(() => {
        if (!session) return { pcc: 0, attemptedWords: 0, scoredConsonants: 0 };

        let totalConsonants = 0;
        let correctConsonants = 0;
        let attemptedWords = 0;
        const fullBasis = session.scoringBasis === 'full';

        session.results.forEach(result => {
            if (result.skipped) return;

            let wordAttempted = false;
            result.phonemes.forEach((unit, index) => {
                const production = result.productions[index];
                const counted = isProductionCounted(production, session);
                if (counted) {
                    wordAttempted = true;
                }
                if (unit.type === 'consonant') {
                    if (fullBasis || counted) {
                        totalConsonants++;
                    }
                    if (counted && production?.isCorrect) {
                        correctConsonants++;
                    }
                }
            });
            if (wordAttempted) attemptedWords++;
        });

        const pcc = totalConsonants === 0 ? 0 : Math.round((correctConsonants / totalConsonants) * 100);
        return { pcc, attemptedWords, scoredConsonants: totalConsonants };
    }, [session]);

    if (!session) return null;

    const isScored = scoredConsonants > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Overall Accuracy</CardTitle>
                <CardDescription>
                    Percentage of Consonants Correct (PCC) for this session.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                    {isScored ? (
                        <p className="text-4xl font-bold text-primary">{pcc}%</p>
                    ) : (
                        <p className="text-4xl font-bold text-primary">Not scored</p>
                    )}
                    <p className="text-muted-foreground">PCC Score</p>
                </div>
                <Progress value={isScored ? pcc : 0} className="w-full" />
                <p className="text-sm text-muted-foreground">
                    {attemptedWords} words attempted · {scoredConsonants} consonant units scored · Scoring basis: {scoringBasisLabel(session.scoringBasis)} · Unadministered words count as correct: {session.countUnadministeredAsCorrect ? 'Yes' : 'No'}
                </p>
            </CardContent>
        </Card>
    );
}
