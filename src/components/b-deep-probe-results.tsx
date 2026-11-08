
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProbeSession } from '@/lib/types';
import { useMemo } from 'react';
import { B_DEEP_PROBE_SECTIONS } from '@/lib/b-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { PCC } from './pcc';

interface BDeepProbeResultsProps {
    session: ProbeSession;
}

interface SectionResult {
    category: string;
    subCategory: string;
    words: string[];
    correct: number;
    total: number;
}

export function BDeepProbeResults({ session }: BDeepProbeResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);

    const { detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const results: SectionResult[] = B_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                
                const targetIndices = result.phonemes
                    .map((p, i) => (p.phoneme.includes('b') ? i : -1))
                    .filter(i => i !== -1);

                if (targetIndices.length === 0) return false;

                return targetIndices.every(index => result.productions[index].isScored && result.productions[index].isCorrect);
            }).length;

            const totalInSection = wordsInSection.filter(r => r.productions.some(prod => prod.isScored)).length;
            
            return {
                category: section.category,
                subCategory: section.subCategory,
                words: section.words,
                correct: correctCount,
                total: totalInSection,
            };
        });

        const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
        const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

        return {
            detailedResults: results,
            totalCorrect,
            grandTotal,
        };
    }, [session]);

    const getPercentage = (correct: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    }

    return (
        <div className="space-y-8">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>/b/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary of /b/ performance for client: <span className="font-bold text-foreground">{session.clientId}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="text-right font-bold">Number Correct</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detailedResults.map((result, index) => (
                                <TableRow key={`b-${index}`}>
                                    <TableCell>{result.subCategory}</TableCell>
                                    <TableCell className="text-right">{result.correct} / {result.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <div className="text-right font-bold">
                        <p>/b/ Total:</p>
                        <p>{totalCorrect} / {grandTotal} = {getPercentage(totalCorrect, grandTotal)}%</p>
                    </div>
                </CardFooter>
            </Card>

            <SharedCoverageDetails
                coverage={coverage}
                errors={errors}
                phoneticInventory={phoneticInventory}
                phonemeSet={phonemeSet}
                correctWords={correctWords}
                attemptedWords={attemptedWords}
                scoredUnits={scoredUnits}
            />
        </div>
    );
}
