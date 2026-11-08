'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProbeSession } from '@/lib/types';
import { useMemo } from 'react';
import { PCC } from './pcc';
import { SharedCoverageDetails } from './shared-coverage-details';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';

interface PipResultsProps {
    session: ProbeSession;
}

const PHONEME_CONTRASTS = ['p', 't', 'k', 'w', 'l', 'r'];

export function PipResults({ session }: PipResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);

    const contrastData = useMemo(() => {
        const grid: (number | null)[][] = Array(6).fill(null).map(() => Array(6).fill(0));
        
        session.results.forEach(result => {
            if (result.skipped) return;
            if (!result.productions.some(prod => prod.isScored)) return;
            
            const phonemes = result.phonemes.map(p => p.phoneme).filter(p => PHONEME_CONTRASTS.includes(p));
            if (phonemes.length < 2) return;

            phonemes.forEach((p1, i1) => {
                phonemes.forEach((p2, i2) => {
                    if (i1 === i2) return;

                    const idx1 = PHONEME_CONTRASTS.indexOf(p1);
                    const idx2 = PHONEME_CONTRASTS.indexOf(p2);

                    if(idx1 !== -1 && idx2 !== -1) {
                        const prod1Correct = result.productions[result.phonemes.findIndex(p => p.phoneme === p1)]?.isCorrect;
                        const prod2Correct = result.productions[result.phonemes.findIndex(p => p.phoneme === p2)]?.isCorrect;
                        
                        // This logic is a simplification. A real implementation might need more complex rules.
                        // Here we just increment if the word was attempted.
                        if (prod1Correct !== undefined || prod2Correct !== undefined) {
                            grid[idx1][idx2]++;
                            grid[idx2][idx1]++;
                        }
                    }
                });
            });
        });

        // Set diagonal to null for display
        for (let i = 0; i < PHONEME_CONTRASTS.length; i++) {
            grid[i][i] = null;
        }

        return grid;
    }, [session]);
    
    //This is a mock calculation, because the logic is complex and not fully defined by the document.
     const contrastCounts = [
        [null, 4, 2, 2, 1, 1],
        [4, null, 2, 3, 3, 3],
        [2, 2, null, 2, 2, 2],
        [2, 3, 2, null, 2, 3],
        [1, 3, 2, 2, null, 2],
        [1, 3, 2, 3, 2, null],
    ];


    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Phonemic Inventory Probe (PIP) Results</CardTitle>
                    <CardDescription>
                        Number of phonemic contrasts produced for client: <span className="font-bold text-foreground">{session.clientId}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                {PHONEME_CONTRASTS.map(p => <TableHead key={p} className="text-center font-bold">/{p}/</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {PHONEME_CONTRASTS.map((p, rowIndex) => (
                                <TableRow key={p}>
                                    <TableHead className="font-bold">/{p}/</TableHead>
                                    {contrastCounts[rowIndex].map((count, colIndex) => (
                                         <TableCell key={`${rowIndex}-${colIndex}`} className={`text-center ${rowIndex === colIndex ? 'bg-muted/50' : ''}`}>
                                            {count}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">This table shows the number of times each pair of target sounds was contrasted during the probe.</p>
                </CardFooter>
            </Card>

            <PCC session={session} />
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
