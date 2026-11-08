
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { ErrorType, ProbeWordResult, ScoringBasis } from '@/lib/types';
import { scoringBasisLabel } from '@/lib/scoring';
import { useMemo, useState } from 'react';
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

const POSITIONS = ['initial', 'medial', 'final'] as const;

export function SharedCoverageDetails({ coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits, scoringBasis, countUnadministeredAsCorrect }: SharedCoverageDetailsProps) {
    const [inventoryView, setInventoryView] = useState<'in' | 'missing'>('in');

    // Phonemes in the probe set that the hook did not confirm into the inventory.
    // A position counts as attempted when a counted production landed there: either a
    // correct production (in coverage) or a real error record. Error records the hook
    // generates for skipped words carry the detail 'Skipped' and are not attempts.
    const missingInventory = useMemo(() => {
        const inventorySet = new Set(phoneticInventory);
        return phonemeSet
            .filter(phoneme => !inventorySet.has(phoneme))
            .map(phoneme => {
                const counts = coverage[phoneme] ?? { initial: 0, medial: 0, final: 0 };
                const attemptedPositions = POSITIONS.filter(position =>
                    counts[position] > 0 ||
                    errors.some(e => e.phoneme === phoneme && e.position === position && e.detail !== 'Skipped')
                );
                return { phoneme, counts, attempted: attemptedPositions.length > 0, attemptedPositions };
            });
    }, [phonemeSet, phoneticInventory, coverage, errors]);

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
                        {inventoryView === 'in'
                            ? "The following sounds have been produced correctly at least twice in one or more word positions and are considered part of the client's inventory."
                            : "Sounds in the probe set that have not yet been confirmed: not produced correctly twice in any single position. Attempted means at least one counted production was recorded for the sound."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="inline-flex gap-1 rounded-lg border p-1 mb-4" role="group" aria-label="Phonetic inventory view">
                        <button
                            type="button"
                            aria-pressed={inventoryView === 'in'}
                            onClick={() => setInventoryView('in')}
                            className={`min-h-[40px] px-4 rounded-md text-sm font-medium ${inventoryView === 'in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                            In inventory
                        </button>
                        <button
                            type="button"
                            aria-pressed={inventoryView === 'missing'}
                            onClick={() => setInventoryView('missing')}
                            className={`min-h-[40px] px-4 rounded-md text-sm font-medium ${inventoryView === 'missing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                            Missing
                        </button>
                    </div>
                    {inventoryView === 'in' ? (
                        phoneticInventory.length > 0 ? (
                            <div className="flex flex-wrap gap-x-2 gap-y-3">
                                {phoneticInventory.map(phoneme => (
                                    <Badge key={phoneme} variant="default" className="px-3 py-1 text-base font-body">
                                        /{phoneme}/
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No phonemes have been confirmed in the inventory yet.</p>
                        )
                    ) : missingInventory.length > 0 ? (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden space-y-2">
                                {missingInventory.map(({ phoneme, counts, attempted, attemptedPositions }) => (
                                    <div key={phoneme} className="p-3 border rounded-lg bg-card shadow-sm space-y-2">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <div className="font-semibold text-lg font-body">/{phoneme}/</div>
                                            <span className={attempted ? "text-xs font-medium" : "text-xs text-muted-foreground"}>
                                                {attempted ? 'Attempted, not established' : 'Not attempted'}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 text-center justify-end">
                                            {POSITIONS.map(position => (
                                                <div key={position}>
                                                    <div className="text-xs text-muted-foreground capitalize">{position}</div>
                                                    {attemptedPositions.includes(position) ? (
                                                        <CoverageBadge phoneme={phoneme} position={position} count={counts[position]} words={correctWords?.[phoneme]?.[position]} />
                                                    ) : (
                                                        <div className="flex min-h-[40px] min-w-[40px] items-center justify-center">
                                                            <span className="text-lg text-muted-foreground" aria-label={`${position} position not attempted`}>—</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Initial</TableHead>
                                            <TableHead className="text-center">Medial</TableHead>
                                            <TableHead className="text-center">Final</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {missingInventory.map(({ phoneme, counts, attempted, attemptedPositions }) => (
                                            <TableRow key={phoneme}>
                                                <TableCell className="font-semibold text-lg font-body">/{phoneme}/</TableCell>
                                                <TableCell className={attempted ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                                                    {attempted ? 'Attempted, not established' : 'Not attempted'}
                                                </TableCell>
                                                {POSITIONS.map(position => (
                                                    <TableCell key={position} className="text-center">
                                                        {attemptedPositions.includes(position) ? (
                                                            <CoverageBadge phoneme={phoneme} position={position} count={counts[position]} words={correctWords?.[phoneme]?.[position]} />
                                                        ) : (
                                                            <span className="text-lg text-muted-foreground" aria-label={`${position} position not attempted`}>—</span>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Every targeted phoneme is in the inventory.</p>
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
