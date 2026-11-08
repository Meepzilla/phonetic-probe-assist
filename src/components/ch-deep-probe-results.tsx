'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { useMemo, useState } from 'react';
import { CH_DEEP_PROBE_SECTIONS } from '@/lib/ch-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from '@/components/shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';
import { PCC } from './pcc';

interface ChDeepProbeResultsProps {
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


export function ChDeepProbeResults({ session }: ChDeepProbeResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords } = usePhonemeCoverage(session);
    const [selectedSection, setSelectedSection] = useState<DetailedResult | null>(null);

    const { mainResults, detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const CH_TARGETS = ['tʃ', 'dʒ'];
        const mainResults: Record<string, ResultSummary> = {
            'Initial /tʃ/': { correct: 0, total: 12 },
            'Medial /tʃ/': { correct: 0, total: 8 },
            'Final /tʃ/': { correct: 0, total: 8 },
            'Initial, Medial, Final /dʒ/': { correct: 0, total: 6 },
        };

        const detailedResults: DetailedResult[] = CH_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                const targetProductions = result.productions.filter((prod, index) =>
                    CH_TARGETS.some(target => result.phonemes[index].phoneme.includes(target))
                );
                if (targetProductions.length === 0) return false;
                return targetProductions.every(p => p.isCorrect);
            }).length;

            const totalInSection = section.words.length;
            
            if (section.subCategory.startsWith('I.')) mainResults['Initial /tʃ/'].correct += correctCount;
            else if (section.subCategory.startsWith('II.')) mainResults['Medial /tʃ/'].correct += correctCount;
            else if (section.subCategory.startsWith('III.')) mainResults['Final /tʃ/'].correct += correctCount;
            else if (section.subCategory.startsWith('IV.')) mainResults['Initial, Medial, Final /dʒ/'].correct += correctCount;
            
            return {
                category: section.category,
                subCategory: section.subCategory,
                words: section.words,
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
    
    const getWordsForMainCategory = (mainCat: string): DetailedResult => {
        const words: string[] = [];
        let category = 'CH'; // Default category
        let subCategory = mainCat;
        detailedResults.forEach(dr => {
            let currentMainCat = '';
            if (dr.subCategory.startsWith('I.')) currentMainCat = 'Initial /tʃ/';
            else if (dr.subCategory.startsWith('II.')) currentMainCat = 'Medial /tʃ/';
            else if (dr.subCategory.startsWith('III.')) currentMainCat = 'Final /tʃ/';
            else if (dr.subCategory.startsWith('IV.')) currentMainCat = 'Initial, Medial, Final /dʒ/';
            
            if (currentMainCat === mainCat) {
                words.push(...dr.words);
                category = dr.category;
            }
        });
        return {
            category,
            subCategory,
            words,
            correct: 0, // not needed for this modal
            total: 0 // not needed for this modal
        };
    };

    const CH_TARGETS = ['tʃ', 'dʒ'];

    return (
        <div className="space-y-8">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>"CH" /tʃ/ and "DZH" /dʒ/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary of performance for client: <span className="font-bold text-foreground">{session.clientId}</span>. Click a row for details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="text-right font-bold">Number Correct</TableHead>
                                <TableHead className="text-right font-bold">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(mainResults).map(([category, result]) => (
                                <TableRow key={`ch-${category}`} onClick={() => setSelectedSection(getWordsForMainCategory(category))} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>{category}</TableCell>
                                    <TableCell className="text-right">{result.correct} / {result.total}</TableCell>
                                    <TableCell className="text-right">{getPercentage(result.correct, result.total)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <div className="text-right font-bold">
                        <p>Total /tʃ/ & /dʒ/ Probe:</p>
                        <p>{totalCorrect} / {grandTotal} = {getPercentage(totalCorrect, grandTotal)}%</p>
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={!!selectedSection} onOpenChange={(isOpen) => !isOpen && setSelectedSection(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedSection?.subCategory}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {getWordResultsForSection(selectedSection).map(wordResult => {
                            if (!wordResult) return null;
                            const targetProductions = wordResult.productions.filter((p, i) => 
                                CH_TARGETS.some(target => wordResult.phonemes[i]?.phoneme.includes(target))
                            );
                            const isWordCorrect = !wordResult.skipped && targetProductions.every(p => p.isCorrect);
                            const wordErrors = wordResult.productions.map((p, i) => ({...p, phoneme: wordResult.phonemes[i]}))
                                .filter(p => !p.isCorrect && CH_TARGETS.some(target => p.phoneme.phoneme.includes(target)));

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
            />
        </div>
    );
}
