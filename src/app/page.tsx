'use client';

import { useState } from 'react';
import { BookMarked } from 'lucide-react';
import { PhoneticProbeClient } from '@/components/phonetic-probe-client';
import type { ProbeSession } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [session, setSession] = useState<ProbeSession | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const handleSessionStart = (newSession: ProbeSession) => {
    setSession(newSession);
    setCurrentWordIndex(0);
    setActiveTab('probe');
  };

  const handleUpdateResult = (
    index: number,
    updatedResult: ProbeSession['results'][0]
  ) => {
    if (!session) return;
    const newResults = [...session.results];
    newResults[index] = updatedResult;
    setSession({ ...session, results: newResults });
  };

  const handleFinishProbe = () => {
    setActiveTab('coverage');
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <PhoneticProbeClient
            session={session}
            currentWordIndex={currentWordIndex}
            onSessionStart={handleSessionStart}
            setCurrentWordIndex={setCurrentWordIndex}
            updateResult={handleUpdateResult}
            onFinish={handleFinishProbe}
          />
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
