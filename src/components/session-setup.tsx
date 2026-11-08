
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { INITIAL_WORD_LIST, WORD_BANK, SPANISH_WORD_BANK, SPANISH_INITIAL_WORD_LIST } from '@/lib/constants';
import { S_DEEP_PROBE_SECTIONS, S_WORD_BANK } from '@/lib/s-probe-constants';
import { TH_DEEP_PROBE_SECTIONS, TH_WORD_BANK } from '@/lib/th-probe-constants';
import { R_DEEP_PROBE_SECTIONS, R_WORD_BANK } from '@/lib/r-probe-constants';
import { L_DEEP_PROBE_SECTIONS, L_WORD_BANK } from '@/lib/l-probe-constants';
import { K_DEEP_PROBE_SECTIONS, K_WORD_BANK } from '@/lib/k-probe-constants';
import { G_DEEP_PROBE_SECTIONS, G_WORD_BANK } from '@/lib/g-probe-constants';
import { SH_DEEP_PROBE_SECTIONS, SH_WORD_BANK } from '@/lib/sh-probe-constants';
import { CH_DEEP_PROBE_SECTIONS, CH_WORD_BANK } from '@/lib/ch-probe-constants';
import { F_DEEP_PROBE_SECTIONS, F_WORD_BANK } from '@/lib/f-probe-constants';
import { T_DEEP_PROBE_SECTIONS, T_WORD_BANK } from '@/lib/t-probe-constants';
import { D_DEEP_PROBE_SECTIONS, D_WORD_BANK } from '@/lib/d-probe-constants';
import { M_DEEP_PROBE_SECTIONS, M_WORD_BANK } from '@/lib/m-probe-constants';
import { N_DEEP_PROBE_SECTIONS, N_WORD_BANK } from '@/lib/n-probe-constants';
import { B_DEEP_PROBE_SECTIONS, B_WORD_BANK } from '@/lib/b-probe-constants';
import { P_DEEP_PROBE_SECTIONS, P_WORD_BANK } from '@/lib/p-probe-constants';
import { PIP_SECTIONS, PIP_WORD_BANK } from '@/lib/pip-probe-constants';
import { useToast } from '@/hooks/use-toast';
import { completedMonthsFromBirthdate, formatAgeMonths } from '@/lib/student-age';
import type { ProbeSession, ProbeWordResult, PhonemeUnit, ProbeType, ScoringBasis } from '@/lib/types';
import { Info } from 'lucide-react';

interface SessionSetupProps {
    onSessionStart: (session: ProbeSession) => void;
    onOpenSettings: () => void;
}

