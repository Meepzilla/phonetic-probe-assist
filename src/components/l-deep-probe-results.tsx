'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { useMemo, useState } from 'react';
import { L_DEEP_PROBE_SECTIONS } from '@/lib/l-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from '@/components/shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';
import { PCC } from './pcc';

interface LDeepProbeResultsProps {
    session: ProbeSession;
}

interface ResultSummary {
    correct: number;
    total: number;
}

interface DetailedResult {
    category: string;
    subCategory: string;
    words: string[];
    correct: number;
    total: number;
}

export function LDeepProbeResults({ session }: LDeepProbeResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);
    const [selectedSection, setSelectedSection] = useState<DetailedResult | null>(null);

    const { mainResults, detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const mainResults: Record<string, ResultSummary> = {
            'Initial, Medial, Final /l/': { correct: 0, total: 0 },
            'Combinations/Blends': { correct: 0, total: 0 },
        };

        const detailedResults: DetailedResult[] = L_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                const targetProductions = result.productions.filter((prod, index) =>
                    result.phonemes[index].phoneme.includes('l')
                );
                if (targetProductions.length === 0) return false;
                return targetProductions.every(p => p.isScored && p.isCorrect);
            }).length;
            
            const totalInSection = wordsInSection.filter(r => r.productions.some(prod => prod.isScored)).length;
            
            if (section.category.includes('INITIAL') || section.category.includes('MEDIAL') || section.category.includes('FINAL')) {
                mainResults['Initial, Medial, Final /l/'].correct += correctCount;
                mainResults['Initial, Medial, Final /l/'].total += totalInSection;
            } else if (section.category.includes('BLEND')) {
                mainResults['Combinations/Blends'].correct += correctCount;
                mainResults['Combinations/Blends'].total += totalInSection;
            }
            
            return {
                ...section,
                correct: correctCount,
                total: totalInSection
            };
        });
        
        const overallCorrect = Object.values(mainResults).reduce((sum, cat) => sum + cat.correct, 0);
        const overallTotal = Object.values(mainResults).reduce((sum, cat) => sum + cat.total, 0);

        return {
            mainResults,
            detailedResults,
            totalCorrect: overallCorrect,
            grandTotal: overallTotal,
        };

    }, [session]);

    const getPercentage = (correct: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    }

    const getWordResultsForSection = (section: DetailedResult | null): ProbeWordResult[] => {
        if (!section) return [];
        return section.words.map(word => session.results.find(r => r.word === word)).filter(Boolean) as ProbeWordResult[];
    };

    return (
        <div className="space-y-6">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>"L" Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary of performance for client: <span className="font-bold text-foreground">{session.clientId}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="text-center font-bold">Number Correct</TableHead>
                                <TableHead className="text-center font-bold">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(mainResults).map(([category, results]) => (
                                <TableRow key={category} className="bg-muted/50">
                                    <TableCell className="font-semibold">{category}</TableCell>
                                    <TableCell className="text-center font-semibold">{results.correct} / {results.total}</TableCell>
                                    <TableCell className="text-center font-semibold">{getPercentage(results.correct, results.total)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <div className="text-right font-bold">
                        <p>Complete /l/ Probe:</p>
                        <p>{totalCorrect} / {grandTotal} = {getPercentage(totalCorrect, grandTotal)}%</p>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>
                       Correct productions for each sub-category of the /l/ deep probe. Click a row for details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sub-Category</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detailedResults.map((result, index) => (
                                <TableRow key={index} onClick={() => setSelectedSection(result)} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <p className="font-medium">{result.category}</p>
                                        <p className="text-sm text-muted-foreground">{result.subCategory}</p>
                                    </TableCell>
                                    <TableCell className="text-right">{result.correct} / {result.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedSection} onOpenChange={(isOpen) => !isOpen && setSelectedSection(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedSection?.category} - {selectedSection?.subCategory}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {getWordResultsForSection(selectedSection).map(wordResult => {
                            if (!wordResult) return null;
                            const targetProductions = wordResult.productions.filter((p, i) => 
                                wordResult.phonemes[i]?.phoneme.includes('l')
                            );
                            const isWordCorrect = !wordResult.skipped && targetProductions.every(p => p.isScored && p.isCorrect);
                            const wordErrors = wordResult.productions.map((p, i) => ({...p, phoneme: wordResult.phonemes[i]}))
                                .filter(p => p.isScored && !p.isCorrect && p.phoneme.phoneme.includes('l'));

                            return (
                                <div key={wordResult.word} className="flex items-start justify-between p-3 rounded-lg border">
                                    <div className="flex flex-col gap-1">
                                       <span className="font-bold">{wordResult.word}</span>
                                       {wordResult.skipped ? (
                                            <Badge variant="outline" className="w-fit">Skipped</Badge>
                                       ) : !isWordCorrect && wordErrors.map((error, idx) => (
                                           <div key={idx} className="text-sm text-muted-foreground">
                                                <Badge variant="destructive" className="capitalize mr-2">{error.errorType}</Badge>
                                                <span>`{error.ipa}` for /{error.phoneme.phoneme}/</span>
                                                {error.errorDetail && ` (${error.errorDetail})`}
                                           </div>
                                       ))}
                                    </div>
                                    {wordResult.skipped ? null : isWordCorrect ? (
                                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>

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
