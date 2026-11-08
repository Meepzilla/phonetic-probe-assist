
'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProbeSession } from '@/lib/types';
import { isProductionCounted, scoringBasisLabel } from '@/lib/scoring';
import { Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePhonemeCoverage } from '@/hooks/use-phoneme-coverage';

interface ExportDataProps {
    session: ProbeSession;
}

export function ExportData({ session }: ExportDataProps) {
    const { toast } = useToast();
    const { errors } = usePhonemeCoverage(session);

    const wordsProbedCount = session.scoringBasis === 'full'
        ? session.results.filter(r => !r.skipped).length
        : session.results.filter(r => !r.skipped && r.productions.some(p => isProductionCounted(p, session))).length;

    const escapeCsvField = (field: any): string => {
        const stringField = String(field ?? '');
        if (/[",\r\n]/.test(stringField)) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };


    const exportToCSV = () => {
        try {
            const headers = [
                "ClientID", "SessionDate", "Word", "Position", "TargetPhoneme",
                "TranscribedIPA", "IsCorrect", "ErrorType", "ErrorDetail"
            ];
            let csvContent = headers.map(escapeCsvField).join(",") + "\r\n";

            session.results.forEach(result => {
                if (result.skipped) return;
                result.phonemes.forEach((unit, index) => {
                    const prod = result.productions[index];
                    if (!isProductionCounted(prod, session)) return;
                    if (!unit.phoneme) return;
                    const rowData = [
                        session.clientId, session.date, result.word, unit.position,
                        unit.phoneme, prod.ipa, prod.isCorrect, prod.errorType || '', prod.errorDetail || ''
                    ];
                    csvContent += rowData.map(escapeCsvField).join(",") + "\r\n";
                });
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const sessionDate = new Date(session.date).toISOString().split('T')[0];
            const fileName = `phonetic-probe_${session.clientId}_${sessionDate}.csv`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

             toast({
                title: 'Export Successful',
                description: `Data has been exported to ${fileName}.`,
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'An unexpected error occurred during export.',
            });
            console.error('CSV Export Error:', error);
        }
    };
    
    const exportToEmail = () => {
        const correctWords = new Set<string>();
        const incorrectWords = new Map<string, string[]>();

        session.results.forEach(result => {
            const wordCounted = result.productions.some(prod => isProductionCounted(prod, session));
            if (!wordCounted) return;

            if (result.skipped) {
                if (!incorrectWords.has(result.word)) {
                    incorrectWords.set(result.word, []);
                }
                incorrectWords.get(result.word)!.push(`- Word was skipped.`);
                return;
            }

            const wordErrors: string[] = [];
            let isWordCorrect = true;

            result.productions.forEach((prod, index) => {
                if (!isProductionCounted(prod, session)) return;
                if (!prod.isCorrect) {
                    isWordCorrect = false;
                    const phoneme = result.phonemes[index];
                    let errorDetail = '';

                    switch (prod.errorType) {
                        case 'substitution':
                            errorDetail = `Target /${phoneme.phoneme}/: Produced as '${prod.ipa}' (substitution)`;
                            break;
                        case 'omission':
                            errorDetail = `Target /${phoneme.phoneme}/: Omitted (omission)`;
                            break;
                        case 'distortion':
                            errorDetail = `Target /${phoneme.phoneme}/: Produced as '${prod.ipa}' (distortion)`;
                            break;
                        case 'addition':
                             errorDetail = `Target /${phoneme.phoneme}/: Addition of '${prod.ipa}' (addition)`;
                            break;
                        default:
                            errorDetail = `Target /${phoneme.phoneme}/: Produced as '${prod.ipa}' (error)`;
                            break;
                    }
                    if (prod.errorDetail) {
                        errorDetail += ` - ${prod.errorDetail}`;
                    }
                    wordErrors.push(`- ${errorDetail}`);
                }
            });

            if (isWordCorrect) {
                correctWords.add(result.word);
            } else {
                incorrectWords.set(result.word, wordErrors);
            }
        });

        const subject = `Phonetic Probe Results for ${session.clientId}`;
        let body = `Hello,\n\nHere are the results from the recent phonetic probe session.\n\n`;
        body += `--- SESSION SUMMARY ---\n`;
        body += `Client: ${session.clientId}\n`;
        body += `Date: ${new Date(session.date).toLocaleDateString()}\n`;
        body += `Probe Type: ${session.probeType || 'General'}\n`;
        body += `Scoring Basis: ${scoringBasisLabel(session.scoringBasis)}; Unadministered Words Counted as Correct: ${session.countUnadministeredAsCorrect ? 'Yes' : 'No'}\n`;
        body += `Words Probed: ${wordsProbedCount} / ${session.wordList.length}\n\n`;

        body += `--- CORRECTLY PRODUCED WORDS ---\n`;
        if (correctWords.size > 0) {
            body += Array.from(correctWords).join(', ') + '\n\n';
        } else {
            body += 'None.\n\n';
        }

        body += `--- INCORRECTLY PRODUCED WORDS & ERRORS ---\n`;
        if (incorrectWords.size > 0) {
            incorrectWords.forEach((errors, word) => {
                body += `${word}:\n`;
                body += errors.join('\n') + '\n\n';
            });
        } else {
            body += 'None. All words that were attempted were produced correctly.\n\n';
        }

        body += `Best regards,\n\n`;

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };
    
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Export Session Data</CardTitle>
                <CardDescription>
                    Download the complete probe session data, including phonetic inventory and error analysis, for your records or share it via email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-6 bg-muted/50 rounded-lg text-center space-y-4">
                    <p className="text-muted-foreground">Client: <span className="font-bold text-foreground">{session.clientId}</span></p>
                    <p className="text-muted-foreground">Date: <span className="font-bold text-foreground">{new Date(session.date).toLocaleDateString()}</span></p>
                    <p className="text-muted-foreground">Words Probed: <span className="font-bold text-foreground">{wordsProbedCount} / {session.wordList.length}</span></p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button onClick={exportToCSV} className="w-full" size="lg" variant="outline">
                    <Download className="mr-2 h-5 w-5" />
                    Export to CSV
                </Button>
                <Button onClick={exportToEmail} className="w-full" size="lg">
                    <Mail className="mr-2 h-5 w-5" />
                    Export to Email
                </Button>
            </CardFooter>
        </Card>
    );
}
