'use client';

import { TabsContent } from '@/components/ui/tabs';
import { SessionSetup } from '@/components/session-setup';
import { ProbeAdministration } from '@/components/probe-administration';
import { CoverageTracking } from '@/components/coverage-tracking';
import { ExportData } from '@/components/export-data';
import type { ProbeSession } from '@/lib/types';
import { WordListDisplay } from './word-list-display';

interface PhoneticProbeClientProps {
  session: ProbeSession | null;
  currentWordIndex: number;
  onSessionStart: (session: ProbeSession) => void;
  setCurrentWordIndex: (index: number) => void;
  updateResult: (
    index: number,
    updatedResult: ProbeSession['results'][0]
  ) => void;
  onFinish: () => void;
}

export function PhoneticProbeClient({
  session,
  currentWordIndex,
  onSessionStart,
  setCurrentWordIndex,
  updateResult,
  onFinish,
}: PhoneticProbeClientProps) {
  return (
    <>
      <TabsContent value="setup">
        <SessionSetup onSessionStart={onSessionStart} />
      </TabsContent>

      <TabsContent value="word-list">
        {session && <WordListDisplay session={session} />}
      </TabsContent>

      <TabsContent value="probe">
        {session && (
          <ProbeAdministration
            session={session}
            currentWordIndex={currentWordIndex}
            setCurrentWordIndex={setCurrentWordIndex}
            updateResult={updateResult}
            onFinish={onFinish}
          />
        )}
      </TabsContent>

      <TabsContent value="coverage">
        {session && <CoverageTracking session={session} />}
      </TabsContent>

      <TabsContent value="export">
        {session && <ExportData session={session} />}
      </TabsContent>
    </>
  );
}
