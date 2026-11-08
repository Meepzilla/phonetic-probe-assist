'use client'

import type { ProbeSession } from '@/lib/types';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';
import { SharedCoverageDetails } from './shared-coverage-details';
import { PCC } from './pcc';

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
        return <PipResults session={session} />;
    }
    if (session.probeType === 'deep-s') {
        return <SDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-th') {
        return <ThDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-r') {
        return <RDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-l') {
        return <LDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-k') {
        return <KDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-g') {
        return <GDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-sh') {
        return <ShDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-ch') {
        return <ChDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-f') {
        return <FDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-t') {
        return <TDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-d') {
        return <DDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-m') {
        return <MDeepProbeResults session={session} />;
    }
     if (session.probeType === 'deep-n') {
        return <NDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-b') {
        return <BDeepProbeResults session={session} />;
    }
    if (session.probeType === 'deep-p') {
        return <PDeepProbeResults session={session} />;
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
        </div>
    );
}