const PROBE_DESCRIPTIONS: Record<ProbeType, string> = {
    'general': "Assesses a broad range of English phonemes in various word positions. The default word list is curated to screen for common error patterns, including challenging vowels and consonants, initial s-clusters, and minimal pairs.",
    'spanish-general': "Assesses a client's production of Spanish phonemes. The word list contains developmentally appropriate words to screen for common phonological processes, including consonant cluster reduction (e.g., 'plato', 'fruta'), weak syllable deletion ('teléfono'), and tap/trill contrasts ('pero'/'perro').",
    'pip': "The Phonemic Inventory Probe (PIP) assesses a child's phonemic inventory by targeting contrasts between /p/, /t/, /k/, /w/, /l/, and /r/. This helps determine a client's readiness for more complex three-element clusters like /spl-/.",
    'deep-s': "Provides an in-depth analysis of the /s/ phoneme across different word positions and phonetic contexts. This probe systematically examines /s/ in initial, medial, and final positions, as well as in common consonant blends like /st/, /sl/, and /sk/ to identify specific error patterns.",
    'deep-th': "Provides an in-depth analysis of voiced /ð/ and unvoiced /θ/ phonemes. This probe systematically examines these sounds in initial, medial, and final word positions and in consonant blends to diagnose issues with interdental fricatives.",
    'deep-r': "Provides a comprehensive analysis of consonantal and vocalic /r/ sounds. This probe systematically examines /r/ in initial, medial, and final positions, in various consonant clusters (e.g., /br/, /tr/), and in post-vocalic contexts (e.g., /ɑr/, /ɪr/, /ɛr/) to identify specific error patterns.",
    'deep-l': "Provides a comprehensive analysis of the /l/ phoneme in various contexts. This probe systematically examines /l/ in initial, medial, and final word positions, as well as in common consonant blends (e.g., /pl/, /bl/) and post-vocalic contexts to identify specific error patterns.",
    'deep-k': "Provides an in-depth analysis of the velar stop /k/. This probe systematically examines this sound in initial, medial, and final word positions and in various consonant clusters to assess patterns of fronting or backing.",
    'deep-g': "Provides an in-depth analysis of the velar stop /g/. This probe systematically examines this sound in initial, medial, and final word positions and in various consonant clusters to assess patterns of fronting or backing.",
    'deep-sh': "Provides an in-depth analysis of the palatal sounds /ʃ/ (sh) and /ʒ/ (zh). This probe systematically examines these sounds across word positions to identify error patterns related to palatal-alveolar sounds.",
    'deep-ch': "Provides an in-depth analysis of the affricate sounds /tʃ/ (ch) and /dʒ/ (dzh). This probe systematically examines these sounds across word positions to identify error patterns.",
    'deep-f': "Provides an in-depth analysis of the /f/ phoneme. This probe systematically examines /f/ in initial, medial, and final word positions, as well as in common consonant blends like /fl/ and /fr/, to identify specific error patterns with this labiodental fricative.",
    'deep-t': "Provides an in-depth analysis of the alveolar stop /t/. This probe systematically examines this sound in initial, medial, and final word positions, common consonant blends (e.g., /st/, /nt/), and in past-tense -ed endings to assess for patterns of voicing errors or stopping of fricatives.",
    'deep-d': "Provides an in-depth analysis of the alveolar stop /d/. This probe systematically examines this sound in initial, medial, and final word positions, common consonant blends (e.g., /dr/), and in past-tense -ed endings to assess for patterns of voicing errors or stopping of fricatives.",
    'deep-m': "Provides an in-depth analysis of the nasal sound /m/. This probe systematically examines this sound in initial, medial, and final word positions, as well as in common consonant blends like /mp/.",
    'deep-n': "Provides an in-depth analysis of the nasal sounds /n/ and /ŋ/. This probe systematically examines these sounds in initial, medial, and final word positions and in various consonant blends to assess for patterns of nasal emission or denasalization.",
    'deep-b': "Provides an in-depth analysis of the bilabial stop /b/. This probe systematically examines this sound in initial, medial, and final word positions and in various consonant blends.",
    'deep-p': "Provides an in-depth analysis of the bilabial stop /p/. This probe systematically examines this sound in initial, medial, and final word positions and in various consonant blends.",
};

const DEEP_PROBE_DATA: Record<string, { sections: any[], wordBank: Record<string, PhonemeUnit[]> }> = {
    'pip': { sections: PIP_SECTIONS, wordBank: PIP_WORD_BANK },
    'deep-s': { sections: S_DEEP_PROBE_SECTIONS, wordBank: S_WORD_BANK },
    'deep-th': { sections: TH_DEEP_PROBE_SECTIONS, wordBank: TH_WORD_BANK },
    'deep-r': { sections: R_DEEP_PROBE_SECTIONS, wordBank: R_WORD_BANK },
    'deep-l': { sections: L_DEEP_PROBE_SECTIONS, wordBank: L_WORD_BANK },
    'deep-k': { sections: K_DEEP_PROBE_SECTIONS, wordBank: K_WORD_BANK },
    'deep-g': { sections: G_DEEP_PROBE_SECTIONS, wordBank: G_WORD_BANK },
    'deep-sh': { sections: SH_DEEP_PROBE_SECTIONS, wordBank: SH_WORD_BANK },
    'deep-ch': { sections: CH_DEEP_PROBE_SECTIONS, wordBank: CH_WORD_BANK },
    'deep-f': { sections: F_DEEP_PROBE_SECTIONS, wordBank: F_WORD_BANK },
    'deep-t': { sections: T_DEEP_PROBE_SECTIONS, wordBank: T_WORD_BANK },
    'deep-d': { sections: D_DEEP_PROBE_SECTIONS, wordBank: D_WORD_BANK },
    'deep-m': { sections: M_DEEP_PROBE_SECTIONS, wordBank: M_WORD_BANK },
    'deep-n': { sections: N_DEEP_PROBE_SECTIONS, wordBank: N_WORD_BANK },
    'deep-b': { sections: B_DEEP_PROBE_SECTIONS, wordBank: B_WORD_BANK },
    'deep-p': { sections: P_DEEP_PROBE_SECTIONS, wordBank: P_WORD_BANK },
};


