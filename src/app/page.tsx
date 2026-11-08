'use client';

import { useEffect, useRef, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { PhoneticProbeClient } from '@/components/phonetic-probe-client';
import type { ProbeSession } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  SESSION_STORAGE_VERSION,
  clearSavedSession,
  countScoredWords,
  loadSavedSession,
  saveSavedSession,
} from '@/lib/session-storage';
import type { SavedSessionEnvelope } from '@/lib/session-storage';

export default function Home() {
  const [session, setSession] = useState<ProbeSession | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [savedSession, setSavedSession] = useState<SavedSessionEnvelope | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  // True between a session change and the write-through save that follows it.
  // Drives the beforeunload guard; stays true when a save has failed.
  const unsavedChangesRef = useRef(false);

  // On load, offer any saved in-progress session for resume or discard.
  // Corrupt or version-mismatched saves are cleared inside loadSavedSession.
  useEffect(() => {
    const restored = loadSavedSession();
    if (restored) {
      setSavedSession(restored);
    }
  }, []);

  // Write-through persistence: every session, phase, or word-position change
  // is saved. After a quota failure the write is not retried for this session;
  // starting a new session resets the failure so saving is attempted again.
  useEffect(() => {
    if (!session || saveFailed) return;
    const saved = saveSavedSession({
      version: SESSION_STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      session,
      activeTab,
      currentWordIndex,
    });
    if (saved) {
      unsavedChangesRef.current = false;
    } else {
      setSaveFailed(true);
    }
  }, [session, activeTab, currentWordIndex, saveFailed]);

  // Warn before the tab closes or reloads while a session has changes that
  // have not reached storage, including when saving has failed outright.
  useEffect(() => {
    if (!session) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!unsavedChangesRef.current && !saveFailed) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session, saveFailed]);

  const handleSessionStart = (newSession: ProbeSession) => {
    unsavedChangesRef.current = true;
    setSaveFailed(false);
    setSession(newSession);
    setCurrentWordIndex(0);
    setActiveTab('probe');
  };

  const handleUpdateResult = (
    index: number,
    updatedResult: ProbeSession['results'][0]
  ) => {
    unsavedChangesRef.current = true;
    setSession((previous) => {
      if (!previous) return previous;
      const newResults = [...previous.results];
      newResults[index] = updatedResult;
      return { ...previous, results: newResults };
    });
  };

  const handleSetActiveTab = (tab: string) => {
    unsavedChangesRef.current = true;
    setActiveTab(tab);
  };

  const handleSetCurrentWordIndex = (index: number) => {
    unsavedChangesRef.current = true;
    setCurrentWordIndex(index);
  };

  const handleFinishProbe = () => {
    handleSetActiveTab('coverage');
  };

  const handleResumeSavedSession = () => {
    if (!savedSession) return;
    const lastIndex = Math.max(savedSession.session.results.length - 1, 0);
    setSession(savedSession.session);
    setActiveTab(savedSession.activeTab);
    setCurrentWordIndex(
      Math.min(Math.max(savedSession.currentWordIndex, 0), lastIndex)
    );
    setSavedSession(null);
  };

  const handleDiscardSavedSession = () => {
    clearSavedSession();
    setSavedSession(null);
  };

  return (
    <div className="min-h-screen w-full bg-background font-body">
      <header className="bg-card border-b sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 bg-primary/20 text-primary rounded-lg">
            <BookMarked className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-foreground">
            Phonetic Probe Assist
          </h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleSetActiveTab} className="w-full">
        <div className="bg-card border-b">
          <TabsList className="container mx-auto flex w-full overflow-x-auto h-auto p-0 bg-transparent rounded-none">
            <TabsTrigger
              value="setup"
              className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              1. Session Setup
            </TabsTrigger>
            <TabsTrigger
              value="word-list"
              disabled={!session}
              className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              2. Word List
            </TabsTrigger>
            <TabsTrigger
              value="probe"
              disabled={!session}
              className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              3. Administer Probe
            </TabsTrigger>
            <TabsTrigger
              value="coverage"
              disabled={!session}
              className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              4. Coverage & Results
            </TabsTrigger>
            <TabsTrigger
              value="export"
              disabled={!session}
              className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              5. Export
            </TabsTrigger>
          </TabsList>
        </div>
        <main className="container mx-auto px-6 py-8">
          {saveFailed && session && (
            <div
              role="alert"
              className="w-full max-w-6xl mx-auto mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              This session cannot be saved on this device because the stored
              images are too large. Keep this tab open and export the results
              before closing it, since refreshing or closing now will lose the
              session.
            </div>
          )}
          {savedSession && !session ? (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Saved session found</CardTitle>
                <CardDescription>
                  A probe session was saved on this device. Resume it to pick
                  up where it left off, or discard it to start over.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Client: {savedSession.session.clientId}</p>
                <p>Probe type: {savedSession.session.probeType ?? 'general'}</p>
                <p>Saved: {new Date(savedSession.savedAt).toLocaleString()}</p>
                <p>
                  Words scored: {countScoredWords(savedSession.session)} of{' '}
                  {savedSession.session.wordList.length}
                </p>
              </CardContent>
              <CardFooter className="gap-3">
                <Button onClick={handleResumeSavedSession}>
                  Resume session
                </Button>
                <Button variant="outline" onClick={handleDiscardSavedSession}>
                  Discard saved session
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <PhoneticProbeClient
              session={session}
              currentWordIndex={currentWordIndex}
              onSessionStart={handleSessionStart}
              setCurrentWordIndex={handleSetCurrentWordIndex}
              updateResult={handleUpdateResult}
              onFinish={handleFinishProbe}
            />
          )}
        </main>
      </Tabs>
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          Powered by Firebase Studio.
        </div>
      </footer>
    </div>
  );
}
