'use client'

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProbeSession } from '@/lib/types';
import {
    analyzePhonologicalProcesses,
    formatAgeReference,
    PHONOLOGICAL_PROCESS_AGE_REFERENCE,
    PHONOLOGICAL_PROCESS_DEFINITIONS,
    type PhonologicalProcessResult,
} from '@/lib/phonological-processes';

interface PhonologicalProcessesProps {
    session: ProbeSession;
}

function ProcessRow({ process }: { process: PhonologicalProcessResult }) {
    const [expanded, setExpanded] = useState(false);
    const panelId = `phonological-process-examples-${process.id}`;

    return (
        <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{process.label}</p>
                {process.present && <Badge>Present</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
                {process.occurrences} of {process.opportunities} opportunities · {process.percent}%
            </p>
            {PHONOLOGICAL_PROCESS_AGE_REFERENCE[process.id] && (
                <p className="text-sm text-muted-foreground">
                    {formatAgeReference(PHONOLOGICAL_PROCESS_AGE_REFERENCE[process.id])}
                </p>
            )}
            {process.examples.length > 0 && (
                <>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-[40px] px-2 -ml-2"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {expanded ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        Examples ({process.examples.length})
                    </Button>
                    {expanded && (
                        <ul id={panelId} className="space-y-1 text-sm">
                            {process.examples.map((example, index) => (
                                <li
                                    key={`${example.word}-${example.target}-${example.position}-${index}`}
                                    className="font-body"
                                >
                                    {example.word}: /{example.target}/ → {example.produced} ({example.position})
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}

function AgeReferenceSection() {
    const [expanded, setExpanded] = useState(false);
    const panelId = 'phonological-process-age-reference';

    return (
        <div className="border-t pt-3 space-y-2">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[40px] px-2 -ml-2"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded((value) => !value)}
            >
                {expanded ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                )}
                Elimination age reference (all processes)
            </Button>
            {expanded && (
                <ul id={panelId} className="divide-y">
                    {PHONOLOGICAL_PROCESS_DEFINITIONS.map((definition) => {
                        const reference = PHONOLOGICAL_PROCESS_AGE_REFERENCE[definition.id];
                        if (!reference) return null;
                        return (
                            <li key={definition.id} className="py-2 space-y-0.5">
                                <p className="text-sm font-medium">{definition.label}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatAgeReference(reference)}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export function PhonologicalProcesses({ session }: PhonologicalProcessesProps) {
    const analysis = useMemo(() => analyzePhonologicalProcesses(session), [session]);

    // Present processes first by percent descending, then the rest by
    // occurrences descending; ties fall back to percent, then label, so the
    // order is stable.
    const sortedProcesses = useMemo(() => {
        return [...analysis.processes].sort((a, b) => {
            if (a.present !== b.present) return a.present ? -1 : 1;
            if (a.present && b.percent !== a.percent) return b.percent - a.percent;
            if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
            if (b.percent !== a.percent) return b.percent - a.percent;
            return a.label.localeCompare(b.label);
        });
    }, [analysis]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Phonological Processes</CardTitle>
                <CardDescription>
                    Patterns detected in the counted productions of this session. A process is
                    marked Present when it occurs at least twice and in at least 40% of its
                    opportunities.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {analysis.countedProductions === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Phonological processes appear once productions are scored.
                    </p>
                ) : sortedProcesses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No phonological processes were detected in the scored productions.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Based on {analysis.countedProductions} counted productions across{' '}
                            {analysis.countedWords} words.
                        </p>
                        {sortedProcesses.map((process) => (
                            <ProcessRow key={process.id} process={process} />
                        ))}
                        <p className="text-xs text-muted-foreground">
                            Assimilation is approximate: only place assimilation toward another
                            target consonant in the same word can be detected from these
                            productions. Processes that need syllable counts, such as weak
                            syllable deletion, are not covered.
                        </p>
                    </>
                )}
                <AgeReferenceSection />
                <p className="text-xs text-muted-foreground">
                    Elimination age sources: Bowen (2011, after Grunwell, 1987); ASHA, Selected
                    Phonological Patterns; Peña-Brooks &amp; Hegde (2015); Bleile (1995);
                    Linguisystems (2008); Lowe (2000). Ages are typical elimination points from
                    English normative data. They vary across studies and across children, and
                    Spanish speech development follows a different timetable.
                </p>
            </CardContent>
        </Card>
    );
}
