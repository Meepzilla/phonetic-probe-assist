'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProbeSession } from '@/lib/types';
import { useMemo } from 'react';

interface PCCProps {
    session: ProbeSession | null;
}

export function PCC({ session }: PCCProps) {
    const pcc = useMemo(() => {
        if (!session) return 0;

        let totalConsonants = 0;
        let correctConsonants = 0;

        session.results.forEach(result => {
            if (result.skipped) return;

            result.phonemes.forEach((unit, index) => {
                if (unit.type === 'consonant') {
                    const production = result.productions[index];
                    if (production) {
                        totalConsonants++;
                        if (production.isCorrect) {
                            correctConsonants++;
                        }
                    }
                }
            });
        });

        if (totalConsonants === 0) return 0;
        return Math.round((correctConsonants / totalConsonants) * 100);
    }, [session]);

    if (!session) return null;

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
                    <p className="text-4xl font-bold text-primary">{pcc}%</p>
                    <p className="text-muted-foreground">PCC Score</p>
                </div>
                <Progress value={pcc} className="w-full" />
            </CardContent>
        </Card>
    );
}
