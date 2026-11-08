
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { isProductionCorrect, isProductionCounted } from '@/lib/scoring';
import { useMemo } from 'react';
import { G_DEEP_PROBE_SECTIONS } from '@/lib/g-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';
import { PCC } from './pcc';

interface GDeepProbeResultsProps {
    session: ProbeSession;
}

interface SectionResult {
    category: string;
    subCategory: string;
    words: string[];
    correct: number;
    total: number;
}

export function GDeepProbeResults({ session }: GDeepProbeResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits, onWordClick, selectedWordDetails, setSelectedWordDetails } = usePhonemeCoverage(session);

    const { detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const results: SectionResult[] = G_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            const targetPhoneme = 'g';
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                
                const targetIndices = result.phonemes
                    .map((p, i) => (p.phoneme === targetPhoneme ? i : -1))
                    .filter(i => i !== -1);

                if (targetIndices.length === 0) return false;

                return targetIndices.every(index => isProductionCorrect(result.productions[index], session));
            }).length;

            const totalInSection = session.scoringBasis === 'full' ? wordsInSection.length : wordsInSection.filter(r => r.productions.some(prod => isProductionCounted(prod, session))).length;
            
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
    
    const getWordResultsForSection = (section: SectionResult | null): ProbeWordResult[] => {
        if (!section) return [];
        return section.words.map(word => session.results.find(r => r.word === word)).filter(Boolean) as ProbeWordResult[];
    };

    return (
        <div className="space-y-8">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>/g/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary of /g/ performance for client: <span className="font-bold text-foreground">{session.clientId}</span>.
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
                                <TableRow key={`g-${index}`}>
                                    <TableCell>{result.subCategory}</TableCell>
                                    <TableCell className="text-right">{result.correct} / {result.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <div className="text-right font-bold">
                        <p>/g/ Total:</p>
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
                scoringBasis={session.scoringBasis}
                countUnadministeredAsCorrect={session.countUnadministeredAsCorrect}
            />
        </div>
    );
}
