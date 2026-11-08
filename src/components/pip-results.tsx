'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProbeSession } from '@/lib/types';
import { computePipContrasts, PIP_CONTRAST_PHONEMES } from '@/lib/pip-contrasts';
import { useMemo } from 'react';
import { PCC } from './pcc';
import { SharedCoverageDetails } from './shared-coverage-details';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';

interface PipResultsProps {
    session: ProbeSession;
}

export function PipResults({ session }: PipResultsProps) {
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);

    const contrastData = useMemo(() => computePipContrasts(session), [session]);
    const hasCountedData = contrastData.countedProductions > 0;

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
                    {hasCountedData ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    {PIP_CONTRAST_PHONEMES.map(p => <TableHead key={p} className="text-center font-bold">/{p}/</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {PIP_CONTRAST_PHONEMES.map((p, rowIndex) => (
                                    <TableRow key={p}>
                                        <TableHead className="font-bold">/{p}/</TableHead>
                                        {(contrastData.grid[rowIndex] ?? []).map((cell, colIndex) => (
                                             <TableCell key={`${rowIndex}-${colIndex}`} className={`text-center ${rowIndex === colIndex ? 'bg-muted/50' : ''}`}>
                                                {cell ? (
                                                    <>
                                                        {cell.produced}
                                                        <span className="text-muted-foreground text-xs"> / {cell.attempted}</span>
                                                    </>
                                                ) : null}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground">No PIP data has been scored yet for this session.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">Each cell shows the number of times that pair of target sounds was produced correctly, out of the number of times it was attempted, counted once per word.</p>
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
                scoringBasis={session.scoringBasis}
                countUnadministeredAsCorrect={session.countUnadministeredAsCorrect}
            />
        </div>
    );
}