export function SessionSetup({ onSessionStart, onOpenSettings }: SessionSetupProps) {
    const [clientId, setClientId] = useState('Guest');
    const [wordList, setWordList] = useState(INITIAL_WORD_LIST.join(', '));
    const [probeType, setProbeType] = useState<ProbeType>('general');
    const [countUnadministeredAsCorrect, setCountUnadministeredAsCorrect] = useState(false);
    const [scoringBasis, setScoringBasis] = useState<ScoringBasis>('attempted');
    const [ageEntryMode, setAgeEntryMode] = useState<'age' | 'birthdate'>('age');
    const [ageYears, setAgeYears] = useState('');
    const [ageMonthsInput, setAgeMonthsInput] = useState('');
    const [birthdateInput, setBirthdateInput] = useState('');
    const { toast } = useToast();

    // Student age is optional and is entered either as years;months or
    // as a birthdate. Only the active mode's value is carried into the
    // session, so the stored state is never ambiguous. Invalid input
    // shows a message here and is not written to the session.
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let ageError: string | null = null;
    let enteredAgeMonths: number | null = null;
    let enteredBirthdate: string | null = null;
    if (ageEntryMode === 'age') {
        if (ageYears.trim() !== '' || ageMonthsInput.trim() !== '') {
            const years = Number(ageYears);
            const months = Number(ageMonthsInput);
            if (
                ageYears.trim() === '' ||
                ageMonthsInput.trim() === '' ||
                !Number.isInteger(years) ||
                !Number.isInteger(months)
            ) {
                ageError = 'Enter the age as whole years and months.';
            } else if (years < 0 || years > 21 || months < 0 || months > 11) {
                ageError = 'Years must be 0 to 21 and months 0 to 11.';
            } else {
                enteredAgeMonths = years * 12 + months;
            }
        }
    } else if (birthdateInput !== '') {
        if (birthdateInput > todayString) {
            ageError = 'Birthdate cannot be after today.';
        } else {
            const months = completedMonthsFromBirthdate(birthdateInput, todayString);
            if (months === null) {
                ageError = 'Enter a valid birthdate.';
            } else if (months > 263) {
                ageError = 'Birthdate gives an age over 21 years.';
            } else {
                enteredBirthdate = birthdateInput;
            }
        }
    }
    const enteredAgeResolvedMonths =
        ageEntryMode === 'age'
            ? enteredAgeMonths
            : enteredBirthdate !== null
              ? completedMonthsFromBirthdate(enteredBirthdate, todayString)
              : null;
    
    const handleStartSession = () => {
        if (!clientId.trim()) {
            toast({
                variant: 'destructive',
                title: 'Client ID is required.',
                description: 'Please enter a name or ID for the client.',
            });
            return;
        }

        let sessionWords: string[] = [];
        let sessionResults: ProbeWordResult[] = [];

        if (probeType.startsWith('deep-') || probeType === 'pip') {
            const probeKey = probeType as keyof typeof DEEP_PROBE_DATA;
            const probeData = DEEP_PROBE_DATA[probeKey];
            if (probeData) {
                probeData.sections.forEach(section => {
                    section.words.forEach(word => {
                        if (probeData.wordBank[word]) {
                            sessionWords.push(word);
                            const phonemes: PhonemeUnit[] = probeData.wordBank[word];
                            sessionResults.push({
                                word,
                                phonemes,
                                productions: phonemes.map(unit => ({ isCorrect: true, isScored: false, ipa: unit.phoneme })),
                                category: section.category,
                                subCategory: section.subCategory,
                            });
                        }
                    });
                });
            }
        } else if (probeType === 'spanish-general') {
            sessionWords = SPANISH_INITIAL_WORD_LIST.filter(w => w in SPANISH_WORD_BANK);
            sessionResults = sessionWords.map((word): ProbeWordResult => {
                const phonemes: PhonemeUnit[] = SPANISH_WORD_BANK[word];
                return {
                    word,
                    phonemes,
                    productions: phonemes.map(unit => ({ isCorrect: true, isScored: false, ipa: unit.phoneme })),
                };
            });
        } else { // general
            sessionWords = wordList.split(',').map(w => w.trim()).filter(w => w in WORD_BANK);
            if (sessionWords.length === 0) {
                 toast({
                    variant: 'destructive',
                    title: 'Invalid Word List',
                    description: 'None of the words are in the word bank. Please use words from the bank.',
                });
                return;
            }
            sessionResults = sessionWords.map((word): ProbeWordResult => {
                const phonemes: PhonemeUnit[] = WORD_BANK[word];
                return {
                    word,
                    phonemes,
                    productions: phonemes.map(unit => ({ isCorrect: true, isScored: false, ipa: unit.phoneme })),
                };
            });
        }
        
        if (sessionWords.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Valid Words Found',
                description: 'Could not start session because no valid words were found for the selected probe type.',
            });
            return;
        }

        const newSession: ProbeSession = {
            sessionId: `sess_${Date.now()}`,
            clientId,
            date: new Date().toISOString(),
            ...(enteredBirthdate !== null ? { studentBirthdate: enteredBirthdate } : {}),
            ...(enteredAgeMonths !== null ? { studentAgeMonths: enteredAgeMonths } : {}),
            wordList: Array.from(new Set(sessionWords)), // Ensure unique words
            results: sessionResults.filter((v, i, a) => a.findIndex(t => (t.word === v.word)) === i), // Ensure unique results
            probeType: probeType,
            countUnadministeredAsCorrect,
            scoringBasis,
        };
        onSessionStart(newSession);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Start New Probe Session</CardTitle>
                <CardDescription>Enter client details and configure the word list for the probe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="client-id">Client Name / ID</Label>
                    <Input
                        id="client-id"
                        placeholder="e.g., John Doe"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Student Age (optional)</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={ageEntryMode === 'age' ? 'default' : 'outline'}
                            className="min-h-[40px]"
                            aria-pressed={ageEntryMode === 'age'}
                            onClick={() => setAgeEntryMode('age')}
                        >
                            Age
                        </Button>
                        <Button
                            type="button"
                            variant={ageEntryMode === 'birthdate' ? 'default' : 'outline'}
                            className="min-h-[40px]"
                            aria-pressed={ageEntryMode === 'birthdate'}
                            onClick={() => setAgeEntryMode('birthdate')}
                        >
                            Birthdate
                        </Button>
                    </div>
                    {ageEntryMode === 'age' ? (
                        <div className="flex gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="student-age-years">Years</Label>
                                <Input
                                    id="student-age-years"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={21}
                                    placeholder="e.g., 4"
                                    value={ageYears}
                                    onChange={(e) => setAgeYears(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="student-age-months">Months</Label>
                                <Input
                                    id="student-age-months"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={11}
                                    placeholder="e.g., 7"
                                    value={ageMonthsInput}
                                    onChange={(e) => setAgeMonthsInput(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label htmlFor="student-birthdate">Birthdate</Label>
                            <Input
                                id="student-birthdate"
                                type="date"
                                value={birthdateInput}
                                onChange={(e) => setBirthdateInput(e.target.value)}
                            />
                        </div>
                    )}
                    {ageError ? (
                        <p className="text-sm text-destructive">{ageError}</p>
                    ) : enteredAgeResolvedMonths !== null ? (
                        <p className="text-sm text-muted-foreground">
                            Student age: {formatAgeMonths(enteredAgeResolvedMonths)}
                        </p>
                    ) : null}
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="probe-type">Probe Mode</Label>
                    <Select value={probeType} onValueChange={(val: ProbeType) => setProbeType(val)}>
                        <SelectTrigger id="probe-type">
                            <SelectValue placeholder="Select a probe mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">English Phonetic Inventory (General)</SelectItem>
                            <SelectItem value="spanish-general">Spanish Phonetic Inventory</SelectItem>
                            <SelectItem value="pip">Phonemic Inventory Probe (PIP)</SelectItem>
                            <SelectItem value="deep-s"><span className="text-chart-1 font-bold">/s/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-th"><span className="text-chart-1 font-bold">/th/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-r"><span className="text-chart-1 font-bold">/r/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-l"><span className="text-chart-1 font-bold">/l/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-f"><span className="text-chart-1 font-bold">/f/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-k"><span className="text-chart-1 font-bold">/k/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-g"><span className="text-chart-1 font-bold">/g/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-t"><span className="text-chart-1 font-bold">/t/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-d"><span className="text-chart-1 font-bold">/d/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-b"><span className="text-chart-1 font-bold">/b/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-p"><span className="text-chart-1 font-bold">/p/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-sh"><span className="text-chart-1 font-bold">/sh/ &amp; /zh/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-ch"><span className="text-chart-1 font-bold">/ch/ &amp; /dzh/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-m"><span className="text-chart-1 font-bold">/m/</span> Deep Screening Probe</SelectItem>
                            <SelectItem value="deep-n"><span className="text-chart-1 font-bold">/n/ &amp; /ŋ/</span> Deep Screening Probe</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <Card className="bg-muted/30 border-l-4 border-accent">
                    <CardContent className="p-4 flex gap-4 items-start">
                         <Info className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            {PROBE_DESCRIPTIONS[probeType]}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Scoring Options</CardTitle>
                        <CardDescription>
                            Choose how unadministered words and percentage denominators are handled for this session.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="count-unadministered">Count unadministered words as correct</Label>
                                <p className="text-sm text-muted-foreground">
                                    For mark-errors-only administration: words that are presented but not scored count as correct in every result and export.
                                </p>
                            </div>
                            <Switch
                                id="count-unadministered"
                                checked={countUnadministeredAsCorrect}
                                onCheckedChange={setCountUnadministeredAsCorrect}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Scoring basis</Label>
                            <RadioGroup value={scoringBasis} onValueChange={(val: ScoringBasis) => setScoringBasis(val)} className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="attempted" id="basis-attempted" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="basis-attempted">Percent of attempted</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Percentages use only the words actually administered as the denominator.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="full" id="basis-full" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="basis-full">Percent of full probe</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Percentages use the full planned word list as the denominator, including words that were not administered.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-sm text-muted-foreground">
                    Word images are managed under Settings.{' '}
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={onOpenSettings}>
                        Open Settings
                    </Button>
                </p>

                {probeType === 'general' && (
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg">Word List</CardTitle>
                            <CardDescription>
                                Enter a comma-separated list of words.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="word-list">Probe Words</Label>
                                <Textarea
                                    id="word-list"
                                    name="wordList"
                                    placeholder="e.g., sun, cat, dog"
                                    value={wordList}
                                    onChange={(e) => setWordList(e.target.value)}
                                    rows={5}
                                    disabled={probeType !== 'general'}
                                />
                            </div>
                        </CardContent>
                    </Card>

                )}
                 {probeType !== 'general' && probeType !== 'spanish-general' && (
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg">Structured Probe</CardTitle>
                            <CardDescription>
                                This mode uses a predefined, structured word list to perform a deep screening. The word list is not editable.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleStartSession} className="w-full" size="lg">Start Probe</Button>
            </CardFooter>
        </Card>
    );
}
