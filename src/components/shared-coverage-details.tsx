
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { ErrorType, ProbeWordResult, ScoringBasis } from '@/lib/types';
import { scoringBasisLabel } from '@/lib/scoring';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Check, CheckCircle } from 'lucide-react';

interface CoverageData {
    [phoneme: string]: {
        initial: number;
        medial: number;
        final: number;
    }
}

interface ErrorRecord {
    phoneme: string;
    position: 'initial' | 'medial' | 'final';
    errorType: ErrorType;
    word: string;
    detail: string;
}

interface SharedCoverageDetailsProps {
    coverage: CoverageData;
    errors: ErrorRecord[];
    phoneticInventory: string[];
    phonemeSet: string[];
    correctWords?: Record<string, Record<string, ProbeWordResult[]>>;
    attemptedWords?: number;
    scoredUnits?: number;
    scoringBasis?: ScoringBasis;
    countUnadministeredAsCorrect?: boolean;
}

const CoverageBadge = ({ phoneme, position, count, words }: { phoneme: string; position: 'initial' | 'medial' | 'final'; count: number; words: ProbeWordResult[] | undefined }) => {
    const getBadgeVariant = (count: number): "default" | "secondary" | "destructive" => {
        if (count >= 2) return "default";
        if (count === 1) return "secondary";
        return "destructive";
    }

    if (words && words.length > 0) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Correct words for /${phoneme}/ in ${position} position`}
                        className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-md px-1"
                    >
                        <Badge variant={getBadgeVariant(count)} className="pointer-events-none text-lg">
                            {count}
                        </Badge>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-xs">
                    <p className="font-semibold">Correct words:</p>
                    <ul className="list-disc list-inside">
                        {words.map(w => <li key={w.word}>{w.word}</li>)}
                    </ul>
                </PopoverContent>
            </Popover>
        );
    }
    return (
        <Badge variant={getBadgeVariant(count)} className="text-lg">
            {count}
        </Badge>
    );
}

export function SharedCoverageDetails({ coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits, scoringBasis, countUnadministeredAsCorrect }: SharedCoverageDetailsProps) {
    const errorSummary = useMemo(() => {
        const summary: {[key: string]: number} = {
            substitution: 0,
            omission: 0,
            distortion: 0,
            addition: 0,
        };
        errors.forEach(err => {
            summary[err.errorType]++;
        });
        return Object.entries(summary).map(([name, value]) => ({ name, count: value })).filter(item => item.count > 0);
    }, [errors]);

    const getBadgeVariant = (count: number): "default" | "secondary" | "destructive" => {
        if (count >= 2) return "default";
        if (count === 1) return "secondary";
        return "destructive";
    }

    return (
        <div className="space-y-6 mt-6">
            {attemptedWords !== undefined && scoredUnits !== undefined && (
                <p className="text-sm text-muted-foreground">
                    {attemptedWords} words attempted · {scoredUnits} units scored
                    {scoringBasis !== undefined && (
                        <> · Scoring basis: {scoringBasisLabel(scoringBasis)} · Unadministered words count as correct: {countUnadministeredAsCorrect ? 'Yes' : 'No'}</>
                    )}
                </p>
            )}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        Confirmed Phonetic Inventory
                    </CardTitle>
                    <CardDescription>
                        The following sounds have been produced correctly at least twice in one or more word positions and are considered part of the client's inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {phoneticInventory.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-3">
                            {phoneticInventory.map(phoneme => (
                                <Badge key={phoneme} variant="default" className="px-3 py-1 text-base font-body">
                                    /{phoneme}/
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No phonemes have been confirmed in the inventory yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phoneme Coverage Details</CardTitle>
                    <CardDescription>
                        Detailed summary of correct productions for each phoneme across all word positions. A badge will highlight when a sound is produced correctly twice in a position, indicating it is confirmed for that position. Tap or click a badge to see the correct words.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                        {phonemeSet.map(phoneme => (
                            <div key={phoneme} className="flex justify-between items-center p-3 border rounded-lg bg-card shadow-sm">
                                <div className="font-semibold text-lg font-body">/{phoneme}/</div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Initial</div>
                                        <CoverageBadge phoneme={phoneme} position="initial" count={coverage[phoneme]?.initial ?? 0} words={correctWords?.[phoneme]?.initial} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Medial</div>
                                         <CoverageBadge phoneme={phoneme} position="medial" count={coverage[phoneme]?.medial ?? 0} words={correctWords?.[phoneme]?.medial} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Final</div>
                                         <CoverageBadge phoneme={phoneme} position="final" count={coverage[phoneme]?.final ?? 0} words={correctWords?.[phoneme]?.final} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">Phoneme</TableHead>
                                    <TableHead className="text-center">Initial</TableHead>
                                    <TableHead className="text-center">Medial</TableHead>
                                    <TableHead className="text-center">Final</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {phonemeSet.map(phoneme => (
                                    <TableRow key={phoneme}>
                                        <TableCell className="font-semibold text-lg font-body">/{phoneme}/</TableCell>
                                        <TableCell className="text-center">
                                            <CoverageBadge phoneme={phoneme} position="initial" count={coverage[phoneme]?.initial ?? 0} words={correctWords?.[phoneme]?.initial} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <CoverageBadge phoneme={phoneme} position="medial" count={coverage[phoneme]?.medial ?? 0} words={correctWords?.[phoneme]?.medial} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <CoverageBadge phoneme={phoneme} position="final" count={coverage[phoneme]?.final ?? 0} words={correctWords?.[phoneme]?.final} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Error Analysis</CardTitle>
                    <CardDescription>Summary and log of all recorded production errors.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Error Types</h3>
                         {errorSummary.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={errorSummary} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={80} />
                                    <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 p-8 rounded-lg">
                                <Check className="h-12 w-12 text-green-500 mb-4" />
                                <p className="font-semibold">No Errors Recorded</p>
                                <p className="text-sm text-muted-foreground">Excellent! All productions were marked as correct.</p>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold">Error Log</h3>
                        {errors.length > 0 ? (
                            <>
                                {/* Mobile View */}
                                <div className="md:hidden border rounded-lg max-h-[300px] overflow-y-auto p-2 space-y-2">
                                    {errors.map((error, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-card space-y-1 shadow-sm">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-semibold">{error.word}</span>
                                                <Badge variant="destructive" className="capitalize">{error.errorType}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{error.detail}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop View */}
                                <div className="hidden md:block border rounded-lg max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Word</TableHead>
                                                <TableHead>Error</TableHead>
                                                <TableHead>Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {errors.map((error, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-semibold">{error.word}</TableCell>
                                                    <TableCell>{error.detail}</TableCell>
                                                    <TableCell><Badge variant="destructive" className="capitalize">{error.errorType}</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="font-semibold text-muted-foreground">No errors to display.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
