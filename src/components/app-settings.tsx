'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    deleteWordImage,
    getWordImage,
    importWordImagePack,
    listWordImages,
    type WordImageMeta,
} from '@/lib/word-image-db';
import { Trash2 } from 'lucide-react';

/**
 * Word image library manager. Lists the images saved for words on this
 * device; each one appears automatically in every session that probes its
 * word. Images are added during probe administration by uploading an image
 * for a word, and removed here or from the administration image dialog.
 */
function WordImageLibrary() {
    const [records, setRecords] = useState<WordImageMeta[] | null>(null);
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
    const [unavailable, setUnavailable] = useState(false);
    const [removeError, setRemoveError] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const metas = await listWordImages();
            setRecords(metas);
            setUnavailable(false);
            const entries = await Promise.all(
                metas.map(async (meta) => {
                    const record = await getWordImage(meta.key);
                    return [meta.key, record?.imageDataUrl] as const;
                })
            );
            const loaded: Record<string, string> = {};
            entries.forEach(([key, dataUrl]) => {
                if (dataUrl !== undefined) loaded[key] = dataUrl;
            });
            setThumbnails(loaded);
        } catch {
            setUnavailable(true);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleRemove = async (key: string) => {
        try {
            await deleteWordImage(key);
            setRemoveError(null);
            await refresh();
        } catch {
            setRemoveError('That image could not be removed. Try again.');
        }
    };

    const handleImportPack = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Reset the input so the same file can be chosen again later.
        event.target.value = '';
        if (!file) return;
        setImportSummary(null);
        setImportError(null);
        try {
            const result = await importWordImagePack(await file.text());
            if (!result.ok) {
                setImportError(result.error);
                return;
            }
            const parts = [`Imported ${result.imported} ${result.imported === 1 ? 'image' : 'images'}.`];
            if (result.skippedExisting > 0) {
                parts.push(`${result.skippedExisting} already had ${result.skippedExisting === 1 ? 'an image' : 'images'} and ${result.skippedExisting === 1 ? 'was' : 'were'} kept.`);
            }
            if (result.skippedInvalid > 0) {
                parts.push(`${result.skippedInvalid} ${result.skippedInvalid === 1 ? 'record was' : 'records were'} not valid and skipped.`);
            }
            setImportSummary(parts.join(' '));
            await refresh();
        } catch {
            setImportError('That image pack could not be imported. Nothing was imported.');
        }
    };

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg">Word Images</CardTitle>
                <CardDescription>
                    Images saved for words on this device. A saved image appears automatically in every session that probes its word. Add one by uploading an image for a word during a probe.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {unavailable && (
                    <p className="text-sm text-muted-foreground">
                        The word image library is unavailable on this device.
                    </p>
                )}
                {!unavailable && records === null && (
                    <p className="text-sm text-muted-foreground">Loading saved images...</p>
                )}
                {!unavailable && records !== null && records.length === 0 && (
                    <p className="text-sm text-muted-foreground">No images saved yet.</p>
                )}
                {!unavailable && records !== null && records.length > 0 && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {records.length} {records.length === 1 ? 'image' : 'images'} saved
                        </p>
                        <ul className="divide-y rounded-md border">
                            {records.map((record) => (
                                <li key={record.key} className="flex items-center gap-3 p-2">
                                    {thumbnails[record.key] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={thumbnails[record.key]}
                                            alt={record.word}
                                            className="h-10 w-10 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-muted" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{record.word}</p>
                                        <p className="text-xs text-muted-foreground">{record.scope === 'es' ? 'Spanish' : 'English'}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemove(record.key)}
                                    >
                                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                {removeError && <p className="text-sm text-destructive">{removeError}</p>}
                {!unavailable && (
                    <div className="space-y-2 border-t pt-3">
                        <Label htmlFor="image-pack-import">Import image pack</Label>
                        <Input
                            id="image-pack-import"
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImportPack}
                        />
                        <p className="text-sm text-muted-foreground">
                            Adds images from a pack file for words that do not have one yet. Images already saved are never replaced.
                        </p>
                        {importSummary && <p className="text-sm">{importSummary}</p>}
                        {importError && <p className="text-sm text-destructive">{importError}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Settings view. Holds device-level managers that do not belong to a single
 * session, starting with the word image library.
 */
export function AppSettings() {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-headline font-bold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Data stored on this device, shared across sessions.
                </p>
            </div>
            <WordImageLibrary />
        </div>
    );
}
