'use client'

import type { ProbeSession } from '@/lib/types';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { PCC } from './pcc';
import { PhonologicalProcesses } from './phonological-processes';

import { SDeepProbeResults } from './s-deep-probe-results';
import { ThDeepProbeResults } from './th-deep-probe-results';
import { RDeepProbeResults } from './r-deep-probe-results';
import { LDeepProbeResults } from './l-deep-probe-results';
import { KDeepProbeResults } from './k-deep-probe-results';
import { GDeepProbeResults } from './g-deep-probe-results';
import { ShDeepProbeResults } from './sh-deep-probe-results';
import { ChDeepProbeResults } from './ch-deep-probe-results';
import { FDeepProbeResults } from './f-deep-probe-results';
import { TDeepProbeResults } from './t-deep-probe-results';
import { DDeepProbeResults } from './d-deep-probe-results';
import { MDeepProbeResults } from './m-deep-probe-results';
import { NDeepProbeResults } from './n-deep-probe-results';
import { BDeepProbeResults } from './b-deep-probe-results';
import { PDeepProbeResults } from './p-deep-probe-results';
import { PipResults } from './pip-results';


interface CoverageTrackingProps {
    session: ProbeSession;
}

export function CoverageTracking({ session }: CoverageTrackingProps) {
    if (session.probeType === 'pip') {
        return (
            <div className="space-y-8">
                <PipResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-s') {
        return (
            <div className="space-y-8">
                <SDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-th') {
        return (
            <div className="space-y-8">
                <ThDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-r') {
        return (
            <div className="space-y-8">
                <RDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-l') {
        return (
            <div className="space-y-8">
                <LDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-k') {
        return (
            <div className="space-y-8">
                <KDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-g') {
        return (
            <div className="space-y-8">
                <GDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-sh') {
        return (
            <div className="space-y-8">
                <ShDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-ch') {
        return (
            <div className="space-y-8">
                <ChDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-f') {
        return (
            <div className="space-y-8">
                <FDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-t') {
        return (
            <div className="space-y-8">
                <TDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-d') {
        return (
            <div className="space-y-8">
                <DDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-m') {
        return (
            <div className="space-y-8">
                <MDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
     if (session.probeType === 'deep-n') {
        return (
            <div className="space-y-8">
                <NDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-b') {
        return (
            <div className="space-y-8">
                <BDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }
    if (session.probeType === 'deep-p') {
        return (
            <div className="space-y-8">
                <PDeepProbeResults session={session} />
                <PhonologicalProcesses session={session} />
            </div>
        );
    }

    // This part is for 'general' and 'spanish-general' probes
    const { coverage, errors, phoneticInventory, phonemeSet, correctWords, attemptedWords, scoredUnits } = usePhonemeCoverage(session);

    return (
        <div className="space-y-8">
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
            <PhonologicalProcesses session={session} />
        </div>
    );
}
