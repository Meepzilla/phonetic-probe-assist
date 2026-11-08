'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { useMemo, useState } from 'react';
import { N_DEEP_PROBE_SECTIONS } from '@/lib/n-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';
import { PCC } from './pcc';

interface NDeepProbeResultsProps {
    session: ProbeSession;
}

interface SectionResult {
    category: string;
    subCategory: string;
    words: string[];
    correct: number;
    total: number;
}

export function NDeepProbeResults({ session }: NDeepProbeResultsProps) {
    const N_TARGETS = ['n', 'ŋ'];
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);
    const [selectedSection, setSelectedSection] = useState<SectionResult | null>(null);

    const { detailedResults, totalCorrect, grandTotal } = useMemo(() => {
        const results: SectionResult[] = N_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            
            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                const targetProductions = result.productions.filter((prod, index) =>
                    N_TARGETS.some(target => result.phonemes[index].phoneme.includes(target))
                );
                if (targetProductions.length === 0) return false;
                return targetProductions.every(p => p.isScored && p.isCorrect);
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
    
    const getWordResultsForSection = (section: SectionResult | null): ProbeWordResult[] => {
        if (!section) return [];
        return section.words.map(word => session.results.find(r => r.word === word)).filter(Boolean) as ProbeWordResult[];
    };

    return (
        <div className="space-y-8">
            <PCC session={session} />
            <Card>
                <CardHeader>
                    <CardTitle>/n/ & /ŋ/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary of /n/ & /ŋ/ performance for client: <span className="font-bold text-foreground">{session.clientId}</span>. Click a row for details.
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
                                <TableRow key={`n-${index}`} onClick={() => setSelectedSection(result)} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>{result.subCategory}</TableCell>
                                    <TableCell className="text-right">{result.correct} / {result.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <div className="text-right font-bold">
                        <p>/n/ & /ŋ/ Total:</p>
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
                                N_TARGETS.some(target => wordResult.phonemes[i]?.phoneme.includes(target))
                            );
                            const isWordCorrect = !wordResult.skipped && targetProductions.every(p => p.isScored && p.isCorrect);
                            const wordErrors = wordResult.productions.map((p, i) => ({...p, phoneme: wordResult.phonemes[i]}))
                                .filter(p => p.isScored && !p.isCorrect && N_TARGETS.some(target => p.phoneme.phoneme.includes(target)));

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
