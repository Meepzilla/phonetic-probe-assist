'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProbeSession } from '@/lib/types';

interface WordListDisplayProps {
    session: ProbeSession;
}

export function WordListDisplay({ session }: WordListDisplayProps) {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Session Word List</CardTitle>
                <CardDescription>
                    This is the full list of words and phrases being probed in this session for client: <span className="font-bold text-foreground">{session.clientId}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {session.wordList.map((word, index) => (
                           <div key={index} className="p-2 bg-muted/50 rounded-md text-center">
                               <p className="font-body text-lg">{word}</p>
                           </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
