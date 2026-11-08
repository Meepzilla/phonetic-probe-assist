'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ProbeSession, ProbeWordResult } from '@/lib/types';
import { isProductionCorrect, isProductionCounted } from '@/lib/scoring';
import { useMemo, useState } from 'react';
import { SH_CH_DEEP_PROBE_SECTIONS } from '@/lib/sh-ch-probe-constants';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { CheckCircle, XCircle } from 'lucide-react';

interface ShChDeepProbeResultsProps {
    session: ProbeSession;
}

interface SectionResult {
    mainCategory: 'SH' | 'CH';
    category: string;
    subCategory: string;
    words: string[];
    correct: number;
    total: number;
}

interface Summary {
    correct: number;
    total: number;
    words: string[];
}


export function ShChDeepProbeResults({ session }: ShChDeepProbeResultsProps) {
    const [selectedSection, setSelectedSection] = useState<SectionResult | null>(null);

    const { shResults, chResults, shTotalCorrect, shGrandTotal, chTotalCorrect, chGrandTotal, detailedResults } = useMemo(() => {
        const SH_TARGETS = ['ʃ', 'ʒ'];
        const CH_TARGETS = ['tʃ', 'dʒ'];

        const results: SectionResult[] = SH_CH_DEEP_PROBE_SECTIONS.map(section => {
            const wordsInSection = session.results.filter(r => r.category === section.category && r.subCategory === section.subCategory);
            const isShSection = section.category === 'SH';
            const targets = isShSection ? SH_TARGETS : CH_TARGETS;

            const correctCount = wordsInSection.filter(result => {
                if (result.skipped) return false;
                const targetProductions = result.productions.filter((prod, index) =>
                    targets.some(target => result.phonemes[index].phoneme.includes(target))
                );
                if (targetProductions.length === 0) return false;
                return targetProductions.every(p => isProductionCorrect(p, session));
            }).length;

            const totalInSection = session.scoringBasis === 'full' ? wordsInSection.length : wordsInSection.filter(r => r.productions.some(prod => isProductionCounted(prod, session))).length;
            
            return {
                mainCategory: section.category as 'SH' | 'CH',
                category: section.category,
                subCategory: section.subCategory,
                words: section.words,
                correct: correctCount,
                total: totalInSection,
            };
        });

        const shDetailedResults = results.filter(r => r.mainCategory === 'SH');
        const chDetailedResults = results.filter(r => r.mainCategory === 'CH');

        const shSummary: Record<string, Summary> = {
            'Initial /ʃ/': { correct: 0, total: 0, words: [] },
            'Medial /ʃ/': { correct: 0, total: 0, words: [] },
            'Final /ʃ/': { correct: 0, total: 0, words: [] },
            'Medial/Final /ʒ/': { correct: 0, total: 0, words: [] },
        };
        
        shDetailedResults.forEach(res => {
            if (res.subCategory.startsWith('I.')) {
                shSummary['Initial /ʃ/'].correct += res.correct;
                shSummary['Initial /ʃ/'].total += res.total;
                shSummary['Initial /ʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('II.')) {
                shSummary['Medial /ʃ/'].correct += res.correct;
                shSummary['Medial /ʃ/'].total += res.total;
                shSummary['Medial /ʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('III.')) {
                shSummary['Final /ʃ/'].correct += res.correct;
                shSummary['Final /ʃ/'].total += res.total;
                shSummary['Final /ʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('IV.')) {
                shSummary['Medial/Final /ʒ/'].correct += res.correct;
                shSummary['Medial/Final /ʒ/'].total += res.total;
                shSummary['Medial/Final /ʒ/'].words.push(...res.words);
            }
        });

        const chSummary: Record<string, Summary> = {
            'Initial /tʃ/': { correct: 0, total: 0, words: [] },
            'Medial /tʃ/': { correct: 0, total: 0, words: [] },
            'Final /tʃ/': { correct: 0, total: 0, words: [] },
            'Initial, Medial, Final /dʒ/': { correct: 0, total: 0, words: [] },
        };

        chDetailedResults.forEach(res => {
            if (res.subCategory.startsWith('I.')) {
                chSummary['Initial /tʃ/'].correct += res.correct;
                chSummary['Initial /tʃ/'].total += res.total;
                chSummary['Initial /tʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('II.')) {
                chSummary['Medial /tʃ/'].correct += res.correct;
                chSummary['Medial /tʃ/'].total += res.total;
                chSummary['Medial /tʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('III.')) {
                chSummary['Final /tʃ/'].correct += res.correct;
                chSummary['Final /tʃ/'].total += res.total;
                chSummary['Final /tʃ/'].words.push(...res.words);
            } else if (res.subCategory.startsWith('IV.')) {
                chSummary['Initial, Medial, Final /dʒ/'].correct += res.correct;
                chSummary['Initial, Medial, Final /dʒ/'].total += res.total;
                chSummary['Initial, Medial, Final /dʒ/'].words.push(...res.words);
            }
        });


        const shTotalCorrect = Object.values(shSummary).reduce((sum, r) => sum + r.correct, 0);
        const shGrandTotal = Object.values(shSummary).reduce((sum, r) => sum + r.total, 0);

        const chTotalCorrect = Object.values(chSummary).reduce((sum, r) => sum + r.correct, 0);
        const chGrandTotal = Object.values(chSummary).reduce((sum, r) => sum + r.total, 0);

        return {
            shResults: shSummary,
            chResults: chSummary,
            shTotalCorrect,
            shGrandTotal,
            chTotalCorrect,
            chGrandTotal,
            detailedResults: results,
        };
    }, [session]);

    const getPercentage = (correct: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    }

    const { coverage, errors, phoneticInventory, phonemeSet, attemptedWords, scoredUnits } = usePhonemeCoverage(session);

    const getWordResultsForSection = (section: SectionResult | null): ProbeWordResult[] => {
        if (!section) return [];
        return section.words.map(word => session.results.find(r => r.word === word)).filter(Boolean) as ProbeWordResult[];
    };

    const SH_TARGETS = ['ʃ', 'ʒ'];
    const CH_TARGETS = ['tʃ', 'dʒ'];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>"SH" /ʃ/ and "ZH" /ʒ/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                        Summary for client: <span className="font-bold text-foreground">{session.clientId}</span>. Click a row for details.
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
                            {Object.entries(shResults).map(([category, result]) => (
                                 <TableRow key={`sh-${category}`} onClick={() => {
                                     const words = result.words;
                                     setSelectedSection({ mainCategory: 'SH', category, subCategory: category, words, correct: result.correct, total: result.total });
                                 }} className="cursor-pointer hover:bg-muted/50">
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
                        <p>Total /ʃ/ & /ʒ/ Probe:</p>
                        <p>{shTotalCorrect} / {shGrandTotal} = {getPercentage(shTotalCorrect, shGrandTotal)}%</p>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>"CH" /tʃ/ and "DZH" /dʒ/ Deep Screening Probe Results</CardTitle>
                    <CardDescription>
                         Summary for client: <span className="font-bold text-foreground">{session.clientId}</span>. Click a row for details.
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
                             {Object.entries(chResults).map(([category, result]) => (
                                 <TableRow key={`ch-${category}`} onClick={() => {
                                    const words = result.words;
                                    setSelectedSection({ mainCategory: 'CH', category, subCategory: category, words, correct: result.correct, total: result.total });
                                 }} className="cursor-pointer hover:bg-muted/50">
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
                        <p>{chTotalCorrect} / {chGrandTotal} = {getPercentage(chTotalCorrect, chGrandTotal)}%</p>
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
                            if (!wordResult || !selectedSection) return null;
                            const targets = selectedSection.mainCategory === 'SH' ? SH_TARGETS : CH_TARGETS;
                            const targetProductions = wordResult.productions.filter((p, i) => 
                                targets.some(target => wordResult.phonemes[i]?.phoneme.includes(target))
                            );
                            const isWordCorrect = !wordResult.skipped && targetProductions.every(p => p.isCorrect);
                            const wordErrors = wordResult.productions.map((p, i) => ({...p, phoneme: wordResult.phonemes[i]}))
                                .filter(p => !p.isCorrect && targets.some(target => p.phoneme.phoneme.includes(target)));

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
                attemptedWords={attemptedWords}
                scoredUnits={scoredUnits}
                scoringBasis={session.scoringBasis}
                countUnadministeredAsCorrect={session.countUnadministeredAsCorrect}
            />
        </div>
    );
}
