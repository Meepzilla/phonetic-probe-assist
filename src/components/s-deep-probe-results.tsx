'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { useMemo, useState } from 'react';
import { S_DEEP_PROBE_SECTIONS } from '@/lib/s-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from '@/components/shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';
import { PCC } from '@/components/pcc';

interface SDeepProbeResultsProps {
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

export function SDeepProbeResults({ session }: SDeepProbeResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);
    const [selectedSection, setSelectedSection] = useState<DetailedResult | null>(null);

    const { resultsByMainCategory, detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const mainCategories: Record<string, ResultSummary> = {
            'Initial /s/': { correct: 0, total: 0 },
            'Medial /s/': { correct: 0, total: 0 },
            'Final /s/': { correct: 0, total: 0 },
            'Blend Combinations': { correct: 0, total: 0 },
        };

        const detailedResults: DetailedResult[] = S_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                
                const targetIndices = result.phonemes
                    .map((p, i) => (p.phoneme.includes('s') ? i : -1))
                    .filter(i => i !== -1);

                if (targetIndices.length === 0) return false;

                return targetIndices.every(index => result.productions[index].isScored && result.productions[index].isCorrect);
            }).length;

            const totalInSection = wordsInSection.filter(r => r.productions.some(prod => prod.isScored)).length;

             if (section.category.startsWith('I.')) {
                mainCategories['Initial /s/'].correct += correctCount;
                mainCategories['Initial /s/'].total += totalInSection;
            } else if (section.category.startsWith('II.')) {
                mainCategories['Medial /s/'].correct += correctCount;
                mainCategories['Medial /s/'].total += totalInSection;
            } else if (section.category.startsWith('III.')) {
                mainCategories['Final /s/'].correct += correctCount;
                mainCategories['Final /s/'].total += totalInSection;
            } else if (section.category.startsWith('IV.')) {
                mainCategories['Blend Combinations'].correct += correctCount;
                mainCategories['Blend Combinations'].total += totalInSection;
            }

            return {
                ...section,
                correct: correctCount,
                total: totalInSection
            };
        });

        const overallCorrect = detailedResults.reduce((sum, r) => sum + r.correct, 0);
        const overallTotal = detailedResults.reduce((sum, r) => sum + r.total, 0);

        return {
            resultsByMainCategory: mainCategories,
            detailedResults: detailedResults,
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
    
    const getWordsForMainCategory = (mainCat: string): DetailedResult => {
        const words: string[] = [];
        let category = ''; 
        detailedResults.forEach(dr => {
            let currentMainCat = '';
            if (dr.category.startsWith('I.')) currentMainCat = 'Initial /s/';
            else if (dr.category.startsWith('II.')) currentMainCat = 'Medial /s/';
            else if (dr.category.startsWith('III.')) currentMainCat = 'Final /s/';
            else if (dr.category.startsWith('IV.')) currentMainCat = 'Blend Combinations';
            
            if (currentMainCat === mainCat) {
                words.push(...dr.words);
                category = dr.category;
            }
        });
        return {
            category,
            subCategory: mainCat,
            words,
            correct: 0, 
            total: 0
        };
    };

    return (
        <div className="space-y-6">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>/s/ Deep Screening Probe Results</CardTitle>
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
                            {Object.entries(resultsByMainCategory).map(([category, results]) => (
                                <TableRow key={category}>
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
                        <p>Total /s/ Probe:</p>
                        <p>{totalCorrect} / {grandTotal} = {getPercentage(totalCorrect, grandTotal)}%</p>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>
                       Correct productions for each sub-category of the /s/ deep probe. Click a row for details.
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
                                wordResult.phonemes[i]?.phoneme.includes('s')
                            );
                            const isWordCorrect = !wordResult.skipped && targetProductions.every(p => p.isScored && p.isCorrect);
                            const wordErrors = wordResult.productions.map((p, i) => ({...p, phoneme: wordResult.phonemes[i]}))
                                .filter(p => p.isScored && !p.isCorrect && p.phoneme.phoneme.includes('s'));

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
